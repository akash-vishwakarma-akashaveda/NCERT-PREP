import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/** Server copy of the admin-editable settings/platform doc (see src/services/platformConfig.ts). */
export interface PlatformConfig {
  features: { doubts: boolean; feedback: boolean; emailSignup: boolean; reminderEmails: boolean };
  limits: { doubtsPerDay: number; feedbackPerHour: number };
}

const DEFAULTS: PlatformConfig = {
  features: { doubts: true, feedback: true, emailSignup: true, reminderEmails: true },
  limits: { doubtsPerDay: 10, feedbackPerHour: 5 },
};

// Bounds keep a typo in the admin panel from disabling limits or locking everyone out.
const clamp = (n: unknown, min: number, max: number, fallback: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;

let cache: { at: number; value: PlatformConfig } | null = null;

/** Cached for 60 s per instance, so a hot callable doesn't add a read per request. */
export async function getPlatformConfig(): Promise<PlatformConfig> {
  if (cache && Date.now() - cache.at < 60_000) return cache.value;
  const data = (await admin.firestore().doc('settings/platform').get()).data() || {};
  const value: PlatformConfig = {
    features: { ...DEFAULTS.features, ...data.features },
    limits: {
      doubtsPerDay: clamp(data.limits?.doubtsPerDay, 1, 100, DEFAULTS.limits.doubtsPerDay),
      feedbackPerHour: clamp(data.limits?.feedbackPerHour, 1, 60, DEFAULTS.limits.feedbackPerHour),
    },
  };
  cache = { at: Date.now(), value };
  return value;
}
