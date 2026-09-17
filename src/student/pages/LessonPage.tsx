import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Bookmark,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  Video as VideoIcon,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { useCatalogContext } from '../../context/CatalogContext';
import { useAuth } from '../../context/AuthContext';
import { isLessonUnlocked } from '../../services/accessControl';
import { ChapterNotesContent, useChapterNotes } from '../../components/app/RevisionNotesModal';
import { AskDoubtForm } from '../../components/player/AskDoubtForm';
import { FeedbackForm } from '../../components/player/FeedbackForm';
import { LessonPlayer } from '../LessonPlayer';
import { EmptyState, btnPrimary, btnSecondary, card, formatDuration, lessonPath, subjectPath } from '../ui';

type TabId = 'overview' | 'notes' | 'doubts' | 'feedback';

// Visitors use /watch/:videoId (publicMode), signed-in students /app/lesson/:videoId.
export const LessonPage: React.FC<{ publicMode?: boolean }> = ({ publicMode = false }) => {
  const { videoId = '' } = useParams();
  const navigate = useNavigate();
  const { user, setAuthModalOpen } = useAuth();
  const { videoMap, getSubjectsForClass, loading } = useCatalogContext();
  const { isCompleted, isFavorited, toggleCompleted, toggleFavorite, recordVideoWatched } = useProgress();
  const [tab, setTab] = useState<TabId>('overview');

  const video = videoMap.get(videoId);
  const pathFor = (id: string) => (publicMode ? `/watch/${encodeURIComponent(id)}` : lessonPath(id));

  useEffect(() => {
    if (video?.isActive) recordVideoWatched(video.youtube_id);
    setTab('overview');
  }, [video?.youtube_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const subject = useMemo(
    () => (video ? getSubjectsForClass(video.class_sort).find((s) => s.name === video.subject) : undefined),
    [video, getSubjectsForClass]
  );
  const ordered = subject?.chapters.flatMap((c) => c.videos) || [];
  const index = ordered.findIndex((v) => v.youtube_id === videoId);
  const next = index >= 0 ? ordered[index + 1] : undefined;

  // Outline chapters are collapsible; the chapter holding the current lesson always opens.
  const currentChapterIndex = subject?.chapters.findIndex((c) => c.videos.some((v) => v.youtube_id === videoId)) ?? -1;
  const currentChapter = currentChapterIndex >= 0 ? subject?.chapters[currentChapterIndex] : undefined;
  const currentChapterKey = currentChapter?.key;
  const currentVideoIndexInChapter = currentChapter?.videos.findIndex((v) => v.youtube_id === videoId) ?? -1;

  // Access control: signed-in users unlock everything; visitors only get Chapter 1, Lesson 1 as free preview.
  const isUnlocked = video
    ? isLessonUnlocked(
        video,
        user,
        currentChapterIndex >= 0 ? currentChapterIndex : undefined,
        currentVideoIndexInChapter >= 0 ? currentVideoIndexInChapter : undefined
      )
    : false;
  const isFreePreview = !user && isUnlocked;

  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (currentChapterKey) setOpenChapters((prev) => (prev.has(currentChapterKey) ? prev : new Set(prev).add(currentChapterKey)));
  }, [currentChapterKey]);
  const toggleChapter = (key: string) =>
    setOpenChapters((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(key)) nextSet.delete(key);
      else nextSet.add(key);
      return nextSet;
    });

  const notesTarget = video || { class_sort: '', subject: '', chapter_id: '', chapter_name: '' };
  const { notes, loading: notesLoading } = useChapterNotes(notesTarget, Boolean(video) && tab === 'notes');

  if (!video || !video.isActive) {
    return (
      <EmptyState
        icon={<VideoIcon className="w-5 h-5" />}
        title={loading ? 'Loading lesson…' : 'This lesson is not available'}
        body={loading ? undefined : 'It may have been removed. Pick another lesson from your subjects.'}
        action={!loading && <Link to={publicMode ? '/browse' : '/app/subjects'} className={btnPrimary}>Browse lessons</Link>}
      />
    );
  }

  const completed = isCompleted(video.youtube_id);
  const saved = isFavorited(video.youtube_id);
  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'notes', label: 'Notes & Cheat Sheet' },
    { id: 'doubts', label: 'Ask a doubt' },
    { id: 'feedback', label: 'Feedback' },
  ];

  return (
    <div className="space-y-4 pb-16">
      <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280] truncate flex items-center gap-1.5">
        {publicMode ? (
          <Link to="/browse" className="hover:underline">Syllabus</Link>
        ) : (
          <>
            <Link to="/app/subjects" className="hover:underline">My subjects</Link> /{' '}
            <Link to={subjectPath(video.subject)} className="hover:underline">{video.subject}</Link>
          </>
        )}{' '}
        / <span className="text-[#1E2233] font-medium">{video.chapter_name}</span>
      </nav>

      {/* Free Preview Banner for Visitors */}
      {isFreePreview && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-[#12A594] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-[#1E2233]">Free Sample Preview: </span>
              <span className="text-[#6B7280]">
                You are viewing the free preview lesson for {video.subject}. Sign in to unlock all {ordered.length} lessons and formula cheat sheets!
              </span>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-4 py-1.5 font-bold text-xs text-white bg-[#3B4FE0] hover:bg-[#2F40BD] rounded-xl transition-all shrink-0 cursor-pointer self-start sm:self-auto shadow-xs hover:scale-105"
          >
            Sign in free
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="min-w-0 space-y-5">
          {/* Main Video Screen: Player if Unlocked, or Member Lock Screen if Visitor on Locked Video */}
          {isUnlocked ? (
            <LessonPlayer
              youtubeId={video.youtube_id}
              title={video.video_title}
              onEnded={() => !isCompleted(video.youtube_id) && toggleCompleted(video.youtube_id)}
            />
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col items-center justify-center p-6 sm:p-10 text-center border border-slate-700/80 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 mb-4 shadow-[0_0_30px_rgba(99,102,241,0.35)]">
                <Lock className="w-8 h-8 text-indigo-300" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30 mb-2">
                Member-Only Lesson · Free Registration
              </span>
              <h2 className="text-xl sm:text-2xl font-black max-w-lg text-white">
                {video.video_title}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-md">
                Full chapter revision, formula cheat sheets, PYQs, and educator doubts require a free student account. It takes 10 seconds to sign in!
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#3B4FE0] to-[#5063F0] hover:scale-105 shadow-md transition-all cursor-pointer"
                >
                  Sign In / Create Free Account
                </button>
                <Link
                  to="/browse"
                  className="px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
                >
                  ← Back to Syllabus
                </Link>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold leading-snug">{video.video_title}</h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                {video.class_display} · {video.subject} · {video.chapter_name}
                {formatDuration(video.duration_seconds) && ` · ${formatDuration(video.duration_seconds)}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <button
                onClick={() => {
                  if (!user) {
                    setAuthModalOpen(true);
                  } else {
                    toggleFavorite(video.youtube_id);
                  }
                }}
                aria-pressed={saved}
                className={btnSecondary}
                title={!user ? 'Sign in to save favorites' : saved ? 'Remove from saved' : 'Save to favorites'}
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-[#3B4FE0] text-[#3B4FE0]' : ''}`} />
                {saved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => {
                  if (!user) {
                    setAuthModalOpen(true);
                  } else {
                    toggleCompleted(video.youtube_id);
                  }
                }}
                aria-pressed={completed}
                className={completed ? `${btnSecondary} text-[#0E8577] border-[#BCE8DC] bg-[#E1F5EE]` : btnSecondary}
                title={!user ? 'Sign in to track progress' : completed ? 'Completed' : 'Mark complete'}
              >
                <CheckCircle2 className="w-4 h-4" />
                {completed ? 'Completed' : 'Mark complete'}
              </button>
              {next && (
                <button onClick={() => navigate(pathFor(next.youtube_id))} className={btnPrimary}>
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className={card}>
            <div role="tablist" aria-label="Lesson sections" className="flex gap-1 border-b border-[#E5E7EB] px-2 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
                    tab === t.id ? 'border-[#3B4FE0] text-[#3B4FE0]' : 'border-transparent text-[#6B7280] hover:text-[#1E2233]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="p-4 sm:p-5 text-sm">
              {tab === 'overview' && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ['Class', video.class_display],
                    ['Subject', video.subject],
                    ['Chapter', `${video.chapter_id} · ${video.chapter_name}`],
                    ['Textbook', video.textbook || '—'],
                  ].map(([k, val]) => (
                    <div key={k}>
                      <dt className="text-xs text-[#6B7280]">{k}</dt>
                      <dd className="font-medium">{val}</dd>
                    </div>
                  ))}
                  <p className="sm:col-span-2 text-xs text-[#6B7280]">
                    Plays without recommendations or comments. Finishing the video marks it complete.
                  </p>
                </dl>
              )}
              {tab === 'notes' && (
                <div className="space-y-5">
                  {!user && !isUnlocked ? (
                    <div className="p-6 text-center bg-[#F8F9FD] border border-[#E3E5EC] rounded-2xl space-y-3">
                      <Lock className="w-8 h-8 text-[#3B4FE0] mx-auto" />
                      <h3 className="text-base font-bold text-[#1E2233]">Revision Notes & Formula Cheat Sheets</h3>
                      <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                        Sign in to access comprehensive formula cheat sheets, definitions, and exam notes for this chapter.
                      </p>
                      <button
                        onClick={() => setAuthModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] shadow-xs cursor-pointer"
                      >
                        Sign in free to view notes
                      </button>
                    </div>
                  ) : (
                    <ChapterNotesContent notes={notes} loading={notesLoading} />
                  )}
                </div>
              )}
              {tab === 'doubts' && (
                <div>
                  {!user ? (
                    <div className="p-6 text-center bg-[#F8F9FD] border border-[#E3E5EC] rounded-2xl space-y-3">
                      <Lock className="w-8 h-8 text-[#3B4FE0] mx-auto" />
                      <h3 className="text-base font-bold text-[#1E2233]">Ask Educator Doubts</h3>
                      <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                        Stuck on a concept in this video? Sign in to ask doubts and get personal explanations from verified educators.
                      </p>
                      <button
                        onClick={() => setAuthModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] shadow-xs cursor-pointer"
                      >
                        Sign in free to ask doubts
                      </button>
                    </div>
                  ) : (
                    <AskDoubtForm video={video} />
                  )}
                </div>
              )}
              {tab === 'feedback' && <FeedbackForm youtubeId={video.youtube_id} videoTitle={video.video_title} />}
            </div>
          </div>
        </div>

        <aside className={`${card} self-start overflow-hidden xl:sticky xl:top-20`}>
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <p className="text-sm font-semibold">{video.subject}</p>
            <p className="text-xs text-[#6B7280]">
              {ordered.filter((v) => isCompleted(v.youtube_id)).length} of {ordered.length} lessons completed
            </p>
          </div>
          <ol className="max-h-[70vh] overflow-y-auto divide-y divide-[#F0F1F3]">
            {subject?.chapters.map((chapter, ci) => {
              const open = openChapters.has(chapter.key);
              const done = chapter.videos.filter((v) => isCompleted(v.youtube_id)).length;
              const hasCurrent = chapter.key === currentChapterKey;
              const panelId = `outline-${chapter.key}`;
              return (
                <li key={chapter.key}>
                  <button
                    type="button"
                    onClick={() => toggleChapter(chapter.key)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left text-sm cursor-pointer hover:bg-[#F7F8FA] ${
                      hasCurrent ? 'text-[#3B4FE0]' : 'text-[#1E2233]'
                    }`}
                  >
                    <span className="w-5 shrink-0 text-right tabular-nums text-[#9CA3AF]">{ci + 1}.</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium">{chapter.chapter_name}</span>
                      <span className="block text-xs font-normal text-[#6B7280]">
                        {chapter.videos.length
                          ? `${done}/${chapter.videos.length} ${chapter.videos.length === 1 ? 'lecture' : 'lectures'}`
                          : 'Coming soon'}
                      </span>
                    </span>
                    {chapter.videos.length > 0 && done === chapter.videos.length ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#12A594] shrink-0" aria-label="Chapter completed" />
                    ) : null}
                    <ChevronDown
                      className={`w-4 h-4 mt-0.5 text-[#6B7280] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  {open && chapter.videos.length > 0 && (
                    <ul id={panelId} className="pb-2">
                      {chapter.videos.map((v, li) => {
                        const current = v.youtube_id === video.youtube_id;
                        const isVidUnlocked = isLessonUnlocked(v, user, ci, li);

                        return (
                          <li key={v.youtube_id}>
                            <Link
                              to={pathFor(v.youtube_id)}
                              aria-current={current ? 'page' : undefined}
                              className={`flex items-start gap-3 pl-12 pr-4 py-2 text-sm ${
                                current ? 'bg-[#EEF0FD] text-[#3B4FE0] font-semibold' : 'text-[#374151] hover:bg-[#F7F8FA]'
                              }`}
                            >
                              {current ? (
                                <PlayCircle className="w-4 h-4 mt-0.5 text-[#3B4FE0] shrink-0" aria-label="Now playing" />
                              ) : isCompleted(v.youtube_id) ? (
                                <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#12A594] shrink-0" aria-label="Completed" />
                              ) : !isVidUnlocked ? (
                                <Lock className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0" aria-label="Locked" />
                              ) : (
                                <Circle className="w-4 h-4 mt-0.5 text-[#D1D5DB] shrink-0" aria-label="Not started" />
                              )}
                              <span className="flex-1 min-w-0">
                                <span className="block text-xs font-normal text-[#6B7280]">
                                  Lecture {li + 1} {!isVidUnlocked && '· Member Only'}
                                </span>
                                <span className="block">{v.video_title}</span>
                              </span>
                              <span className="text-xs font-normal text-[#6B7280] shrink-0">{formatDuration(v.duration_seconds)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
};
