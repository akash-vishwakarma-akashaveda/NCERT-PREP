import { api, ApiError } from './api/client';
import { User, UserConsent } from '../types';
import { normalizeClassSort } from '../data/classFormat';

export interface BackendUser {
  id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  phoneNumber: string | null;
  role: 'STUDENT' | 'ADMIN';
  referralCode: string | null;
  classGrade: number | null;
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  lastWatchedVideo: string | null;
  studyGoalMinutes: number | null;
  onboardingCompleted: boolean;
  focusSubjects: string[];
  remindersEnabled: boolean;
  reminderFrequency: 'daily' | 'weekly';
  reminderHour: number | null;
  emailVerified: boolean;
  provider: 'password' | 'google.com';
  consent?: {
    status: 'granted' | 'pending_parent';
    age_group: string | null;
    method: string | null;
    notice_version: string | null;
    language: string | null;
    parent_name: string | null;
    parent_email: string | null;
    granted_at: string | null;
    requested_at: string | null;
  };
  createdAt: string;
}

export function toFrontendUser(u: BackendUser): User {
  return {
    userId: u.id,
    email: u.email,
    displayName: u.displayName ?? undefined,
    photoURL: u.photoUrl ?? undefined,
    phoneNumber: u.phoneNumber ?? undefined,
    role: u.role === 'ADMIN' ? 'admin' : 'student',
    referral_code: u.referralCode,
    grade_preference: u.classGrade != null ? normalizeClassSort(u.classGrade) : undefined,
    study_goal_minutes: u.studyGoalMinutes ?? undefined,
    streak_days: u.streak,
    last_active_date: u.lastActiveDate ?? undefined,
    reminders_enabled: u.remindersEnabled,
    reminder_frequency: u.reminderFrequency,
    reminder_hour: u.reminderHour ?? undefined,
    last_watched_video: u.lastWatchedVideo ?? null,
    onboarding_completed: u.onboardingCompleted,
    focus_subjects: u.focusSubjects,
    xp: u.xp,
    created_at: u.createdAt,
    consent: u.consent as UserConsent | undefined,
  };
}

// ---- Google Identity Services: loaded on demand, no build-time dependency ----

interface GsiNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
}

// Chrome can block Google's FedCM-based sign-in per-site (the little icon left of the address
// bar), including auto-suppressing it right after the user dismisses it once — that's a browser
// setting, not our bug, so tell the user how to fix it instead of a generic "cancelled" message.
// isNotDisplayed() and isSkippedMoment() use different reason vocabularies, so they're checked
// separately: 'issuing_failed' is what Chrome reports when it silently refuses a re-prompt after
// an earlier dismissal (the NetworkError seen in devtools), which is the case this is really for.
const BLOCKED_NOT_DISPLAYED_REASONS = ['suppressed_by_user', 'opt_out_or_no_session', 'unregistered_origin', 'browser_not_supported'];
const BLOCKED_SKIPPED_REASONS = ['issuing_failed'];
const BLOCKED_MESSAGE =
  'Your browser is blocking Google sign-in for this site. Click the icon just left of the address bar and allow it, then try again — or sign in with email below.';

function gsiFailureMessage(notification: GsiNotification): string {
  if (notification.isNotDisplayed()) {
    return BLOCKED_NOT_DISPLAYED_REASONS.includes(notification.getNotDisplayedReason())
      ? BLOCKED_MESSAGE
      : 'Google sign-in was cancelled or blocked by the browser.';
  }
  return BLOCKED_SKIPPED_REASONS.includes(notification.getSkippedReason())
    ? BLOCKED_MESSAGE
    : 'Google sign-in was cancelled or blocked by the browser.';
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
          prompt: (momentListener?: (notification: GsiNotification) => void) => void;
        };
      };
    };
  }
}

let gsiScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
}

async function getGoogleIdToken(): Promise<string> {
  await loadGoogleIdentityScript();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) throw new Error('Google sign-in is not configured (VITE_GOOGLE_CLIENT_ID missing).');

  return new Promise((resolve, reject) => {
    window.google!.accounts.id.initialize({ client_id: clientId, callback: (resp) => resolve(resp.credential) });
    window.google!.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        reject(new Error(gsiFailureMessage(notification)));
      }
    });
  });
}

// ---- Backend calls ----

export const AuthService = {
  async signInWithGoogle(): Promise<BackendUser> {
    const idToken = await getGoogleIdToken();
    return api.post<BackendUser>('/api/auth/google', { idToken });
  },
  signInWithEmail: (email: string, password: string) => api.post<BackendUser>('/api/auth/login', { email, password }),
  signUpWithEmail: (name: string, email: string, password: string, referralCode?: string) =>
    api.post<BackendUser>('/api/auth/register', { email, password, displayName: name, referralCode: referralCode || undefined }),
  sendPasswordReset: (email: string) => api.post<{ ok: true }>('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post<{ ok: true }>('/api/auth/reset-password', { token, password }),
  resendVerification: () => api.post<{ ok: true }>('/api/auth/resend-verification'),
  verifyEmail: (token: string) => api.post<{ ok: true }>('/api/auth/verify-email', { token }),
  signOut: () => api.post<{ ok: true }>('/api/auth/logout'),
  signOutAllDevices: () => api.post<{ ok: true }>('/api/auth/logout-all'),

  async me(): Promise<BackendUser | null> {
    try {
      return await api.get<BackendUser>('/api/auth/me');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },

  updateProfile: (updates: Record<string, unknown>) => api.patch<BackendUser>('/api/users/me/profile', updates),
  updateSettings: (settings: Record<string, unknown>) => api.patch<BackendUser>('/api/users/me/settings', settings),
  giveAdultConsent: (language: string) => api.post<BackendUser>('/api/users/me/consent/adult', { language }),
  requestParentConsent: (parentName: string, parentEmail: string, language: string) =>
    api.post<{ parentEmail: string }>('/api/users/me/consent/parent-request', { parentName, parentEmail, language }),
  deleteAccount: () => api.delete<{ ok: true }>('/api/users/me'),
};

export { ApiError };
