import React, { useEffect, useRef } from 'react';
import { Search, X, Video as VideoIcon, Book, Sparkles } from 'lucide-react';
import { useSearch } from '../../hooks/useSearch';
import { Video } from '../../types';
import { getClassTileStyle } from '../../data/colorTokens';

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: Video[];
  onSelectVideo: (video: Video) => void;
}

export const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  isOpen,
  onClose,
  videos,
  onSelectVideo,
}) => {
  const { query, setQuery, results, isSearching } = useSearch(videos, { maxResults: 10 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen, setQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        // Triggered outside if needed
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#1E2233]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E3E5EC] overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-[#E3E5EC]">
          <Search className="w-5 h-5 text-[#3B4FE0] shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by topic, chapter (e.g. Life Processes), or subject..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-4 text-base text-[#1E2233] bg-transparent outline-none placeholder:text-[#6B7280]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#6B7280] hover:text-[#1E2233] rounded-md mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-medium text-[#6B7280] hover:bg-[#F5F6FA] rounded-md cursor-pointer border border-[#E3E5EC]"
          >
            ESC
          </button>
        </div>

        {/* Results List or Empty States */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!isSearching && (
            <div className="p-8 text-center text-[#6B7280]">
              <Sparkles className="w-8 h-8 text-[#3B4FE0]/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1E2233]">Global Curriculum Search</p>
              <p className="text-xs mt-1">
                Type 2 or more letters to search across video titles, NCERT chapters, and subjects.
              </p>
            </div>
          )}

          {isSearching && results.length === 0 && (
            <div className="p-8 text-center text-[#6B7280]">
              <Book className="w-8 h-8 text-[#6B7280]/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1E2233]">No matching revision topics found</p>
              <p className="text-xs mt-1">
                Try searching for keywords like &quot;Chemical&quot;, &quot;Electricity&quot;, or &quot;Trigonometry&quot;.
              </p>
            </div>
          )}

          {isSearching && results.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                {results.length} ranked matches
              </div>
              {results.map(({ item: video }) => {
                const style = getClassTileStyle(video.class_sort);
                return (
                  <button
                    key={video.youtube_id}
                    onClick={() => {
                      onSelectVideo(video);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-[#F5F6FA] border border-transparent hover:border-[#E3E5EC] transition-all flex items-start gap-3 cursor-pointer group"
                  >
                    <div
                      className="shrink-0 px-2 py-1 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {video.class_display}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E2233] group-hover:text-[#3B4FE0] line-clamp-1">
                        {video.video_title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#6B7280]">
                        <span className="font-medium text-[#12A594]">{video.subject}</span>
                        <span>•</span>
                        <span className="truncate">{video.chapter_name}</span>
                      </div>
                    </div>

                    <VideoIcon className="w-4 h-4 text-[#6B7280] group-hover:text-[#3B4FE0] shrink-0 self-center" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
