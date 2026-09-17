import React, { useState } from 'react';
import {
  LogOut,
  CheckCircle2,
  Star,
  AlertTriangle,
  Shield,
  GraduationCap,
  Flame,
  Award,
  Download,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { Video } from '../../types';
import { classLabel, currentStreak, xpStats } from '../../data/gamification';

interface ProfileSettingsProps {
  videoMap: Map<string, Video>;
  onOpenAdmin?: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  videoMap,
  onOpenAdmin,
}) => {
  const { user, isDemoUser, isAdmin, signOut, updateProfile, deleteAccount, reauthProviderId, reauthenticate } = useAuth();
  const { completedCount, favoritesCount, favoriteIds, progressMap } = useProgress();

  const [savingSettings, setSavingSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [profileUpdated, setProfileUpdated] = useState(false);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [selectedGrade, setSelectedGrade] = useState(user?.grade_preference || '');
  const [studyGoal, setStudyGoal] = useState<number>(user?.study_goal_minutes || 25);
  const [focusSubjects, setFocusSubjects] = useState<string[]>(user?.focus_subjects || []);

  const subjectsForSelectedGrade = React.useMemo(() => {
    const set = new Set<string>();
    videoMap.forEach((v) => {
      if (v.isActive && v.class_sort === selectedGrade) set.add(v.subject);
    });
    return Array.from(set).sort();
  }, [videoMap, selectedGrade]);

  if (!user) return null;

  const streak = currentStreak(user);
  const { xp } = xpStats(completedCount);
  const classChanged = Boolean(user.grade_preference) && selectedGrade !== user.grade_preference;

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    setFocusSubjects([]);
  };

  const toggleFocusSubject = (subject: string) => {
    setFocusSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleSaveAcademicPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade) return;
    setSavingSettings(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || user.displayName,
        grade_preference: selectedGrade,
        study_goal_minutes: studyGoal,
        focus_subjects: focusSubjects.filter((s) => subjectsForSelectedGrade.includes(s)),
      });
      setProfileUpdated(true);
      setTimeout(() => setProfileUpdated(false), 3000);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      user: {
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        grade_preference: user.grade_preference,
        focus_subjects: user.focus_subjects,
        study_goal_minutes: user.study_goal_minutes,
        streak_days: user.streak_days,
        reminders_enabled: user.reminders_enabled,
        reminder_frequency: user.reminder_frequency,
      },
      watchHistory: progressMap,
      favoriteIds,
      completedCount,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ncert-prep-data-${user.userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteError(null);
    setNeedsReauth(false);
    setReauthPassword('');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      if (needsReauth) {
        await reauthenticate(reauthPassword);
      }
      await deleteAccount();
    } catch (err) {
      const message = (err as Error).message;
      if (message === 'requires-recent-login') {
        setNeedsReauth(true);
        setDeleteError('For your security, confirm it is you before we delete everything.');
      } else {
        setDeleteError(message || 'Something went wrong. Please try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Overview Card */}
      <div className="bg-white border border-[#E3E5EC] rounded-2xl p-4 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#3B4FE0] text-white flex items-center justify-center text-xl font-bold shadow-xs">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#1E2233]">
                  {user.displayName || 'Revision Student'}
                </h1>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {isAdmin ? 'Administrator' : 'Student Account'}
                </span>
                {isDemoUser && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                    Demo Account
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {user.email || 'Verified Student Profile'}
                {!isAdmin && (
                  <>
                    {' • '}
                    <span className="font-semibold text-[#1E2233]">{classLabel(user.grade_preference)}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {isAdmin && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="Manage syllabus, videos and reviews"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            )}

            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Revision Stats Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#E3E5EC]">
          <div className="p-4 bg-[#F5F6FA] rounded-xl border border-[#E3E5EC] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
              <CheckCircle2 className="w-4 h-4 text-[#12A594]" />
              <span>Completed</span>
            </div>
            <p className="text-2xl font-extrabold text-[#1E2233]">{completedCount}</p>
          </div>

          <div className="p-4 bg-[#F5F6FA] rounded-xl border border-[#E3E5EC] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Saved Lessons</span>
            </div>
            <p className="text-2xl font-extrabold text-[#1E2233]">{favoritesCount}</p>
          </div>

          <div className="p-4 bg-[#F5F6FA] rounded-xl border border-[#E3E5EC] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Revision Streak</span>
            </div>
            <p className="text-2xl font-extrabold text-orange-600">
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </p>
          </div>

          <div className="p-4 bg-[#F5F6FA] rounded-xl border border-[#E3E5EC] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
              <Award className="w-4 h-4 text-[#3B4FE0]" />
              <span>Total XP</span>
            </div>
            <p className="text-2xl font-extrabold text-[#3B4FE0]">{xp} XP</p>
          </div>
        </div>
      </div>

      {/* Academic Target & Grade Preferences */}
      <form onSubmit={handleSaveAcademicPreferences} className="bg-white border border-[#E3E5EC] rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3B4FE0]/10 text-[#3B4FE0] flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E2233]">Profile & Class</h2>
              <p className="text-xs text-[#6B7280]">
                Your name, the class you are studying in, focus subjects and daily study target
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profileUpdated && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#1E2233] mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              maxLength={60}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E2233] mb-1.5">
              Your Class
            </label>
            <select
              value={selectedGrade}
              required
              onChange={(e) => handleGradeChange(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] outline-none bg-white"
            >
              {!selectedGrade && <option value="">Select your class</option>}
              {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c.toString().padStart(2, '0')}>
                  Class {c}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#6B7280] mt-1">
              You study one class at a time. Your dashboard, syllabus and search follow this class.
            </p>
          </div>
        </div>

        {classChanged && (
          <div className="p-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl">
            You are switching from <strong>{classLabel(user.grade_preference)}</strong> to{' '}
            <strong>{classLabel(selectedGrade)}</strong>. Your completed lessons and favourites from{' '}
            {classLabel(user.grade_preference)} are kept, but your dashboard and syllabus will show{' '}
            {classLabel(selectedGrade)} after you save.
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#1E2233] mb-1.5">
            Focus Subjects <span className="font-medium text-[#6B7280]">(shown first on your dashboard)</span>
          </label>
          {subjectsForSelectedGrade.length === 0 ? (
            <p className="text-xs text-[#6B7280]">
              {selectedGrade ? 'No lessons published for this class yet.' : 'Select your class first.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subjectsForSelectedGrade.map((subject) => {
                const active = focusSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleFocusSubject(subject)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'border-[#3B4FE0] bg-[#EEEDFE] text-[#3B4FE0]'
                        : 'border-[#E3E5EC] bg-white text-[#6B7280] hover:bg-[#F5F6FA]'
                    }`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className="block text-xs font-bold text-[#1E2233] mb-1.5">
              Daily Focus Target
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setStudyGoal(mins)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    studyGoal === mins
                      ? 'border-[#3B4FE0] bg-[#EEEDFE] text-[#3B4FE0]'
                      : 'border-[#E3E5EC] bg-white text-[#6B7280] hover:bg-[#F5F6FA]'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-[#E3E5EC]">
          <button
            type="submit"
            disabled={savingSettings || !selectedGrade}
            className="px-5 py-2 text-xs font-bold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingSettings ? 'Saving...' : classChanged ? `Switch to ${classLabel(selectedGrade)}` : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Account Deletion & DPDP Data Rights (NFR-1 & NFR-11) */}
      <div className="bg-white border border-[#E3E5EC] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#1E2233]">Data Privacy & Export</h3>
            <p className="text-xs text-[#6B7280]">
              Compliant with India DPDP Act 2023. You have full ownership of your learning data.
            </p>
          </div>

          <button
            onClick={handleExportData}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#3B4FE0] bg-[#EEEDFE] hover:bg-[#DDD6FE] rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export My Data (JSON)</span>
          </button>
        </div>

        <div className="pt-3 border-t border-[#E3E5EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-rose-800">Danger Zone: Permanent Account Deletion</p>
            <p className="text-[11px] text-[#6B7280]">
              Purges all authentication records, progress checkmarks, favourites, and reminder subscriptions from NCERT Prep.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2233]/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E3E5EC] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1E2233]">
              Confirm Permanent Account Deletion
            </h3>
            <p className="text-xs text-[#6B7280]">
              This action cannot be undone. All your watch history, progress checkmarks, favourites, and revision reminder subscriptions will be permanently purged from the database.
            </p>

            {deleteError && (
              <p className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">{deleteError}</p>
            )}

            {needsReauth && reauthProviderId === 'password' && (
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E3E5EC] rounded-xl focus:border-[#3B4FE0] outline-none"
              />
            )}
            {needsReauth && reauthProviderId === 'phone' && (
              <p className="text-xs text-[#6B7280]">
                Sign out, sign back in with your mobile number, then delete your account within 5 minutes.
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-[#6B7280] hover:bg-[#F5F6FA] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || (needsReauth && reauthProviderId === 'phone') || (needsReauth && reauthProviderId === 'password' && !reauthPassword)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                {deleting
                  ? 'Deleting...'
                  : needsReauth && reauthProviderId === 'google.com'
                  ? 'Confirm with Google & Delete'
                  : needsReauth
                  ? 'Confirm & Delete'
                  : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
