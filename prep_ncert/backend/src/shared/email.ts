import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from './logger.js';

const sesClient = new SESClient({ region: process.env.AWS_REGION ?? 'ap-south-1' });

/** Never throws: a mail failure (SES sandbox, unverified sender, bad credentials) must not fail the
 * request that triggered it — e.g. a sign-up that already created the account. Returns whether it sent. */
export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) {
    // Local dev has no SES: the link is logged so flows can be tested, and counts as sent. In
    // production an unset sender is a real misconfiguration, so it reports failure to the user.
    logger.warn({ to, subject, body }, '[email] not sent (SES_FROM_EMAIL unset) — logging instead');
    return process.env.NODE_ENV !== 'production';
  }

  try {
    await sesClient.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: body } },
        },
      }),
    );
    return true;
  } catch (err) {
    logger.error({ err, to, subject }, '[email] SES send failed');
    return false;
  }
}
