import React from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Bookmark, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
import { Video } from '../../types';
import { useProgress } from '../../context/ProgressContext';
import { useCatalogContext } from '../../context/CatalogContext';
import { MyDoubtsPanel } from '../../components/doubts/MyDoubtsPanel';
import { ReminderSettingsCard } from '../../components/profile/ReminderSettingsCard';
import { ProfileSettings } from '../../components/profile/ProfileSettings';
import { useAuth } from '../../context/AuthContext';
import { FocusMode } from '../useFocusTimer';
import { useStudentContext } from '../StudentLayout';
import { EmptyState, PageHeader, SubjectCover, btnPrimary, btnSecondary, card, lessonPath } from '../ui';

export const DoubtsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const isUserAdmin = isAdmin || user?.role === 'admin' || user?.email === 'admin@ncertprep.edu';
  if (isUserAdmin) {
    return <Navigate to="/app?tab=doubts" replace />;
  }

  const { videoMap } = useCatalogContext();
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader title="Doubts" description="Questions you asked under lessons. Only you and your educator can see them." />
      <MyDoubtsPanel videoMap={videoMap} onSelectVideo={(v) => navigate(lessonPath(v.youtube_id))} standalone />
    </div>
  );
};

export const SavedPage: React.FC = () => {
  const { favoriteIds, isCompleted, toggleFavorite } = useProgress();
  const { videoMap } = useCatalogContext();
  const saved = favoriteIds.map((id) => videoMap.get(id)).filter((v): v is Video => Boolean(v));

  return (
    <div className="space-y-6">
      <PageHeader title="Saved lessons" description="Lessons you bookmarked for quick revision." />
      {saved.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-5 h-5" />}
          title="Nothing saved yet"
          body="Use the Save button on any lesson to keep it here."
          action={<Link to="/app/subjects" className={btnPrimary}>Browse subjects</Link>}
        />
      ) : (
        <ul className={`${card} divide-y divide-[#E5E7EB]`}>
          {saved.map((v) => (
            <li key={v.youtube_id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-4">
              <SubjectCover subject={v.subject} size="sm" className="w-16 h-12 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{v.video_title}</p>
                <p className="text-xs text-[#6B7280] truncate">
                  {v.subject} · {v.chapter_name}
                  {isCompleted(v.youtube_id) && ' · Completed'}
                </p>
              </div>
              <div className="w-full sm:w-auto flex items-center justify-end gap-3">
              <button onClick={() => toggleFavorite(v.youtube_id)} className="text-sm text-[#6B7280] hover:text-rose-700 cursor-pointer">
                Remove
              </button>
              {v.isActive ? (
                <Link to={lessonPath(v.youtube_id)} className={btnPrimary}>
                  <Play className="w-4 h-4 fill-white" /> Watch
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4" /> No longer available
                </span>
              )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const FocusPage: React.FC = () => {
  const { timer } = useStudentContext();
  const { user } = useAuth();
  const modes: { id: FocusMode; label: string }[] = [
    { id: 'focus', label: 'Focus 25 min' },
    { id: 'short', label: 'Break 5 min' },
    { id: 'long', label: 'Break 15 min' },
  ];
  const r = 110;
  const circumference = 2 * Math.PI * r;
  const progress = 1 - timer.secondsLeft / timer.total;

  return (
    <div className="space-y-6">
      <PageHeader title="Focus timer" description="Study in focused blocks. The timer keeps running while you watch lessons." />
      <div className={`${card} p-6 sm:p-10 flex flex-col items-center gap-8`}>
        <div role="radiogroup" aria-label="Session type" className="flex flex-wrap justify-center gap-1 p-1 rounded-lg bg-[#F3F4F6]">
          {modes.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={timer.mode === m.id}
              onClick={() => timer.selectMode(m.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer ${
                timer.mode === m.id ? 'bg-white shadow-sm text-[#1E2233]' : 'text-[#6B7280]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="relative w-56 h-56 sm:w-64 sm:h-64">
          <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle cx="120" cy="120" r={r} fill="none" stroke="#EEF0F3" strokeWidth="10" />
            <circle
              cx="120"
              cy="120"
              r={r}
              fill="none"
              stroke={timer.mode === 'focus' ? '#3B4FE0' : '#12A594'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" aria-live="polite">
            <span className="text-4xl sm:text-5xl font-semibold font-mono tabular-nums">{timer.label}</span>
            <span className="mt-1 text-sm text-[#6B7280]">
              {timer.secondsLeft === 0 ? 'Session complete' : timer.running ? 'In progress' : 'Paused'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={timer.toggle} disabled={timer.secondsLeft === 0} className={`${btnPrimary} px-6`}>
            {timer.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            {timer.running ? 'Pause' : 'Start'}
          </button>
          <button onClick={timer.reset} className={btnSecondary} aria-label="Reset timer">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        <p className="text-sm text-[#6B7280]">
          {timer.sessionsToday} focus {timer.sessionsToday === 1 ? 'session' : 'sessions'} completed
          {user?.study_goal_minutes && ` · daily goal ${user.study_goal_minutes} min`}
        </p>
      </div>
    </div>
  );
};

export const RemindersPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Reminders" description="Choose if, how often and when we email you your next lesson." />
    <ReminderSettingsCard />
  </div>
);

export const ProfilePage: React.FC = () => {
  const { videoMap } = useCatalogContext();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader title="Profile & settings" description="Your account, class, study preferences and data." />
      <ProfileSettings videoMap={videoMap} onOpenAdmin={isAdmin ? () => navigate('/admin') : undefined} />
    </div>
  );
};
