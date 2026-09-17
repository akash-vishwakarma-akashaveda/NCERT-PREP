import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  signInWithPopup,
  signInWithPhoneNumber,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
  RecaptchaVerifier,
  ConfirmationResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, functions, googleProvider, isFirebaseConfigured } from '../services/firebase';
import { httpsCallable, FunctionsError } from 'firebase/functions';
import { FirestoreService } from '../services/firestore';
import { DoubtsService } from '../services/content';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { nextStreak } from '../data/gamification';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoUser: boolean;
  isAdmin: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, gradePreference?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendPhoneOtp: (phoneE164: string, recaptchaContainerId: string) => Promise<void>;
  verifyPhoneOtp: (code: string) => Promise<void>;
  signInDemo: (email?: string, name?: string, role?: 'student' | 'admin', grade?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateSettings: (settings: Partial<Pick<User, 'reminders_enabled' | 'reminder_frequency' | 'reminder_hour'>>) => Promise<void>;
  updateProfile: (updates: Partial<Omit<User, 'role' | 'userId'>>) => Promise<void>;
  recordStudyActivity: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  // Provider the user must re-confirm with before deletion: 'google.com' | 'password' | 'phone'.
  reauthProviderId: string | null;
  reauthenticate: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Initialize Auth listener or check local storage
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
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
          // Check if local demo user exists
          const localUser = StorageService.getLocalUser();
          if (localUser) {
            setUser(localUser);
            setIsDemoUser(true);
          } else {
            setUser(null);
            setIsDemoUser(false);
          }
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

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    if (isFirebaseConfigured && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
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
        console.error('Email sign in failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Local fallback
      await signInDemo(email, email.split('@')[0] || 'Student');
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, pass: string, name: string, gradePreference = '10') => {
    setLoading(true);
    if (isFirebaseConfigured && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        const fbUser = cred.user;
        await fbUpdateProfile(fbUser, { displayName: name });
        const userDoc = await FirestoreService.createOrGetUser(
          fbUser.uid,
          fbUser.email,
          name,
          null
        );
        userDoc.grade_preference = gradePreference;
        await FirestoreService.updateUserProfile(userDoc.userId, {
          grade_preference: gradePreference,
        });
        setUser(userDoc);
        setIsDemoUser(false);
        setAuthModalOpen(false);
      } catch (err) {
        console.error('Email sign up failed:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      await signInDemo(email, name, 'student', gradePreference);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      console.info(`[Demo Mode] Password reset link simulated for ${email}`);
    }
  }, []);

  // FR-1 Mobile OTP. Demo mode (no Firebase keys) accepts any 6-digit code.
  const phoneConfirmation = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  const demoPhone = useRef<string | null>(null);

  const sendPhoneOtp = useCallback(async (phoneE164: string, recaptchaContainerId: string) => {
    if (!isFirebaseConfigured || !auth) {
      demoPhone.current = phoneE164;
      return;
    }
    recaptchaVerifier.current?.clear();
    recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
    try {
      phoneConfirmation.current = await signInWithPhoneNumber(auth, phoneE164, recaptchaVerifier.current);
    } catch (err) {
      recaptchaVerifier.current.clear();
      recaptchaVerifier.current = null;
      throw err;
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (code: string) => {
    if (!isFirebaseConfigured || !auth) {
      if (!/^\d{6}$/.test(code) || !demoPhone.current) throw new Error('Enter the 6-digit code.');
      const demoId = 'demo-user-' + Math.random().toString(36).substring(2, 9);
      const demoUser = await FirestoreService.createOrGetUser(demoId, null, 'Student', demoPhone.current);
      StorageService.setLocalUser(demoUser);
      setUser(demoUser);
      setIsDemoUser(true);
      setAuthModalOpen(false);
      return;
    }
    if (!phoneConfirmation.current) throw new Error('Request a code first.');
    setLoading(true);
    try {
      const cred = await phoneConfirmation.current.confirm(code);
      const userDoc = await FirestoreService.createOrGetUser(
        cred.user.uid,
        cred.user.email,
        cred.user.displayName,
        cred.user.phoneNumber
      );
      setUser(userDoc);
      setIsDemoUser(false);
      setAuthModalOpen(false);
      phoneConfirmation.current = null;
      recaptchaVerifier.current?.clear();
      recaptchaVerifier.current = null;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInDemo = useCallback(async (
    email = 'student@example.com',
    name = 'Demo Student',
    role: 'student' | 'admin' = 'student',
    grade?: string
  ) => {
    setLoading(true);
    const demoId = 'demo-user-' + Math.random().toString(36).substring(2, 9);
    const demoUser = await FirestoreService.createOrGetUser(demoId, email, name, null);
    demoUser.role = role;
    if (grade) demoUser.grade_preference = grade;
    if (role === 'admin') demoUser.onboarding_completed = true;
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

  const reauthProviderId = isFirebaseConfigured && auth?.currentUser
    ? auth.currentUser.providerData[0]?.providerId || null
    : null;

  const reauthenticate = useCallback(async (password?: string) => {
    const current = auth?.currentUser;
    if (!current) throw new Error('You are signed out. Please sign in again.');
    const providerId = current.providerData[0]?.providerId;

    if (providerId === 'google.com' && googleProvider) {
      await reauthenticateWithPopup(current, googleProvider);
    } else if (providerId === 'password' && current.email) {
      if (!password) throw new Error('Enter your password.');
      await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, password));
    } else {
      throw new Error('Sign out, sign back in with your mobile number, then delete your account within 5 minutes.');
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
        sendPhoneOtp,
        verifyPhoneOtp,
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
