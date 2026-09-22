import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { requireConsent } from './consent';
import { getPlatformConfig } from './platform';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 1000;

/**
 * FR-9 / NFR-3: the only write path into `feedback` (clients are denied direct writes by rules).
 * The per-user limit lives in a transaction on rate_limits/feedback_{uid}, so concurrent
 * requests cannot slip past it.
 */
export const submitFeedback = functions
  .runWith({ enforceAppCheck: true })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to submit feedback.');
    }

    const userId = context.auth.uid;
    const { features, limits } = await getPlatformConfig();
    if (!features.feedback) {
      throw new functions.https.HttpsError('unavailable', 'Feedback is switched off right now. Please try again later.');
    }
    const MAX_PER_HOUR = limits.feedbackPerHour;
    await requireConsent(userId);
    const youtubeId = typeof data?.youtubeId === 'string' ? data.youtubeId.trim() : '';
    const message = typeof data?.message === 'string' ? data.message.trim() : '';

    if (!youtubeId || !message) {
      throw new functions.https.HttpsError('invalid-argument', 'A video and a feedback message are required.');
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Feedback must be ${MAX_MESSAGE_LENGTH} characters or fewer.`
      );
    }

    const videoSnap = await db.collection('videos').doc(youtubeId).get();
    if (!videoSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'This video no longer exists.');
    }

    const limitRef = db.collection('rate_limits').doc(`feedback_${userId}`);
    const feedbackRef = db.collection('feedback').doc();

    const remaining = await db.runTransaction(async (tx) => {
      const limitSnap = await tx.get(limitRef);
      const now = Date.now();
      const recent = ((limitSnap.data()?.timestamps as number[] | undefined) || []).filter(
        (ts) => ts > now - WINDOW_MS
      );

      if (recent.length >= MAX_PER_HOUR) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          `You can send at most ${MAX_PER_HOUR} feedback messages per hour. Please try again later.`
        );
      }

      recent.push(now);
      tx.set(limitRef, { timestamps: recent });
      tx.set(feedbackRef, {
        userId,
        userEmail: context.auth?.token.email || null,
        youtube_id: youtubeId,
        videoTitle: videoSnap.get('video_title') || null,
        message,
        status: 'new',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      return MAX_PER_HOUR - recent.length;
    });

    return { success: true, feedbackId: feedbackRef.id, remainingPerHour: remaining };
  });
