import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { classSortOf } from './catalog';
import { bumpStats } from './stats';
import { requireConsent } from './consent';
import { getPlatformConfig } from './platform';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

/**
 * Only write path into `doubts`. Lesson context (class, subject, chapter, title) is read from the
 * video document rather than trusted from the client, and the per-student daily limit is enforced
 * in the same transaction as the write.
 */
export const askDoubt = functions
  .runWith({ enforceAppCheck: true })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in to ask a doubt.');
    }

    const uid = context.auth.uid;
    const { features, limits } = await getPlatformConfig();
    if (!features.doubts) {
      throw new functions.https.HttpsError('unavailable', 'Doubts are switched off right now. Please try again later.');
    }
    const MAX_PER_DAY = limits.doubtsPerDay;
    const youtubeId = typeof data?.youtubeId === 'string' ? data.youtubeId.trim() : '';
    const question = typeof data?.question === 'string' ? data.question.trim() : '';

    if (!youtubeId) {
      throw new functions.https.HttpsError('invalid-argument', 'Doubts must be asked on a lesson.');
    }
    if (question.length < MIN_LENGTH || question.length > MAX_LENGTH) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Please write between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`
      );
    }

    const [videoSnap, userSnap] = await Promise.all([db.collection('videos').doc(youtubeId).get(), requireConsent(uid)]);
    if (!videoSnap.exists || videoSnap.get('isActive') === false) {
      throw new functions.https.HttpsError('not-found', 'This lesson is no longer available.');
    }

    const limitRef = db.collection('rate_limits').doc(`doubts_${uid}`);
    const doubtRef = db.collection('doubts').doc();

    await db.runTransaction(async (tx) => {
      const limitSnap = await tx.get(limitRef);
      const now = Date.now();
      const recent = ((limitSnap.data()?.timestamps as number[] | undefined) || []).filter(
        (ts) => ts > now - WINDOW_MS
      );
      if (recent.length >= MAX_PER_DAY) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          `You can ask at most ${MAX_PER_DAY} doubts per day. Please try again tomorrow.`
        );
      }
      recent.push(now);
      tx.set(limitRef, { timestamps: recent });

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      tx.set(doubtRef, {
        userId: uid,
        userName: userSnap.get('displayName') || context.auth?.token.name || null,
        userEmail: context.auth?.token.email || null,
        class_sort: classSortOf(videoSnap.get('class_sort') ?? videoSnap.get('class_display')),
        subject: String(videoSnap.get('subject') || ''),
        chapter_id: String(videoSnap.get('chapter_id') || ''),
        chapter_name: String(videoSnap.get('chapter_name') || ''),
        youtube_id: youtubeId,
        video_title: String(videoSnap.get('video_title') || ''),
        question,
        status: 'open',
        answer: null,
        answered_by: null,
        answered_at: null,
        student_unread: false,
        created_at: timestamp,
        updated_at: timestamp,
      });
      await bumpStats({ doubtsAsked: 1 }, undefined, tx);
    });

    return { success: true, doubtId: doubtRef.id };
  });
