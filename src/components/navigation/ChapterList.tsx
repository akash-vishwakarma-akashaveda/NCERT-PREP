import React from 'react';
import {
  Play,
  CheckCircle2,
  Bookmark,
  Clock,
  AlertCircle,
  FileText,
  Target,
} from 'lucide-react';
import { Video, ChapterGroup, NotesTarget } from '../../types';
import { useProgress } from '../../context/ProgressContext';

interface ChapterListProps {
  chapters: ChapterGroup[];
  onSelectVideo: (video: Video) => void;
  onOpenNotes?: (target: NotesTarget) => void;
  // Chapter keys that have published notes; the notes button only shows for these.
  notesKeys?: Set<string>;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  onSelectVideo,
  onOpenNotes,
  notesKeys,
}) => {
  const { isCompleted, isFavorited, toggleCompleted, toggleFavorite } = useProgress();

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '35 mins';
    const mins = Math.floor(seconds / 60);
    return `${mins} mins`;
  };

  return (
    <div className="space-y-6 pb-20">
      {chapters.map((chapter) => (
        <div
          key={chapter.key}
          className="bg-white border border-[#E3E5EC] rounded-3xl p-5 sm:p-7 shadow-xs space-y-5 transition-all duration-300 hover:shadow-md"
        >
          {/* Chapter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E5EC] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-extrabold text-[#3B4FE0] bg-[#EEEDFE] px-3 py-1 rounded-xl">
                {chapter.chapter_id}
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1E2233] tracking-tight">
                  {chapter.chapter_name}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {onOpenNotes && notesKeys?.has(chapter.key) && (
                <button
                  onClick={() => onOpenNotes(chapter)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#3B4FE0] bg-[#EEEDFE] hover:bg-[#DDD6FE] rounded-full transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Notes & cheat sheet
                </button>
              )}
              <span className="text-xs font-semibold text-[#6B7280] bg-[#F5F6FA] px-3 py-1 rounded-full">
                {chapter.videos.length} {chapter.videos.length === 1 ? 'lesson' : 'lessons'}
              </span>
            </div>
          </div>

          {chapter.videos.length === 0 && (
            <p className="text-xs text-[#6B7280] bg-[#F5F6FA] border border-dashed border-[#E3E5EC] rounded-2xl p-4">
              Video lessons for this chapter are coming soon.
              {notesKeys?.has(chapter.key) && ' Notes are already available above.'}
            </p>
          )}

          {/* Video Lesson Cards under Chapter */}
          <div className="space-y-3.5">
            {chapter.videos.map((video) => {
              const completed = isCompleted(video.youtube_id);
              const favorited = isFavorited(video.youtube_id);
              const deactivated = !video.isActive;

              return (
                <div
                  key={video.youtube_id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                    deactivated
                      ? 'bg-amber-50/50 border-amber-200 opacity-80'
                      : completed
                      ? 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300'
                      : 'bg-[#F8F9FD] border-[#E3E5EC] hover:bg-white hover:border-[#3B4FE0]/50 hover:shadow-xs'
                  }`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm sm:text-base font-bold text-[#1E2233] group-hover:text-[#3B4FE0] transition-colors line-clamp-1">
                        {video.video_title}
                      </p>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2.5 text-xs text-[#6B7280] flex-wrap">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span>{formatDuration(video.duration_seconds)}</span>
                      </span>

                      <span className="text-slate-300">•</span>

                      <span className="text-[11px] font-bold text-[#12A594] bg-[#E1F5EE] px-2 py-0.5 rounded-md">
                        One-Shot Revision
                      </span>

                      {video.pyq_available && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                          <Target className="w-3 h-3 text-indigo-600" />
                          <span>PYQ Included</span>
                        </span>
                      )}

                      {completed && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Completed</span>
                        </span>
                      )}

                      {deactivated && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                          <span>No longer available (Archived)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Right Side */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Mark Completed Button */}
                    <button
                      onClick={() => toggleCompleted(video.youtube_id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        completed
                          ? 'bg-[#12A594] text-white border-[#12A594] shadow-xs'
                          : 'bg-white text-[#6B7280] border-[#E3E5EC] hover:text-[#12A594] hover:border-[#12A594]/40'
                      }`}
                      title={completed ? 'Mark as incomplete' : 'Mark lesson as completed'}
                      aria-label="Toggle completed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    {/* Bookmark Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(video.youtube_id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        favorited
                          ? 'bg-amber-100 text-amber-700 border-amber-300'
                          : 'bg-white text-[#6B7280] border-[#E3E5EC] hover:text-amber-500 hover:border-amber-300'
                      }`}
                      title={favorited ? 'Remove from saved favorites' : 'Save to favorites'}
                      aria-label="Toggle favorite"
                    >
                      <Bookmark className={`w-4 h-4 ${favorited ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>

                    {/* Start Video Button */}
                    {deactivated ? (
                      <span className="px-4 py-2 text-xs font-semibold text-[#6B7280] bg-slate-200/80 rounded-xl cursor-not-allowed">
                        Archived
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectVideo(video)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#3B4FE0] hover:bg-[#2F40BD] rounded-xl shadow-[0_2px_10px_rgba(59,79,224,0.3)] transition-all cursor-pointer hover:scale-[1.02]"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Watch</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
