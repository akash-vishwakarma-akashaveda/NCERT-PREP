import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { defineSecret, defineString } from 'firebase-functions/params';
import { createHmac, timingSafeEqual } from 'crypto';
import { Resend } from 'resend';
import { classSortOf, pickNextVideo, VideoData } from './catalog';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const UNSUBSCRIBE_SECRET = defineSecret('UNSUBSCRIBE_SECRET');
const APP_URL = defineString('APP_URL', { default: 'https://ncertprep.vercel.app' });
// Must be an address on the domain verified with SPF/DKIM/DMARC in Resend (NFR-6).
const EMAIL_FROM = defineString('EMAIL_FROM', { default: 'NCERT QuickPrep <revision@example.com>' });
const REGION = 'us-central1';
const RESEND_BATCH_SIZE = 100;

interface UserData {
  email: string | null;
  displayName?: string;
  grade_preference?: string;
  last_watched_video: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function signUid(uid: string): string {
  return createHmac('sha256', UNSUBSCRIBE_SECRET.value()).update(uid).digest('base64url');
}

function isValidToken(uid: string, token: string): boolean {
  const expected = Buffer.from(signUid(uid));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function unsubscribeUrl(uid: string): string {
  const projectId = process.env.GCLOUD_PROJECT;
  return `https://${REGION}-${projectId}.cloudfunctions.net/unsubscribe?uid=${encodeURIComponent(
    uid
  )}&token=${signUid(uid)}`;
}

function buildEmail(user: UserData, uid: string, frequency: 'daily' | 'weekly', next: VideoData | null) {
  const appUrl = APP_URL.value().replace(/\/$/, '');
  const name = escapeHtml(user.displayName || 'there');
  const unsubscribe = unsubscribeUrl(uid);
  const isContinuation = Boolean(user.last_watched_video && next);

  const subject = isContinuation
    ? `Time for revision: next up is ${next!.chapter_name}`
    : 'Start your first lesson!';

  const lessonBlock = next
    ? `<div style="background:#F5F6FA;border:1px solid #E3E5EC;border-radius:12px;padding:16px;margin:20px 0;">
         <span style="background:#3B4FE0;color:#fff;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:bold;">
           Class ${Number(next.class_sort)} • ${escapeHtml(next.subject)}
         </span>
         <h2 style="font-size:18px;margin:12px 0 6px;">${escapeHtml(next.chapter_name)}</h2>
         <p style="color:#6B7280;font-size:13px;margin:0;">${escapeHtml(next.video_title)}</p>
         <a href="${appUrl}/watch/${encodeURIComponent(next.youtube_id)}"
            style="display:inline-block;background:#12A594;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:bold;margin-top:16px;">
           ${isContinuation ? 'Watch next lesson' : 'Start your first lesson'} &rarr;
         </a>
       </div>`
    : `<a href="${appUrl}" style="display:inline-block;background:#3B4FE0;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:bold;margin:16px 0;">
         Start your first lesson &rarr;
       </a>`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1E2233;background:#fff;">
      <h1 style="color:#3B4FE0;margin:0 0 16px;font-size:22px;">NCERT QuickPrep</h1>
      <p>Hello ${name},</p>
      <p>${isContinuation ? 'Here is the next lesson in your syllabus:' : 'Start your first lesson!'}</p>
      ${lessonBlock}
      <hr style="border:none;border-top:1px solid #E3E5EC;margin:32px 0 16px;" />
      <p style="color:#94A3B8;font-size:12px;text-align:center;">
        You receive this because ${frequency} revision reminders are on in your QuickPrep settings.<br/>
        <a href="${unsubscribe}" style="color:#3B4FE0;">Unsubscribe from revision reminders</a>
      </p>
    </div>`;

  return {
    from: EMAIL_FROM.value(),
    to: user.email!,
    subject,
    html,
    headers: {
      'List-Unsubscribe': `<${unsubscribe}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

const DEFAULT_HOUR = { daily: 19, weekly: 18 } as const;

async function processReminders(frequency: 'daily' | 'weekly', istHour: number) {
  functions.logger.info(`Starting ${frequency} reminder run for ${istHour}:00 IST`);

  // ponytail: reads every opted-in user each hour and filters by hour in code (users created before
  // reminder_hour existed have no field to query). Past ~50k opted-in users, backfill reminder_hour
  // and add it to the composite index + where clause.
  const usersSnapshot = await db
    .collection('users')
    .where('reminders_enabled', '==', true)
    .where('reminder_frequency', '==', frequency)
    .get();

  const dueDocs = usersSnapshot.docs.filter(
    (doc) => (doc.get('reminder_hour') ?? DEFAULT_HOUR[frequency]) === istHour
  );
  if (dueDocs.length === 0) {
    functions.logger.info(`No ${frequency} reminders due at ${istHour}:00 IST.`);
    return;
  }

  const videosSnapshot = await db.collection('videos').get();
  const activeVideos: VideoData[] = [];
  videosSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.isActive === false) return;
    activeVideos.push({
      youtube_id: doc.id,
      class_sort: classSortOf(data.class_sort ?? data.class_display),
      subject: String(data.subject || ''),
      chapter_id: String(data.chapter_id || ''),
      chapter_name: String(data.chapter_name || ''),
      video_title: String(data.video_title || ''),
    });
  });

  const emails = dueDocs
    .map((doc) => ({ uid: doc.id, user: doc.data() as UserData }))
    .filter(({ user }) => Boolean(user.email))
    .map(({ uid, user }) =>
      buildEmail(
        user,
        uid,
        frequency,
        pickNextVideo(activeVideos, user.last_watched_video, classSortOf(user.grade_preference))
      )
    );

  const resend = new Resend(RESEND_API_KEY.value());
  let sent = 0;
  for (let i = 0; i < emails.length; i += RESEND_BATCH_SIZE) {
    const batch = emails.slice(i, i + RESEND_BATCH_SIZE);
    const { error } = await resend.batch.send(batch);
    if (error) {
      functions.logger.error(`Resend batch ${i / RESEND_BATCH_SIZE} failed`, error);
    } else {
      sent += batch.length;
    }
    // Stay under Resend's default 2 requests/second.
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  functions.logger.info(`${frequency} reminders: ${sent}/${emails.length} emails accepted by Resend`);
}

const reminderRuntime = { secrets: [RESEND_API_KEY, UNSUBSCRIBE_SECRET], timeoutSeconds: 540 };

export function istNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date);
  return {
    hour: Number(parts.find((p) => p.type === 'hour')?.value),
    isSunday: parts.find((p) => p.type === 'weekday')?.value === 'Sun',
  };
}

// FR-7: runs at the top of every IST hour; each student picks their own hour (weekly = Sundays).
export const reminderJob = functions
  .runWith(reminderRuntime)
  .pubsub.schedule('0 * * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const { hour, isSunday } = istNow();
    await processReminders('daily', hour);
    if (isSunday) await processReminders('weekly', hour);
  });

function page(title: string, body: string): string {
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
    <div style="font-family:sans-serif;text-align:center;padding:48px 16px;color:#1E2233;">
      <h2>${title}</h2><p>${body}</p></div>`;
}

// NFR-1: GET from the email footer link, POST for RFC 8058 one-click unsubscribe.
export const unsubscribe = functions
  .runWith({ secrets: [UNSUBSCRIBE_SECRET] })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const uid = String(req.query.uid || '');
    const token = String(req.query.token || '');
    if (!uid || !token || !isValidToken(uid, token)) {
      res.status(400).send(page('Invalid link', 'This unsubscribe link is invalid or incomplete.'));
      return;
    }

    try {
      await db.collection('users').doc(uid).update({ reminders_enabled: false });
      res
        .status(200)
        .send(
          page(
            'You have been unsubscribed',
            'You will no longer receive revision reminders. You can turn them back on anytime in Profile &amp; Settings.'
          )
        );
    } catch (err) {
      const notFound = (err as { code?: number }).code === 5;
      if (notFound) {
        res.status(200).send(page('Nothing to unsubscribe', 'This account no longer exists.'));
        return;
      }
      functions.logger.error('Unsubscribe failed', { uid, err });
      res.status(500).send(page('Something went wrong', 'Please try again later.'));
    }
  });
