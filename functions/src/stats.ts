import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const inc = admin.firestore.FieldValue.increment;

/**
 * Platform analytics. Every counter is written here, server-side; clients can only read (admins).
 *
 *   stats_daily/{YYYY-MM-DD}   one doc per IST day:
 *     visitors            unique browsers that opened the site that day
 *     newVisitors         of those, first visit ever
 *     activeStudents      signed-in students seen that day
 *     registrations       new accounts (Firebase Auth onCreate)
 *     lessonsStarted      first time a student opened a lesson
 *     lessonsCompleted    lessons marked complete
 *     doubtsAsked         doubts submitted
 *   stats/totals            the same counters since launch (visitors = unique browsers ever)
 *   visitors/{visitorId}    one doc per browser: firstSeen, lastSeenDate, visitDays, uid (once signed in)
 */
export type DailyCounter =
  | 'visitors'
  | 'newVisitors'
  | 'activeStudents'
  | 'registrations'
  | 'lessonsStarted'
  | 'lessonsCompleted'
  | 'doubtsAsked';

export function istDateKey(date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Adds to today's counters and the all-time totals (totals may use different keys, e.g. unique visitors). */
export function bumpStats(
  daily: Partial<Record<DailyCounter, number>>,
  totals: Partial<Record<DailyCounter, number>> = daily,
  tx?: admin.firestore.Transaction
) {
  const day = istDateKey();
  const toInc = (m: Partial<Record<DailyCounter, number>>) =>
    Object.fromEntries(Object.entries(m).map(([k, v]) => [k, inc(v as number)]));
  const now = admin.firestore.FieldValue.serverTimestamp();
  const dailyRef = db.collection('stats_daily').doc(day);
  const totalsRef = db.collection('stats').doc('totals');
  const dailyData = { ...toInc(daily), date: day, updated_at: now };
  const totalsData = { ...toInc(totals), updated_at: now };
  if (tx) {
    tx.set(dailyRef, dailyData, { merge: true });
    if (Object.keys(totals).length) tx.set(totalsRef, totalsData, { merge: true });
    return Promise.resolve();
  }
  const batch = db.batch();
  batch.set(dailyRef, dailyData, { merge: true });
  if (Object.keys(totals).length) batch.set(totalsRef, totalsData, { merge: true });
  return batch.commit();
}

const VISITOR_ID = /^[a-z0-9-]{16,64}$/i;

/**
 * Called once per browser per IST day (the client remembers it already reported today).
 * Deduplicates server-side too, so replays cannot inflate the numbers.
 */
export const trackVisit = functions
  .runWith({ enforceAppCheck: true })
  .https.onCall(async (data, context) => {
    const visitorId = typeof data?.visitorId === 'string' ? data.visitorId : '';
    if (!VISITOR_ID.test(visitorId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Bad visitor id.');
    }
    const uid = context.auth?.uid;
    const today = istDateKey();
    const visitorRef = db.collection('visitors').doc(visitorId);
    const userRef = uid ? db.collection('users').doc(uid) : null;

    await db.runTransaction(async (tx) => {
      const [visitor, user] = await Promise.all([tx.get(visitorRef), userRef ? tx.get(userRef) : Promise.resolve(null)]);
      const daily: Partial<Record<DailyCounter, number>> = {};
      const totals: Partial<Record<DailyCounter, number>> = {};
      const consented = Boolean(user?.exists && user.get('consent.status') === 'granted');
      // DPDP s.9(3): no tracking of children, so a child's browser is never linked to their account.
      const linkUid = consented && user!.get('consent.age_group') !== 'child' ? uid : undefined;

      if (!visitor.exists) {
        daily.visitors = 1;
        daily.newVisitors = 1;
        totals.visitors = 1;
        tx.set(visitorRef, {
          firstSeen: admin.firestore.FieldValue.serverTimestamp(),
          firstSeenDate: today,
          lastSeenDate: today,
          visitDays: 1,
          ...(linkUid ? { uid: linkUid } : {}),
        });
      } else if (visitor.get('lastSeenDate') !== today) {
        daily.visitors = 1;
        tx.update(visitorRef, { lastSeenDate: today, visitDays: inc(1), ...(linkUid ? { uid: linkUid } : {}) });
      } else if (linkUid && !visitor.get('uid')) {
        tx.update(visitorRef, { uid: linkUid });
      }

      // Only consented, non-admin accounts count as active students.
      if (consented && user!.get('role') !== 'admin' && user!.get('last_seen_date') !== today) {
        daily.activeStudents = 1;
        tx.update(userRef!, { last_seen_date: today });
      }

      if (Object.keys(daily).length) await bumpStats(daily, totals, tx);
    });
    return { ok: true };
  });

export const countRegistration = functions.auth.user().onCreate(() => bumpStats({ registrations: 1 }));

export const countLessonProgress = functions.firestore
  .document('users/{uid}/user_progress/{videoId}')
  .onWrite((change) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    if (!after) return null;
    const daily: Partial<Record<DailyCounter, number>> = {};
    if (!before) daily.lessonsStarted = 1;
    if (after.completed === true && before?.completed !== true) daily.lessonsCompleted = 1;
    return Object.keys(daily).length ? bumpStats(daily) : null;
  });
