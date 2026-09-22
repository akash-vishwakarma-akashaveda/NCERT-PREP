import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const RECENT_LOGIN_SECONDS = 5 * 60;

async function deleteWhereUser(collection: string, uid: string) {
  const snap = await db.collection(collection).where('userId', '==', uid).get();
  for (let i = 0; i < snap.docs.length; i += 450) {
    const batch = db.batch();
    snap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/**
 * Removes every piece of personal data we hold for a user (not the Auth record): the users doc with its
 * subcollections (progress, XP history), doubts, feedback (holds their email), their leaderboard entry
 * (name and avatar shown to classmates) and rate-limit state. Also used for declined or expired parental consent.
 */
export async function eraseUserData(uid: string) {
  await db.recursiveDelete(db.collection('users').doc(uid));
  await Promise.all([deleteWhereUser('doubts', uid), deleteWhereUser('feedback', uid), db.collection('leaderboard').doc(uid).delete()]);
  await Promise.all(['feedback', 'doubts', 'consent'].map((k) => db.collection('rate_limits').doc(`${k}_${uid}`).delete()));
}

/**
 * NFR-1 self-service deletion: everything eraseUserData covers, then the Auth record.
 * Data is removed before Auth so a failure never leaves personal data the user can no longer delete.
 */
export const deleteAccount = functions
  .runWith({ enforceAppCheck: true })
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to delete your account.');
    }

    const authTime = Number(context.auth.token.auth_time || 0);
    if (Date.now() / 1000 - authTime > RECENT_LOGIN_SECONDS) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'requires-recent-login'
      );
    }

    const uid = context.auth.uid;
    await eraseUserData(uid);
    await admin.auth().deleteUser(uid);

    functions.logger.info('Account deleted', { uid });
    return { success: true };
  });
