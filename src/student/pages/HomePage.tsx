import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play,
  Flame,
  ChevronRight,
  CheckCircle2,
  Circle,
  MessageCircleQuestion,
  Bell,
  Timer,
  Trophy,
  GraduationCap,
  Sparkles,
  Megaphone,
  AlertTriangle,
  ArrowRight,
  Pin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { useDoubts } from '../../context/DoubtsContext';
import { useCatalogContext } from '../../context/CatalogContext';
import { useDashboardConfig } from '../../hooks/useDashboardConfig';
import { AdminDashboard } from '../../pages/admin/AdminDashboard';
import { classLabel, currentStreak, streakWeek, xpStats } from '../../data/gamification';
import { reminderSummary } from '../../components/profile/ReminderSettingsCard';
import { useCourse } from '../useCourse';
import { SubjectCard } from './SubjectsPage';
import { EmptyState, ProgressBar, SubjectCover, btnPrimary, card, formatDuration, lessonPath, linkText, subjectPath } from '../ui';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export const HomePage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { isCompleted } = useProgress();
  const { unreadCount, myDoubts } = useDoubts();
  const course = useCourse();
  const { allVideos, records, refreshCatalog } = useCatalogContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as any) || 'overview';
  const initialNavOptions = {
    notesKey: searchParams.get('notesKey') || undefined,
    doubtId: searchParams.get('doubtId') || undefined,
  };

  if (!user) return null;

  // When logged in as Administrator, immediately render the full Admin Dashboard
  if (isAdmin || user.role === 'admin' || user.email === 'admin@ncertprep.edu') {
    return (
      <AdminDashboard
        allVideos={allVideos}
        records={records}
        onRefreshCatalog={refreshCatalog}
        onBackToApp={() => navigate('/browse')}
        onSelectVideo={(v) => navigate(`/app/lesson/${encodeURIComponent(v.youtube_id)}`)}
        currentSection={currentTab}
        onSectionChange={(nextSection, options) => {
          const nextParams: Record<string, string> = { tab: nextSection };
          if (options?.notesKey) nextParams.notesKey = options.notesKey;
          if (options?.doubtId) nextParams.doubtId = options.doubtId;
          setSearchParams(nextParams);
        }}
        initialNavOptions={initialNavOptions}
        hideSidebar={true}
      />
    );
  }

  if (!course.classSort) {
    return (
      <EmptyState
        icon={<GraduationCap className="w-5 h-5" />}
        title="Choose your class to get started"
        body="Finish the setup to see your subjects."
      />
    );
  }

  const streak = currentStreak(user);
  const week = streakWeek(user);
  const { level, xp, xpInLevel, xpToNext } = xpStats(course.completedCount);
  const resume = course.resume;
  const resumeSubject = resume ? course.subjects.find((s) => s.group.name === resume.subject) : undefined;
  const upNext = course.subjects
    .flatMap((s) => s.lessons.filter((v) => !isCompleted(v.youtube_id)).slice(0, 2))
    .filter((v) => v.youtube_id !== resume?.youtube_id)
    .slice(0, 5);
  const openDoubts = myDoubts.filter((d) => d.status === 'open').length;

  const { config } = useDashboardConfig();
  const studentClassInt = parseInt(course.classSort.replace(/\D/g, ''), 10);
  const ann = config?.announcement;
  const isAnnTarget = Boolean(
    ann &&
      ann.isActive &&
      (ann.targetClass === 'all' ||
        ann.targetClass === course.classSort ||
        parseInt(ann.targetClass.replace(/\D/g, ''), 10) === studentClassInt)
  );

  const spotlight = config?.spotlights
    ? config.spotlights[course.classSort] ||
      config.spotlights[String(studentClassInt)] ||
      config.spotlights[studentClassInt < 10 ? `0${studentClassInt}` : String(studentClassInt)]
    : undefined;

  const isSpotlightActive = Boolean(spotlight && spotlight.isActive);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[#6B7280]">{classLabel(course.classSort)}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {user.displayName?.split(' ')[0] || 'there'}
        </h1>
      </header>

      {/* Broadcast Announcement Banner */}
      {isAnnTarget && ann && (
        <section aria-label="Educator announcement" className="animate-in fade-in duration-300">
          <div
            className={`rounded-2xl p-4 sm:p-5 border transition-all ${
              ann.tone === 'exam'
                ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white border-purple-500/30 shadow-sm'
                : ann.tone === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : ann.tone === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    ann.tone === 'exam'
                      ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30'
                      : ann.tone === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : ann.tone === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {ann.tone === 'exam' ? (
                    <Sparkles className="w-5 h-5" />
                  ) : ann.tone === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : ann.tone === 'success' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Megaphone className="w-5 h-5" />
                  )}
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        ann.tone === 'exam'
                          ? 'bg-purple-500/30 text-purple-200 border border-purple-400/20'
                          : ann.tone === 'warning'
                          ? 'bg-amber-200/80 text-amber-900'
                          : ann.tone === 'success'
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : 'bg-blue-200/80 text-blue-900'
                      }`}
                    >
                      {ann.tone === 'exam'
                        ? 'Exam & Board Notice'
                        : ann.tone === 'warning'
                        ? 'Important Alert'
                        : ann.tone === 'success'
                        ? 'Good News'
                        : 'Educator Broadcast'}
                    </span>
                    <h2
                      className={`text-sm sm:text-base font-bold truncate ${
                        ann.tone === 'exam' ? 'text-white' : ''
                      }`}
                    >
                      {ann.title}
                    </h2>
                  </div>
                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      ann.tone === 'exam' ? 'text-slate-300' : 'text-current/80'
                    }`}
                  >
                    {ann.message}
                  </p>
                </div>
              </div>
              {ann.actionLabel && ann.actionUrl && (
                <Link
                  to={ann.actionUrl}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors shadow-sm cursor-pointer ${
                    ann.tone === 'exam'
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : ann.tone === 'warning'
                      ? 'bg-amber-900 text-white hover:bg-amber-800'
                      : ann.tone === 'success'
                      ? 'bg-emerald-800 text-white hover:bg-emerald-700'
                      : 'bg-[#3B4FE0] text-white hover:bg-[#2F3FB5]'
                  }`}
                >
                  {ann.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {course.allLessons.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-5 h-5" />}
          title={`Lessons for ${classLabel(course.classSort)} are coming soon`}
          body="If you picked the wrong class, change it in Profile & settings."
          action={<Link to="/app/profile" className={btnPrimary}>Review my class</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8">
          <div className="space-y-8 min-w-0">
            {/* Educator Spotlight Section */}
            {isSpotlightActive && spotlight && (
              <section aria-labelledby="spotlight-title">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <h2 id="spotlight-title" className="text-base font-semibold">
                      Educator's Daily Spotlight
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    Recommended for Class {studentClassInt}
                  </span>
                </div>
                <div className={`${card} overflow-hidden border-2 border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white`}>
                  <div className="p-5 flex flex-col sm:flex-row gap-5">
                    <SubjectCover subject={spotlight.subject} className="sm:w-48 h-28 sm:h-auto rounded-xl shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-[#6B7280]">
                          <span className="font-semibold text-[#1E2233]">{spotlight.subject}</span>
                          <span>·</span>
                          <span className="truncate">{spotlight.chapterName}</span>
                          {isCompleted(spotlight.videoId) && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-base font-bold text-[#1E2233] leading-snug">
                          {spotlight.title}
                        </p>
                        {spotlight.note && (
                          <div className="mt-2.5 flex items-start gap-1.5 p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 text-xs">
                            <Pin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              <span className="font-bold">Teacher's Note:</span> {spotlight.note}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <Link to={lessonPath(spotlight.videoId)} className={btnPrimary}>
                          <Play className="w-4 h-4 fill-white" /> Watch Spotlight Lesson
                        </Link>
                        <Link to={subjectPath(spotlight.subject)} className={linkText}>
                          View chapter
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {resume && (
              <section aria-labelledby="continue-title">
                <h2 id="continue-title" className="text-base font-semibold mb-3">
                  {course.resumeStarted ? 'Continue learning' : 'Start learning'}
                </h2>
                <div className={`${card} overflow-hidden flex flex-col sm:flex-row`}>
                  <SubjectCover subject={resume.subject} className="sm:w-56 h-32 sm:h-auto shrink-0" />
                  <div className="flex-1 p-5 flex flex-col gap-4">
                    <div>
                      <p className="text-xs font-medium text-[#6B7280]">
                        {resume.subject} · {resume.chapter_name}
                      </p>
                      <p className="mt-1 text-lg font-semibold leading-snug">{resume.video_title}</p>
                    </div>
                    {resumeSubject && (
                      <div className="space-y-1.5">
                        <ProgressBar value={resumeSubject.percent} />
                        <p className="text-xs text-[#6B7280]">
                          {resumeSubject.completed} of {resumeSubject.lessons.length} lessons in {resume.subject} completed
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4">
                      <Link to={lessonPath(resume.youtube_id)} className={btnPrimary}>
                        <Play className="w-4 h-4 fill-white" /> {course.resumeStarted ? 'Resume' : 'Start lesson'}
                      </Link>
                      <Link to={subjectPath(resume.subject)} className={linkText}>
                        View subject
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section aria-labelledby="subjects-title">
              <div className="flex items-center justify-between mb-3">
                <h2 id="subjects-title" className="text-base font-semibold">My subjects</h2>
                <Link to="/app/subjects" className={linkText}>View all</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {course.subjects.slice(0, 8).map((s) => (
                  <SubjectCard key={s.group.name} summary={s} />
                ))}
              </div>
            </section>

            {upNext.length > 0 && (
              <section aria-labelledby="upnext-title">
                <h2 id="upnext-title" className="text-base font-semibold mb-3">Up next</h2>
                <ul className={`${card} divide-y divide-[#E5E7EB]`}>
                  {upNext.map((v) => (
                    <li key={v.youtube_id}>
                      <Link to={lessonPath(v.youtube_id)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F7F8FA]">
                        {isCompleted(v.youtube_id) ? (
                          <CheckCircle2 className="w-5 h-5 text-[#12A594] shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#D1D5DB] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{v.video_title}</p>
                          <p className="text-xs text-[#6B7280] truncate">
                            {v.subject} · {v.chapter_name}
                          </p>
                        </div>
                        <span className="text-xs text-[#6B7280] shrink-0">{formatDuration(v.duration_seconds)}</span>
                        <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className={`${card} p-5`}>
              <p className="text-sm font-semibold">Course progress</p>
              <p className="mt-1 text-3xl font-semibold">{course.percent}%</p>
              <ProgressBar value={course.percent} className="mt-3" />
              <p className="mt-2 text-xs text-[#6B7280]">
                {course.completedCount} of {course.allLessons.length} lessons completed
              </p>
            </div>

            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Weekly streak</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600">
                  <Flame className="w-4 h-4" /> {streak} {streak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <ol className="mt-4 flex justify-between" aria-label="Last 7 days">
                {week.map((d) => (
                  <li key={d.key} className="flex flex-col items-center gap-1">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium ${
                        d.active ? 'bg-orange-500 text-white' : d.isToday ? 'border-2 border-[#1E2233]/20 text-[#374151]' : 'bg-[#F3F4F6] text-[#9CA3AF]'
                      }`}
                    >
                      {d.label}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-[#6B7280]">Watch one lesson a day to build your streak.</p>
            </div>

            <div className={`${card} p-5 flex items-center gap-4`}>
              <span className="w-10 h-10 rounded-full bg-[#EEF0FD] text-[#3B4FE0] flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  Level {level} <span className="font-normal text-[#6B7280]">· {xp} XP</span>
                </p>
                <ProgressBar value={xpInLevel} className="mt-2" />
                <p className="mt-1 text-xs text-[#6B7280]">{xpToNext} XP to next level</p>
              </div>
            </div>

            <div className={`${card} divide-y divide-[#E5E7EB]`}>
              {[
                {
                  to: '/app/doubts',
                  icon: MessageCircleQuestion,
                  label: 'Doubts',
                  value: unreadCount ? `${unreadCount} new ${unreadCount === 1 ? 'reply' : 'replies'}` : `${openDoubts} open`,
                },
                { to: '/app/reminders', icon: Bell, label: 'Reminders', value: reminderSummary(user.reminders_enabled, user.reminder_frequency, user.reminder_hour) },
                { to: '/app/focus', icon: Timer, label: 'Focus timer', value: user.study_goal_minutes ? `${user.study_goal_minutes} min goal` : '25 min' },
              ].map((row) => (
                <Link key={row.to} to={row.to} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F7F8FA]">
                  <row.icon className="w-4 h-4 text-[#6B7280]" />
                  <span className="flex-1 text-sm font-medium">{row.label}</span>
                  <span className="text-xs text-[#6B7280]">{row.value}</span>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
