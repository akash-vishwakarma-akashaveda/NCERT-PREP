import React, { useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight,
  BookOpen,
  Play,
  FileText,
  MessageCircleQuestion,
  Flame,
  BarChart3,
  Bell,
  XCircle,
  CheckCircle2,
  Sparkles,
  Timer,
} from 'lucide-react';
import { ClassGroup, Video } from '../types';
import { JumpBackInCard, thumbnailUrl } from '../components/home/JumpBackInCard';
import { ClassGrid } from '../components/home/ClassGrid';
import { ClassGridSkeleton } from '../components/common/SkeletonLoader';
import { useProgress } from '../context/ProgressContext';
import { getSubjectTileStyle } from '../data/colorTokens';

interface LandingPageProps {
  classes: ClassGroup[];
  allVideos: Video[];
  onExploreCurriculum: () => void;
  onSelectVideo: (video: Video) => void;
  onSelectClass: (classSort: string) => void;
  onLaunchDemoAuth: () => void;
}

const scrollToGrid = () =>
  document.getElementById('visual-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export const LandingPage: React.FC<LandingPageProps> = ({
  classes,
  allVideos,
  onExploreCurriculum,
  onSelectVideo,
  onSelectClass,
  onLaunchDemoAuth,
}) => {
  const { lastWatchedId, isCompleted } = useProgress();
  const lastWatchedVideo = lastWatchedId ? allVideos.find((v) => v.youtube_id === lastWatchedId) || null : null;

  const stats = useMemo(() => {
    const active = allVideos.filter((v) => v.isActive);
    return {
      lessons: active.length,
      subjects: new Set(active.map((v) => v.subject)).size,
      sample: active.find((v) => v.class_sort === '10') || active[0],
    };
  }, [allVideos]);

  const popular = classes
    .filter((c) => c.videoCount > 0)
    .sort((a, b) => b.videoCount - a.videoCount)
    .slice(0, 4);

  // Reveal sections as they scroll into view; re-scan when the class grid finishes loading.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.classList.add('is-visible');
          observer.unobserve(el);
          // Hand the element back to its own hover transitions once the reveal has played.
          const delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
          window.setTimeout(() => el.removeAttribute('data-reveal'), delay + 700);
        }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    root.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => observer.observe(el));
    root.classList.add('reveal-ready');
    return () => observer.disconnect();
  }, [classes.length]);

  const stagger = (i: number, step = 80) => ({ '--reveal-delay': `${i * step}ms` }) as React.CSSProperties;

  return (
    <div ref={rootRef} className="space-y-16 sm:space-y-24 pb-24">
      {/* Hero */}
      <section className="relative pt-6 sm:pt-12">
        <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div className="space-y-7">
            <span className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#E3E5EC] text-xs font-semibold text-[#1E2233] shadow-2xs">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-[#12A594] opacity-60 animate-ping" />
                <span className="relative w-2 h-2 rounded-full bg-[#12A594]" />
              </span>
              NCERT Classes 1–12 · 2026–27
            </span>

            <h1 className="animate-fade-up [animation-delay:80ms] text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-[#1E2233] text-balance">
              Revise every NCERT chapter.{' '}
              <span className="text-gradient-brand animate-gradient-text">Without the YouTube noise.</span>
            </h1>

            <p className="animate-fade-up [animation-delay:160ms] text-base sm:text-lg text-[#6B7280] max-w-xl">
              Structured video lessons by class, subject and chapter — with notes, cheat sheets, doubt support and
              progress that remembers where you stopped.
            </p>

            {popular.length > 0 && (
              <div className="animate-fade-up [animation-delay:320ms] flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#6B7280] font-medium">Popular:</span>
                {popular.map((c) => (
                  <button
                    key={c.class_sort}
                    onClick={() => onSelectClass(c.class_sort)}
                    className="px-3 py-1.5 rounded-full bg-white border border-[#E3E5EC] hover:border-[#3B4FE0]/40 hover:-translate-y-0.5 transition-transform font-semibold text-[#1E2233] cursor-pointer"
                  >
                    {c.class_display}
                  </button>
                ))}
              </div>
            )}

            <div className="animate-fade-up [animation-delay:400ms] flex flex-col sm:flex-row gap-3">
              <button
                onClick={onLaunchDemoAuth}
                className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] shadow-[0_10px_24px_-12px_rgba(59,79,224,0.8)] transition-colors cursor-pointer"
              >
                Start learning free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={onExploreCurriculum}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-[#1E2233] bg-white border border-[#E3E5EC] hover:bg-[#F5F6FA] transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#12A594]" />
                Browse the syllabus
              </button>
            </div>

            <dl className="animate-fade-up [animation-delay:480ms] flex flex-wrap gap-x-8 gap-y-3 pt-2">
              {[
                [classes.length, 'classes'],
                [stats.subjects, 'subjects'],
                [stats.lessons, 'lessons'],
              ].map(([value, label]) => (
                <div key={label as string}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-2xl font-semibold text-[#1E2233]">
                    {value} <span className="text-sm font-medium text-[#6B7280]">{label}</span>
                  </dd>
                </div>
              ))}
              <div>
                <dd className="text-2xl font-semibold text-[#12A594]">
                  0 <span className="text-sm font-medium text-[#6B7280]">ads or recommendations</span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Product preview collage (decorative) */}
          <div aria-hidden="true" className="hidden lg:grid grid-cols-6 grid-rows-[auto_auto_auto] gap-4 animate-fade-up [animation-delay:200ms]">
            <div className="bento col-span-6 p-4 flex gap-4 items-center animate-float">
              <div className="relative w-40 aspect-video rounded-xl overflow-hidden bg-[#1E2233] shrink-0">
                {stats.sample && <img src={thumbnailUrl(stats.sample.youtube_id)} alt="" className="w-full h-full object-cover" />}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center animate-pulse-ring">
                    <Play className="w-4 h-4 text-[#3B4FE0] fill-[#3B4FE0] ml-0.5" />
                  </span>
                </span>
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#12A594]">Jump back in</p>
                <p className="text-sm font-semibold text-[#1E2233] line-clamp-2">
                  {stats.sample?.chapter_name || 'Chemical Reactions and Equations'}
                </p>
                <div className="h-1.5 w-40 bg-[#E3E5EC] rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-[#12A594] rounded-full animate-grow-x" />
                </div>
              </div>
            </div>

            <div className="bento col-span-3 p-4 space-y-3 animate-float [animation-delay:-2s] [animation-duration:7s]">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" /> 5-day streak
              </p>
              <div className="flex justify-between">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i} className="flex flex-col items-center gap-1 text-[10px] text-[#6B7280]">
                    <span
                      className={`w-5 h-5 rounded-full ${i < 5 ? 'bg-orange-400 animate-pop' : 'bg-[#E3E5EC]'}`}
                      style={{ animationDelay: `${700 + i * 90}ms` }}
                    />
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="bento col-span-3 p-4 space-y-2 animate-float [animation-delay:-4s] [animation-duration:8s]">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#3B4FE0]">
                <FileText className="w-4 h-4" /> Cheat sheet
              </p>
              <p className="font-mono text-[11px] text-[#26215C] bg-[#EEEDFE] rounded-lg px-2 py-1.5">V = I × R</p>
              <p className="font-mono text-[11px] text-[#26215C] bg-[#EEEDFE] rounded-lg px-2 py-1.5">P = V²/R</p>
            </div>

            <div className="bento col-span-6 p-4 flex gap-3 items-start animate-float [animation-delay:-1s] [animation-duration:9s]">
              <span className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#12A594] flex items-center justify-center shrink-0">
                <MessageCircleQuestion className="w-4 h-4" />
              </span>
              <div className="space-y-2 min-w-0">
                <p className="text-xs text-[#1E2233] bg-[#F5F6FA] rounded-2xl rounded-tl-sm px-3 py-2">
                  Why does resistance increase with length?
                </p>
                <p className="text-xs text-[#04342C] bg-[#E1F5EE] rounded-2xl rounded-tl-sm px-3 py-2 animate-fade-up [animation-delay:1200ms]">
                  Longer wire → electrons collide more often, so R ∝ L. Rewatch 12:40 for the diagram.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SRS §3 section 2: Jump Back In */}
      <div data-reveal>
        <JumpBackInCard
          lastWatchedVideo={lastWatchedVideo}
          isCompleted={lastWatchedVideo ? isCompleted(lastWatchedVideo.youtube_id) : false}
          onSelectVideo={onSelectVideo}
          onBrowse={scrollToGrid}
        />
      </div>

      {/* SRS §3 section 3: Visual Grid */}
      <section id="visual-grid" aria-labelledby="visual-grid-title" className="scroll-mt-24">
        {classes.length === 0 ? <ClassGridSkeleton /> : <ClassGrid classes={classes} onSelectClass={onSelectClass} />}
      </section>

      {/* Features bento */}
      <section id="features" aria-labelledby="features-title" className="space-y-6 scroll-mt-24">
        <div data-reveal className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#3B4FE0]">Everything for revision</p>
          <h2 id="features-title" className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#1E2233] text-balance">
            One calm place to watch, revise and ask.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div data-reveal className="lg:col-span-4 lg:row-span-2 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#3B4FE0] to-[#2F40BD] text-white relative overflow-hidden flex flex-col justify-between gap-8 md:col-span-2">
            <div className="absolute -right-20 -bottom-24 w-72 h-72 rounded-full bg-[#12A594]/40 blur-3xl pointer-events-none animate-float [animation-duration:10s]" />
            <div className="relative space-y-3 max-w-md">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C7EFE4]">
                <Play className="w-3.5 h-3.5 fill-[#C7EFE4]" /> Distraction-free player
              </span>
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">Just the lesson. Nothing else.</h3>
              <p className="text-sm text-white/80">
                Privacy-enhanced playback with no recommendations, comments or autoplay rabbit holes. Finish a video and it’s
                ticked off automatically.
              </p>
            </div>
            <div className="relative grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-2">
                <p className="text-xs font-semibold text-white/70">Regular video sites</p>
                {['Recommended videos', 'Comment threads', 'Autoplay'].map((t) => (
                  <p key={t} className="flex items-center gap-2 text-white/80">
                    <XCircle className="w-4 h-4 text-rose-300" /> {t}
                  </p>
                ))}
              </div>
              <div className="rounded-2xl bg-white p-4 space-y-2 text-[#1E2233]">
                <p className="text-xs font-semibold text-[#12A594]">NCERT Prep</p>
                {['Chapter-by-chapter order', 'Notes beside every lesson', 'Progress saved'].map((t) => (
                  <p key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#12A594]" /> {t}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {[
            {
              icon: <FileText className="w-5 h-5" />,
              title: 'Notes & cheat sheets',
              body: 'Summaries, key formulas, exam tips and downloadable PDFs for each chapter.',
              tint: getSubjectTileStyle('Science'),
            },
            {
              icon: <MessageCircleQuestion className="w-5 h-5" />,
              title: 'Ask doubts privately',
              body: 'Stuck on a step? Ask under the lesson and get a reply from your educator.',
              tint: getSubjectTileStyle('Mathematics'),
            },
            {
              icon: <Flame className="w-5 h-5" />,
              title: 'Streaks & focus timer',
              body: 'Build a daily habit with a 25-minute focus timer and an honest streak.',
              tint: getSubjectTileStyle('English'),
            },
            {
              icon: <BarChart3 className="w-5 h-5" />,
              title: 'Progress you can see',
              body: 'Every subject shows how much is done and what to watch next.',
              tint: getSubjectTileStyle('Hindi'),
            },
            {
              icon: <Bell className="w-5 h-5" />,
              title: 'Gentle reminders',
              body: 'Optional daily or weekly emails at IST times, one-click unsubscribe.',
              tint: getSubjectTileStyle('Physics'),
            },
          ].map((f, i) => (
            <div key={f.title} data-reveal style={stagger(i + 1)} className="bento bento-hover p-6 space-y-3 lg:col-span-2 group">
              <span
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                style={{ backgroundColor: f.tint.bg, color: f.tint.text }}
              >
                {f.icon}
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-[#1E2233]">{f.title}</h3>
              <p className="text-sm text-[#6B7280]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" data-reveal aria-labelledby="how-title" className="bento p-6 sm:p-10 scroll-mt-24">
        <h2 id="how-title" className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1E2233] mb-8">
          How it works
        </h2>
        <ol className="grid md:grid-cols-3 gap-8">
          {[
            ['Pick your class', 'Tell us the class you study in. Your dashboard, syllabus and search follow it.', <BookOpen key="i" className="w-5 h-5" />],
            ['Watch & tick off', 'Go chapter by chapter. Finished lessons are marked automatically.', <Play key="i" className="w-5 h-5" />],
            ['Revise & ask', 'Open the cheat sheet before exams, use the focus timer, and ask doubts when stuck.', <Timer key="i" className="w-5 h-5" />],
          ].map(([title, body, icon], i) => (
            <li key={title as string} data-reveal style={stagger(i + 1, 150)} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-[#3B4FE0] text-white text-sm font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-[#3B4FE0]">{icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-[#1E2233]">{title}</h3>
              <p className="text-sm text-[#6B7280]">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Closing CTA */}
      <section data-reveal className="relative overflow-hidden rounded-[2rem] p-8 sm:p-14 text-center bg-gradient-to-br from-[#3B4FE0] via-[#4B5CF0] to-[#12A594] text-white">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none animate-float [animation-duration:9s]" />
        <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-[#12A594]/40 blur-2xl pointer-events-none animate-float [animation-delay:-3s] [animation-duration:11s]" />
        <div className="relative space-y-6 max-w-2xl mx-auto">
          <Sparkles className="w-8 h-8 mx-auto text-white/80 animate-pulse" />
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            Your next chapter is one tap away.
          </h2>
          <p className="text-white/85">Free to use. Pick your class and start where it matters most.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={onLaunchDemoAuth}
              className="px-6 py-3.5 rounded-2xl text-sm font-semibold text-[#1E2233] bg-white hover:bg-[#F5F6FA] cursor-pointer"
            >
              Start learning free
            </button>
            <button
              onClick={scrollToGrid}
              className="px-6 py-3.5 rounded-2xl text-sm font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/30 cursor-pointer"
            >
              Browse by class
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
