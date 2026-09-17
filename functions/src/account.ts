import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const RECENT_LOGIN_SECONDS = 5 * 60;

/**
 * NFR-1 self-service deletion: users doc + user_progress, the user's doubts, server-side rate-limit state, then the Auth record.
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
    await db.recursiveDelete(db.collection('users').doc(uid));
    const doubts = await db.collection('doubts').where('userId', '==', uid).get();
    for (let i = 0; i < doubts.docs.length; i += 450) {
      const batch = db.batch();
      doubts.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await db.collection('rate_limits').doc(`feedback_${uid}`).delete();
    await db.collection('rate_limits').doc(`doubts_${uid}`).delete();
    await admin.auth().deleteUser(uid);

    functions.logger.info('Account deleted', { uid });
    return { success: true };
  });
