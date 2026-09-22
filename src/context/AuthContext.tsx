import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  EmailAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, functions, googleProvider, isFirebaseConfigured } from '../services/firebase';
import { httpsCallable, FunctionsError } from 'firebase/functions';
import { FirestoreService } from '../services/firestore';
import { DoubtsService } from '../services/content';
import { StorageService } from '../services/storage';
import { User, UserConsent } from '../types';
import { NOTICE_VERSION, NoticeLang } from '../data/privacyNotice';
import { nextStreak } from '../data/gamification';
import { StatsService, bumpDemoStat } from '../services/stats';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoUser: boolean;
  isAdmin: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  // Firebase Auth only: Google, or email + password (verified by email link). Without Firebase keys
  // (local development) both create a browser-only demo account instead.
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  /** False only for email/password accounts that have not clicked the verification link yet. */
  emailVerified: boolean;
  resendVerification: () => Promise<void>;
  /** Re-reads verification state after the user clicks the link in their inbox. */
  refreshEmailVerified: () => Promise<boolean>;
  // DPDP consent (recorded server-side; demo mode stores it locally)
  giveAdultConsent: (language: NoticeLang) => Promise<void>;
  requestParentConsent: (parentName: string, parentEmail: string, language: NoticeLang) => Promise<string>;
  /** Demo mode only: stands in for the parent clicking "Approve". */
  simulateParentApproval: () => Promise<void>;
  /** Development only (no Firebase keys): local demo account, optionally as admin. */
  signInDemo: (email?: string, name?: string, role?: 'student' | 'admin', grade?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateSettings: (settings: Partial<Pick<User, 'reminders_enabled' | 'reminder_frequency' | 'reminder_hour'>>) => Promise<void>;
  updateProfile: (updates: Partial<Omit<User, 'role' | 'userId'>>) => Promise<void>;
  recordStudyActivity: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  /** 'google.com' or 'password': how the user must re-confirm before deletion. */
  reauthProviderId: string | null;
  reauthenticate: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [emailVerified, setEmailVerified] = useState<boolean>(true);

  // Initialize Auth listener or check local storage
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          setEmailVerified(fbUser.emailVerified || fbUser.providerData[0]?.providerId !== 'password');
          try {
            const userDoc = await FirestoreService.createOrGetUser(
              fbUser.uid,
              fbUser.email,
              fbUser.displayName,
              fbUser.phoneNumber
            );
            setUser(userDoc);
            setIsDemoUser(false);
          } catch (err) {
            console.error('Error fetching user profile:', err);
          }
        } else {
          // Live mode only trusts Firebase Auth; a demo session left in this browser is discarded.
          StorageService.setLocalUser(null);
          setUser(null);
          setIsDemoUser(false);
        }
        setLoading(false);
      });
    } else {
      // Offline / Demo fallback
      const localUser = StorageService.getLocalUser();
      if (localUser) {
        setUser(localUser);
        setIsDemoUser(true);
      }
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Count the visit once auth has settled (and again on sign-in, to count active students). Once per day per browser.
  useEffect(() => {
    if (!loading) StatsService.trackVisit(user?.userId);
  }, [loading, user?.userId]);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        const fbUser = cred.user;
        const userDoc = await FirestoreService.createOrGetUser(
          fbUser.uid,
          fbUser.email,
          fbUser.displayName,
          fbUser.phoneNumber
        );
        setUser(userDoc);
        setIsDemoUser(false);
        setAuthModalOpen(false);
      } catch (err) {
        console.error('Google Sign-In failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      await signInDemo('student@example.com', 'Demo Student');
    }
  }, []);

  const loadProfile = async (fbUser: FirebaseUser, name?: string) => {
    const userDoc = await FirestoreService.createOrGetUser(fbUser.uid, fbUser.email, name || fbUser.displayName, fbUser.phoneNumber);
    setUser(userDoc);
    setIsDemoUser(false);
    setEmailVerified(fbUser.emailVerified);
    setAuthModalOpen(false);
  };

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) return signInDemo(email, email.split('@')[0] || 'Student');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await loadProfile(cred.user);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) return signInDemo(email, name);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await fbUpdateProfile(cred.user, { displayName: name.trim() });
      await sendEmailVerification(cred.user);
      await loadProfile(cred.user, name.trim());
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendPasswordReset = useCallback(async (email: string) => {
    if (isFirebaseConfigured && auth) await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const resendVerification = useCallback(async () => {
    if (auth?.currentUser) await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshEmailVerified = useCallback(async () => {
    const current = auth?.currentUser;
    if (!current) return true;
    await current.reload();
    await current.getIdToken(true); // the parent-consent check reads email_verified from the token
    setEmailVerified(current.emailVerified);
    return current.emailVerified;
  }, []);

  // Consent is recorded by Cloud Functions; the profile is re-read so the gate opens with server truth.
  const reloadUser = async () => {
    if (!auth?.currentUser) return;
    const fresh = await FirestoreService.getUserProfile(auth.currentUser.uid);
    if (fresh) setUser(fresh);
  };
  const saveDemoConsent = (consent: UserConsent) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, consent };
      StorageService.setLocalUser(next);
      return next;
    });
  };

  const giveAdultConsent = useCallback(async (language: NoticeLang) => {
    if (!isFirebaseConfigured || !functions) {
      return saveDemoConsent({ status: 'granted', age_group: 'adult', method: 'self', notice_version: NOTICE_VERSION, language, granted_at: Date.now() });
    }
    await httpsCallable(functions, 'recordAdultConsent')({ declaredAdult: true, agreed: true, language });
    await reloadUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const requestParentConsent = useCallback(async (parentName: string, parentEmail: string, language: NoticeLang) => {
    if (!isFirebaseConfigured || !functions) {
      saveDemoConsent({
        status: 'pending_parent', age_group: 'child', method: 'parent', notice_version: NOTICE_VERSION, language,
        parent_name: parentName, parent_email: parentEmail, requested_at: Date.now(),
      });
      return parentEmail;
    }
    const res = await httpsCallable<unknown, { parentEmail: string }>(functions, 'requestParentalConsent')({ parentName, parentEmail, language });
    await reloadUser();
    return res.data.parentEmail;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const simulateParentApproval = useCallback(async () => {
    if (isFirebaseConfigured) return;
    setUser((prev) => {
      if (!prev?.consent) return prev;
      const next = { ...prev, consent: { ...prev.consent, status: 'granted' as const, granted_at: Date.now() } };
      StorageService.setLocalUser(next);
      return next;
    });
  }, []);

  const signInDemo = useCallback(async (
    email = 'student@example.com',
    name = 'Demo Student',
    role: 'student' | 'admin' = 'student',
    grade?: string
  ) => {
    if (isFirebaseConfigured) throw new Error('Demo accounts are disabled when Firebase is configured.');
    setLoading(true);
    const demoId = 'demo-user-' + Math.random().toString(36).substring(2, 9);
    const demoUser = await FirestoreService.createOrGetUser(demoId, email, name, null);
    demoUser.role = role;
    if (grade) demoUser.grade_preference = grade;
    if (role === 'admin') demoUser.onboarding_completed = true;
    else bumpDemoStat('registrations');
    StorageService.setLocalUser(demoUser);
    setUser(demoUser);
    setIsDemoUser(true);
    setAuthModalOpen(false);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.warn('Firebase sign out error:', err);
      }
    }
    if (user) {
      StorageService.setLocalUser(null);
    }
    setUser(null);
    setIsDemoUser(false);
    setLoading(false);
  }, [user]);

  const updateSettings = useCallback(
    async (settings: Partial<Pick<User, 'reminders_enabled' | 'reminder_frequency' | 'reminder_hour'>>) => {
      if (!user) return;
      await FirestoreService.updateUserSettings(user.userId, settings);
      setUser((prev) => (prev ? { ...prev, ...settings } : null));
    },
    [user]
  );

  const updateProfile = useCallback(
    async (updates: Partial<Omit<User, 'role' | 'userId'>>) => {
      if (!user) return;
      await FirestoreService.updateUserProfile(user.userId, updates);
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
    },
    [user]
  );

  const recordStudyActivity = useCallback(async () => {
    if (!user) return;
    const next = nextStreak(user);
    if (next.last_active_date === user.last_active_date && next.streak_days === user.streak_days) return;
    await updateProfile(next);
  }, [user, updateProfile]);

  // Throws Error('requires-recent-login') when the server wants a fresh sign-in first.
  const deleteAccount = useCallback(async () => {
    if (!user) return;
    const uid = user.userId;

    if (isFirebaseConfigured && auth?.currentUser && functions && !isDemoUser) {
      try {
        await httpsCallable(functions, 'deleteAccount')();
      } catch (err) {
        const e = err as FunctionsError;
        if (e.code === 'functions/failed-precondition') throw new Error('requires-recent-login');
        throw new Error('We could not finish deleting your account. Please try again; if it keeps failing, contact privacy support.');
      }
      await fbSignOut(auth).catch(() => undefined);
    } else {
      await FirestoreService.deleteUserAccount(uid);
      DoubtsService.removeLocalForUser(uid);
    }

    StorageService.clearUserData(uid);
    setUser(null);
    setIsDemoUser(false);
  }, [user, isDemoUser]);

  const reauthProviderId = isFirebaseConfigured && auth?.currentUser ? auth.currentUser.providerData[0]?.providerId || null : null;

  const reauthenticate = useCallback(async (password?: string) => {
    const current = auth?.currentUser;
    if (!current) throw new Error('You are signed out. Please sign in again.');
    if (current.providerData[0]?.providerId === 'password') {
      if (!password || !current.email) throw new Error('Enter your password.');
      await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, password));
    } else if (googleProvider) {
      await reauthenticateWithPopup(current, googleProvider);
    }
    await current.getIdToken(true);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoUser,
        isAdmin,
        authModalOpen,
        setAuthModalOpen,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        emailVerified,
        resendVerification,
        refreshEmailVerified,
        giveAdultConsent,
        requestParentConsent,
        simulateParentApproval,
        signInDemo,
        signOut,
        updateSettings,
        updateProfile,
        recordStudyActivity,
        deleteAccount,
        reauthProviderId,
        reauthenticate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
