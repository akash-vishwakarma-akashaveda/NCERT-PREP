import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Flame, ChevronRight, CheckCircle2, Circle, MessageCircleQuestion, Bell, Timer, Trophy, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { useDoubts } from '../../context/DoubtsContext';
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

  if (!user) return null;

  if (!course.classSort) {
    return isAdmin ? (
      <EmptyState
        icon={<GraduationCap className="w-5 h-5" />}
        title="You're signed in as an administrator"
        body="Manage classes, lessons, notes and doubts from the admin dashboard."
        action={<Link to="/admin" className={btnPrimary}>Open admin dashboard</Link>}
      />
    ) : (
      <EmptyState icon={<GraduationCap className="w-5 h-5" />} title="Choose your class to get started" body="Finish the setup to see your subjects." />
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

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[#6B7280]">{classLabel(course.classSort)}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {user.displayName?.split(' ')[0] || 'there'}
        </h1>
      </header>

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
