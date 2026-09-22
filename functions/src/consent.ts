import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { APP_URL, EMAIL_FROM, RESEND_API_KEY } from './reminders';
import { eraseUserData } from './account';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

/**
 * DPDP Act 2023 consent. Consent lives on users/{uid}.consent and is written ONLY here
 * (Firestore rules block clients from touching the field), so a student cannot mark their own
 * parental consent as given.
 *
 *   adult (18+): the user reads the notice and gives consent themselves           -> status 'granted'
 *   child (<18): the user names a parent/guardian; the parent signs in with that
 *                exact, verified email address, reads the notice, declares they are
 *                the parent/lawful guardian and 18+, then approves or refuses     -> 'pending_parent' -> 'granted' | erased
 *
 * Until status is 'granted' the app shows only the consent screen, and the doubts, feedback,
 * reminders and analytics functions ignore the account.
 */
export const NOTICE_VERSION = '2026-09';
const LANGS = ['en', 'hi'];
const REQUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_REQUESTS_PER_DAY = 3;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ConsentStatus = 'granted' | 'pending_parent';

/** Used by other callables: refuse to process accounts without valid consent. */
export async function requireConsent(uid: string) {
  const snap = await db.collection('users').doc(uid).get();
  if (snap.get('consent.status') !== 'granted') {
    throw new functions.https.HttpsError('failed-precondition', 'Please complete the consent step first.');
  }
  return snap;
}

const lang = (v: unknown) => (typeof v === 'string' && LANGS.includes(v) ? v : 'en');
const maskEmail = (e: string) => e.replace(/^(.)(.*)(@.*)$/, (_m, a, mid, dom) => `${a}${'•'.repeat(Math.min(6, mid.length))}${dom}`);

export const recordAdultConsent = functions
  .runWith({ enforceAppCheck: true })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in first.');
    if (data?.declaredAdult !== true || data?.agreed !== true) {
      throw new functions.https.HttpsError('invalid-argument', 'Confirm your age and agree to the notice to continue.');
    }
    const ref = db.collection('users').doc(context.auth.uid);
    const snap = await ref.get();
    // Once someone has declared they are under 18, only a parent (or the grievance officer) can change that.
    if (snap.get('consent.age_group') === 'child') {
      throw new functions.https.HttpsError('failed-precondition', 'This account needs a parent or guardian to approve it.');
    }
    await ref.set(
      {
        consent: {
          status: 'granted',
          age_group: 'adult',
          method: 'self',
          notice_version: NOTICE_VERSION,
          language: lang(data?.language),
          granted_at: now(),
        },
      },
      { merge: true }
    );
    return { status: 'granted' };
  });

export const requestParentalConsent = functions
  .runWith({ enforceAppCheck: true, secrets: [RESEND_API_KEY] })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in first.');
    const uid = context.auth.uid;
    const parentEmail = String(data?.parentEmail || '').trim().toLowerCase();
    const parentName = String(data?.parentName || '').trim().slice(0, 80);
    if (!EMAIL.test(parentEmail) || !parentName) {
      throw new functions.https.HttpsError('invalid-argument', "Enter your parent or guardian's name and email address.");
    }
    if (parentEmail === String(context.auth.token.email || '').toLowerCase()) {
      throw new functions.https.HttpsError('invalid-argument', "Use your parent's or guardian's own email address, not yours.");
    }

    const userRef = db.collection('users').doc(uid);
    const limitRef = db.collection('rate_limits').doc(`consent_${uid}`);
    const token = randomBytes(24).toString('hex');
    const requestRef = db.collection('consent_requests').doc(token);
    let childName = 'Your child';

    await db.runTransaction(async (tx) => {
      const [user, limit] = await Promise.all([tx.get(userRef), tx.get(limitRef)]);
      if (user.get('consent.status') === 'granted') {
        throw new functions.https.HttpsError('failed-precondition', 'Consent is already complete for this account.');
      }
      const recent = ((limit.get('timestamps') as number[] | undefined) || []).filter((t) => t > Date.now() - 86400000);
      if (recent.length >= MAX_REQUESTS_PER_DAY) {
        throw new functions.https.HttpsError('resource-exhausted', 'Too many requests today. Please try again tomorrow.');
      }
      childName = String(user.get('displayName') || 'Your child').split(' ')[0];
      const previous = user.get('consent.request_id');
      if (previous) tx.set(db.collection('consent_requests').doc(previous), { status: 'superseded' }, { merge: true });
      tx.set(limitRef, { timestamps: [...recent, Date.now()] });
      tx.set(requestRef, {
        child_uid: uid,
        child_name: childName,
        parent_email: parentEmail,
        parent_name: parentName,
        status: 'pending',
        notice_version: NOTICE_VERSION,
        created_at: now(),
        expires_at: admin.firestore.Timestamp.fromMillis(Date.now() + REQUEST_TTL_MS),
      });
      tx.set(
        userRef,
        {
          consent: {
            status: 'pending_parent',
            age_group: 'child',
            method: 'parent',
            notice_version: NOTICE_VERSION,
            language: lang(data?.language),
            parent_name: parentName,
            parent_email: parentEmail,
            request_id: token,
            requested_at: now(),
          },
        },
        { merge: true }
      );
    });

    const link = `${APP_URL.value()}/parent-consent?token=${token}`;
    await new Resend(RESEND_API_KEY.value()).emails.send({
      from: EMAIL_FROM.value(),
      to: parentEmail,
      subject: `${childName} needs your permission to use NCERT Prep`,
      html: `<p>Hello ${escapeHtml(parentName)},</p>
<p><strong>${escapeHtml(childName)}</strong> signed up for NCERT Prep, a free video revision app for NCERT classes 1–12, and named you as their parent or guardian.</p>
<p>India's Digital Personal Data Protection Act, 2023 requires a parent's or guardian's consent before we use a child's data. Nothing about your child is used until you decide.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#3B4FE0;color:#fff;border-radius:12px;text-decoration:none;font-weight:bold">Review and decide</a></p>
<p>You will be asked to sign in with <strong>${escapeHtml(parentEmail)}</strong>. The link expires in 7 days. If you did not expect this email, ignore it and the request will expire; no account data is kept for a refused or expired request beyond 30 days.</p>`,
    });
    return { status: 'pending_parent', parentEmail: maskEmail(parentEmail) };
  });

async function loadRequest(token: unknown) {
  if (typeof token !== 'string' || !/^[a-f0-9]{48}$/.test(token)) {
    throw new functions.https.HttpsError('not-found', 'This link is not valid.');
  }
  const ref = db.collection('consent_requests').doc(token);
  const snap = await ref.get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'This link is not valid.');
  const expired = (snap.get('expires_at') as admin.firestore.Timestamp).toMillis() < Date.now();
  return { ref, snap, expired };
}

/** What the parent sees before signing in. Only the child's first name and a masked email. */
export const getParentalConsentRequest = functions.https.onCall(async (data) => {
  const { snap, expired } = await loadRequest(data?.token);
  return {
    childName: snap.get('child_name'),
    parentEmail: maskEmail(snap.get('parent_email')),
    status: expired && snap.get('status') === 'pending' ? 'expired' : snap.get('status'),
  };
});

export const decideParentalConsent = functions
  .runWith({ enforceAppCheck: true })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in with the email address the request was sent to.');
    const { ref, snap, expired } = await loadRequest(data?.token);
    if (snap.get('status') !== 'pending') throw new functions.https.HttpsError('failed-precondition', 'This request has already been decided or replaced.');
    if (expired) throw new functions.https.HttpsError('deadline-exceeded', 'This link has expired. Ask your child to send a new request.');

    const email = String(context.auth.token.email || '').toLowerCase();
    if (!context.auth.token.email_verified || email !== snap.get('parent_email')) {
      throw new functions.https.HttpsError(
        'permission-denied',
        `Sign in with the verified email address this request was sent to (${maskEmail(snap.get('parent_email'))}).`
      );
    }
    const childUid = snap.get('child_uid') as string;
    if (context.auth.uid === childUid) throw new functions.https.HttpsError('permission-denied', 'A parent or guardian must decide.');

    const decision = data?.decision;
    if (decision === 'approve') {
      if (data?.declaredGuardian !== true || data?.agreed !== true) {
        throw new functions.https.HttpsError('invalid-argument', 'Confirm you are the parent or lawful guardian, 18 or older, and agree to the notice.');
      }
      const batch = db.batch();
      batch.update(ref, { status: 'approved', parent_uid: context.auth.uid, decided_at: now(), declared_guardian: true });
      batch.set(
        db.collection('users').doc(childUid),
        { consent: { status: 'granted', parent_uid: context.auth.uid, granted_at: now(), language: lang(data?.language) } },
        { merge: true }
      );
      await batch.commit();
      return { status: 'approved' };
    }
    if (decision === 'refuse') {
      await ref.update({ status: 'refused', parent_uid: context.auth.uid, decided_at: now() });
      await eraseUserData(childUid);
      await admin.auth().deleteUser(childUid).catch(() => undefined);
      return { status: 'refused' };
    }
    throw new functions.https.HttpsError('invalid-argument', 'Choose approve or refuse.');
  });

/**
 * Data minimisation: a child account whose parent never decided is erased 30 days after the
 * request (7-day link + 23 days grace), as the parent email promises.
 */
export const purgeUnconsentedChildren = functions.pubsub
  .schedule('30 3 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 23 * 24 * 60 * 60 * 1000);
    const stale = await db.collection('consent_requests').where('status', '==', 'pending').where('expires_at', '<', cutoff).get();
    for (const req of stale.docs) {
      const uid = req.get('child_uid') as string;
      const user = await db.collection('users').doc(uid).get();
      if (user.get('consent.status') !== 'granted') {
        await eraseUserData(uid);
        await admin.auth().deleteUser(uid).catch(() => undefined);
      }
      await req.ref.update({ status: 'expired' });
    }
    functions.logger.info('Purged unconsented child accounts', { count: stale.size });
  });

function escapeHtml(v: string) {
  return v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
