import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  LogIn,
  UserPlus,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isFirebaseConfigured } from '../../services/firebase';

interface AuthPagesProps {
  initialMode?: 'signin' | 'signup' | 'forgot' | 'phone';
  onSuccess?: () => void;
  isModal?: boolean;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode = 'signin',
  onSuccess,
  isModal = true,
}) => {
  const {
    authModalOpen,
    setAuthModalOpen,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    sendPhoneOtp,
    verifyPhoneOtp,
    signInDemo,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'phone'>(initialMode);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (isModal && !authModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setError(null);
    setSuccessMessage(null);
    if (onSuccess) onSuccess();
  };

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await signInWithGoogle();
      handleClose();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Google sign-in was cancelled.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      handleClose();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email || !password) {
      setError('Please fill in all required registration fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, fullName.trim(), grade);
      setSuccessMessage('Account created successfully! Loading your curriculum...');
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Registration failed. Email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSuccessMessage(`Password reset instructions sent to ${email}. Check your inbox.`);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to send reset link.');
    } finally {
      setSubmitting(false);
    }
  };

  const toE164 = (raw: string): string | null => {
    const trimmed = raw.replace(/[\s-]/g, '');
    if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
    if (/^[6-9]\d{9}$/.test(trimmed)) return `+91${trimmed}`;
    return null;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = toE164(phone);
    if (!e164) {
      setError('Enter a valid 10-digit Indian mobile number, or a full number starting with +.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await sendPhoneOtp(e164, 'recaptcha-container');
      setOtpSent(true);
      setSuccessMessage(`We sent a 6-digit code to ${e164}.`);
    } catch (err: unknown) {
      setError((err as Error).message || 'Could not send the code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from the SMS.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await verifyPhoneOtp(otp);
      setOtp('');
      setOtpSent(false);
      handleClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'That code is incorrect or expired.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: 'student' | 'admin') => {
    setSubmitting(true);
    setError(null);
    try {
      if (role === 'admin') {
        await signInDemo('admin@ncertprep.edu', 'Curriculum Director', 'admin');
      } else {
        await signInDemo('aarav.sharma@ncertprep.demo', 'Aarav Sharma', 'student');
      }
      handleClose();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E3E5EC] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#E3E5EC] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3B4FE0] text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1E2233]">
              {mode === 'signin' && 'Sign in to NCERT Prep'}
              {mode === 'signup' && 'Create Your Student Account'}
              {mode === 'forgot' && 'Reset Your Password'}
              {mode === 'phone' && 'Sign in with Mobile OTP'}
            </h2>
            <p className="text-xs text-[#6B7280]">
              {mode === 'signin' && 'Access structured revision, streak & focus tools'}
              {mode === 'signup' && 'Select your class to personalize your curriculum'}
              {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
              {mode === 'phone' && 'We will text you a one-time code'}
            </p>
          </div>
        </div>

        {isModal && (
          <button
            onClick={handleClose}
            className="p-1.5 text-[#6B7280] hover:text-[#1E2233] hover:bg-[#F5F6FA] rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-[#E3E5EC] bg-[#F5F6FA] p-1 gap-1">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setError(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'signin'
              ? 'bg-white text-[#3B4FE0] shadow-xs'
              : 'text-[#6B7280] hover:text-[#1E2233]'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'signup'
              ? 'bg-white text-[#3B4FE0] shadow-xs'
              : 'text-[#6B7280] hover:text-[#1E2233]'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1E2233] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] focus:ring-1 focus:ring-[#3B4FE0] outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#1E2233]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] text-[#3B4FE0] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] focus:ring-1 focus:ring-[#3B4FE0] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-xs sm:text-sm font-bold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="grow border-t border-[#E3E5EC]"></div>
              <span className="shrink mx-3 text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold">
                Or Continue With
              </span>
              <div className="grow border-t border-[#E3E5EC]"></div>
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2 text-xs sm:text-sm font-semibold text-[#1E2233] bg-white hover:bg-[#F5F6FA] border border-[#E3E5EC] rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('phone');
                setError(null);
                setSuccessMessage(null);
              }}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2 text-xs sm:text-sm font-semibold text-[#1E2233] bg-white hover:bg-[#F5F6FA] border border-[#E3E5EC] rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-[#12A594]" />
              <span>Continue with Mobile OTP</span>
            </button>

            {/* Quick Demo Logins for fast testing */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#042C53] bg-[#E6F1FB] hover:bg-[#D5E6F8] border border-[#CBE0F7] rounded-xl transition-colors cursor-pointer"
                title="Log in as Demo Student"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#3B4FE0]" />
                <span>Demo Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                title="Log in as Administrator to manage content"
              >
                <Shield className="w-3.5 h-3.5 text-slate-700" />
                <span>Demo Admin</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1E2233] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] focus:ring-1 focus:ring-[#3B4FE0] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E2233] mb-1">
                Select Your Class
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] focus:ring-1 focus:ring-[#3B4FE0] outline-none bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g.toString().padStart(2, '0')}>
                      Class {g} {g <= 5 ? '(Primary Foundation)' : g <= 10 ? '(Middle & Boards)' : '(Senior Secondary)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E2233] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] focus:ring-1 focus:ring-[#3B4FE0] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E2233] mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] focus:ring-1 focus:ring-[#3B4FE0] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-xs sm:text-sm font-bold text-white bg-[#12A594] hover:bg-[#0E8576] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Creating Account...' : 'Complete Registration'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* PHONE OTP FORM */}
        {mode === 'phone' && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1E2233] mb-1">Mobile Number</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  disabled={otpSent}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] focus:ring-1 focus:ring-[#3B4FE0] outline-none disabled:bg-[#F5F6FA]"
                />
              </div>
            </div>

            {otpSent && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#1E2233]">6-digit Code</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-[#3B4FE0] hover:underline cursor-pointer"
                  >
                    Change number / resend
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 text-sm tracking-[0.4em] font-mono border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] focus:ring-1 focus:ring-[#3B4FE0] outline-none"
                />
              </div>
            )}

            <div id="recaptcha-container" />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setOtpSent(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="px-4 py-2 text-xs font-bold text-[#6B7280] hover:bg-[#F5F6FA] rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Please wait...' : otpSent ? 'Verify & Sign In' : 'Send Code'}
              </button>
            </div>

            {!isFirebaseConfigured && (
              <p className="text-[11px] text-indigo-700">Demo mode: no SMS is sent — enter any 6 digits.</p>
            )}
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E2233] mb-1">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] focus:ring-1 focus:ring-[#3B4FE0] outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="px-4 py-2 text-xs font-bold text-[#6B7280] hover:bg-[#F5F6FA] rounded-xl cursor-pointer"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{submitting ? 'Sending...' : 'Send Password Reset'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-[#F5F6FA] border-t border-[#E3E5EC] text-center">
        <p className="text-[11px] text-[#6B7280]">
          Compliant with India DPDP Act 2023. No commercial tracking or ad profiles.
          {!isFirebaseConfigured && (
            <span className="block text-[10px] text-indigo-700 mt-0.5 font-medium">
              Demo mode active: Login works instantly with or without live Firebase credentials.
            </span>
          )}
        </p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2233]/60 backdrop-blur-xs animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  return <div className="flex justify-center p-4">{content}</div>;
};
