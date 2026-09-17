import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, Bookmark, ChevronDown, ChevronRight, PlayCircle, Video as VideoIcon } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { useCatalogContext } from '../../context/CatalogContext';
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
  const currentChapterKey = subject?.chapters.find((c) => c.videos.some((v) => v.youtube_id === videoId))?.key;
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
    { id: 'notes', label: 'Notes' },
    { id: 'doubts', label: 'Ask a doubt' },
    { id: 'feedback', label: 'Feedback' },
  ];

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-[#6B7280] truncate">
        {publicMode ? (
          <Link to="/browse" className="hover:underline">Syllabus</Link>
        ) : (
          <>
            <Link to="/app/subjects" className="hover:underline">My subjects</Link> /{' '}
            <Link to={subjectPath(video.subject)} className="hover:underline">{video.subject}</Link>
          </>
        )}{' '}
        / <span className="text-[#1E2233]">{video.chapter_name}</span>
      </nav>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="min-w-0 space-y-5">
          <LessonPlayer
            youtubeId={video.youtube_id}
            title={video.video_title}
            onEnded={() => !isCompleted(video.youtube_id) && toggleCompleted(video.youtube_id)}
          />

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
                onClick={() => toggleFavorite(video.youtube_id)}
                aria-pressed={saved}
                className={btnSecondary}
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-[#3B4FE0] text-[#3B4FE0]' : ''}`} />
                {saved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => toggleCompleted(video.youtube_id)}
                aria-pressed={completed}
                className={completed ? `${btnSecondary} text-[#0E8577] border-[#BCE8DC] bg-[#E1F5EE]` : btnSecondary}
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
                  <ChapterNotesContent notes={notes} loading={notesLoading} />
                </div>
              )}
              {tab === 'doubts' && <AskDoubtForm video={video} />}
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
                              ) : (
                                <Circle className="w-4 h-4 mt-0.5 text-[#D1D5DB] shrink-0" aria-label="Not started" />
                              )}
                              <span className="flex-1 min-w-0">
                                <span className="block text-xs font-normal text-[#6B7280]">Lecture {li + 1}</span>
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
