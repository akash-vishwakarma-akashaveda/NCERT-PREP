import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, FileText, Play, Bookmark, ChevronDown, BookOpen } from 'lucide-react';
import { NotesTarget } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { NotesService } from '../../services/content';
import { RevisionNotesModal } from '../../components/app/RevisionNotesModal';
import { classLabel } from '../../data/gamification';
import { SubjectSummary, useCourse } from '../useCourse';
import { EmptyState, PageHeader, ProgressBar, SubjectCover, btnPrimary, card, formatDuration, lessonPath, subjectPath } from '../ui';

export const SubjectCard: React.FC<{ summary: SubjectSummary }> = ({ summary }) => (
  <Link to={subjectPath(summary.group.name)} className={`${card} overflow-hidden flex flex-col hover:shadow-md transition-shadow`}>
    <SubjectCover subject={summary.group.name} className="h-28" />
    <div className="p-4 flex-1 flex flex-col gap-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold">{summary.group.name}</p>
          {summary.isFocus && <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-[#EEF0FD] text-[#3B4FE0]">Focus</span>}
        </div>
        <p className="text-xs text-[#6B7280]">
          {summary.group.chapters.length} chapters · {summary.lessons.length} lessons
        </p>
      </div>
      <div className="mt-auto space-y-1.5">
        <ProgressBar value={summary.percent} />
        <p className="text-xs text-[#6B7280]">{summary.percent}% complete</p>
      </div>
    </div>
  </Link>
);

export const SubjectsPage: React.FC = () => {
  const course = useCourse();
  const { isAdmin } = useAuth();

  if (isAdmin && !course.classSort) {
    return <Navigate to="/browse" replace />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My subjects" description={`${classLabel(course.classSort)} · ${course.subjects.length} subjects`} />
      {course.subjects.length === 0 ? (
        <EmptyState icon={<BookOpen className="w-5 h-5" />} title="No subjects yet" body="Lessons for your class haven't been published yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {course.subjects.map((s) => (
            <SubjectCard key={s.group.name} summary={s} />
          ))}
        </div>
      )}
    </div>
  );
};

export const SubjectDetailPage: React.FC = () => {
  const { subject = '' } = useParams();
  const course = useCourse();
  const { isCompleted, isFavorited, toggleFavorite } = useProgress();
  const [notesKeys, setNotesKeys] = useState<Set<string>>(new Set());
  const [notesTarget, setNotesTarget] = useState<NotesTarget | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (course.classSort) NotesService.publishedKeysForClass(course.classSort).then(setNotesKeys);
  }, [course.classSort]);

  const summary = course.subjects.find((s) => s.group.name === subject);
  if (!summary) {
    return (
      <EmptyState
        icon={<BookOpen className="w-5 h-5" />}
        title={course.loading ? 'Loading subject…' : 'Subject not found'}
        action={!course.loading && <Link to="/app/subjects" className={btnPrimary}>Back to my subjects</Link>}
      />
    );
  }

  const toggleChapter = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280]">
        <Link to="/app/subjects" className="hover:underline">My subjects</Link> <span aria-hidden="true">/</span>{' '}
        <span className="text-[#1E2233]">{summary.group.name}</span>
      </nav>

      <section className={`${card} overflow-hidden flex flex-col sm:flex-row`}>
        <SubjectCover subject={summary.group.name} className="sm:w-60 h-32 sm:h-auto shrink-0" />
        <div className="flex-1 p-5 sm:p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{summary.group.name}</h1>
            <p className="text-sm text-[#6B7280]">
              {classLabel(course.classSort)}
              {summary.group.textbook && ` · ${summary.group.textbook}`} · {summary.group.chapters.length} chapters ·{' '}
              {summary.lessons.length} lessons
            </p>
          </div>
          <div className="max-w-md space-y-1.5">
            <ProgressBar value={summary.percent} />
            <p className="text-xs text-[#6B7280]">
              {summary.completed} of {summary.lessons.length} lessons completed
            </p>
          </div>
          {summary.nextLesson && (
            <Link to={lessonPath(summary.nextLesson.youtube_id)} className={btnPrimary}>
              <Play className="w-4 h-4 fill-white" /> {summary.completed ? 'Continue' : 'Start subject'}
            </Link>
          )}
        </div>
      </section>

      <section aria-label="Chapters" className="space-y-3">
        {summary.group.chapters.map((chapter, index) => {
          const done = chapter.videos.filter((v) => isCompleted(v.youtube_id)).length;
          const open = !collapsed.has(chapter.key);
          return (
            <div key={chapter.key} className={card}>
              <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
                <button
                  onClick={() => toggleChapter(chapter.key)}
                  aria-expanded={open}
                  className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                >
                  <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${open ? '' : '-rotate-90'}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-[#6B7280]">Chapter {index + 1}</p>
                    <p className="font-semibold truncate">{chapter.chapter_name}</p>
                  </div>
                </button>
                {notesKeys.has(chapter.key) && (
                  <button
                    onClick={() => setNotesTarget(chapter)}
                    aria-label="Chapter notes"
                    className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium text-[#3B4FE0] hover:bg-[#EEF0FD] cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Notes</span>
                  </button>
                )}
                <span className="text-xs text-[#6B7280] shrink-0">
                  {done}/{chapter.videos.length}
                </span>
              </div>

              {open && (
                <ul className="border-t border-[#E5E7EB] divide-y divide-[#F0F1F3]">
                  {chapter.videos.length === 0 && (
                    <li className="px-5 py-3 text-sm text-[#6B7280]">Video lessons for this chapter are coming soon.</li>
                  )}
                  {chapter.videos.map((v) => {
                    const completed = isCompleted(v.youtube_id);
                    const saved = isFavorited(v.youtube_id);
                    return (
                      <li key={v.youtube_id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-[#F7F8FA]">
                        {completed ? (
                          <CheckCircle2 className="w-5 h-5 text-[#12A594] shrink-0" aria-label="Completed" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#D1D5DB] shrink-0" aria-label="Not started" />
                        )}
                        <Link to={lessonPath(v.youtube_id)} className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate hover:text-[#3B4FE0]">{v.video_title}</p>
                          <p className="text-xs text-[#6B7280]">
                            Video {formatDuration(v.duration_seconds) && `· ${formatDuration(v.duration_seconds)}`}
                            {v.pyq_available && ' · Includes PYQs'}
                          </p>
                        </Link>
                        <button
                          onClick={() => toggleFavorite(v.youtube_id)}
                          aria-label={saved ? 'Remove from saved' : 'Save lesson'}
                          aria-pressed={saved}
                          className="p-1.5 rounded-lg hover:bg-[#EEF0F3] cursor-pointer"
                        >
                          <Bookmark className={`w-4 h-4 ${saved ? 'fill-[#3B4FE0] text-[#3B4FE0]' : 'text-[#9CA3AF]'}`} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      {notesTarget && <RevisionNotesModal isOpen onClose={() => setNotesTarget(null)} target={notesTarget} />}
    </div>
  );
};
