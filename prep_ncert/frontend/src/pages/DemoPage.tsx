import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, ArrowRight, Sparkles } from 'lucide-react';
import { Video } from '../types';
import { VideoService } from '../services/videos';
import { SubjectGlyph, btnPrimary, btnSecondary, card } from '../student/ui';
import { STAGES } from '../components/home/StageShowcase';
import { getGradeStage } from '../data/stageThemes';

const WRAP = 'max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10';

// STAGES lists one representative class per stage, so map the class to its stage first.
const stageLabel = (classSort: string) => STAGES.find((s) => s.id === getGradeStage(classSort))?.label;

const DemoCard: React.FC<{ video: Video; onPlay: () => void }> = ({ video, onPlay }) => (
  <button
    onClick={onPlay}
    className={`${card} btn-3d [--edge:var(--card-line)] p-4 text-left flex flex-col gap-3 cursor-pointer hover:border-[color:var(--brand)]`}
  >
    <div className="flex items-center gap-3">
      <SubjectGlyph subject={video.subject} className="w-11 h-11 rounded-[14px] shrink-0" />
      <div className="min-w-0">
        <p className="text-[10.5px] font-extrabold tracking-[0.06em] text-[#6B7280] truncate">
          {video.class_display} · {video.subject}
        </p>
        <p className="text-[14px] font-extrabold text-[#1E2233] leading-snug line-clamp-2">{video.video_title}</p>
      </div>
    </div>
    <p className="text-[11.5px] font-semibold text-[#6B7280] truncate">{video.chapter_name}</p>
    <span className="mt-auto inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[color:var(--brand)]">
      <Play className="w-3.5 h-3.5" /> Watch now — no account needed
    </span>
  </button>
);

/**
 * The public demo: a handful of lessons anyone can watch without signing in. The list comes from
 * /api/videos/featured, which only ever returns lessons a visitor is allowed to play, so nothing
 * here can dead-end at a sign-up wall.
 */
export const DemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    VideoService.fetchFeatured()
      .then(setVideos)
      .catch(() => setFailed(true));
  }, []);

  const stages = Array.from(new Set((videos ?? []).map((v) => stageLabel(v.class_sort)).filter(Boolean)));

  return (
    <div className={`${WRAP} py-12 sm:py-16 space-y-8`}>
      <div className="max-w-2xl mx-auto text-center space-y-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.12em] text-[#3B4FE0]">
          <Sparkles className="w-3.5 h-3.5" /> FREE DEMO
        </p>
        <h1 className="text-[28px] sm:text-[38px] leading-tight text-[#1E2233] text-balance">Try a lesson, no sign-up</h1>
        <p className="text-[14px] font-semibold leading-relaxed text-[#6B7280]">
          {stages.length > 1
            ? `A lesson from each stage — ${stages.join(', ')} — exactly as students see it.`
            : 'Real lessons from the NCERT syllabus, exactly as students see them.'}
        </p>
      </div>

      {failed || videos?.length === 0 ? (
        <div className={`${card} max-w-xl mx-auto px-6 py-10 text-center space-y-4`}>
          <p className="text-sm font-semibold text-[#6B7280]">
            {failed ? "The demo lessons couldn't be loaded just now." : 'No demo lessons are available at the moment.'}
          </p>
          <Link to="/browse" className={`${btnSecondary} px-5 py-2.5 text-sm inline-flex`}>
            Browse the syllabus instead
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos
            ? videos.map((video) => (
                <DemoCard
                  key={video.youtube_id}
                  video={video}
                  onPlay={() => navigate(`/watch/${encodeURIComponent(video.youtube_id)}`)}
                />
              ))
            : Array.from({ length: 6 }, (_, i) => <div key={i} className={`${card} h-[148px] animate-pulse`} />)}
        </div>
      )}

      <div className="text-center pt-2">
        <Link to="/browse" className={`${btnPrimary} px-6 py-3.5 text-[14.5px] rounded-[18px] inline-flex items-center gap-2`}>
          See every class and subject <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
