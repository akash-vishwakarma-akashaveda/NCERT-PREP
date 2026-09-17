import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { loadYouTubeIframeApi, YTPlayer, YT_STATE_ENDED, YT_UNAVAILABLE_ERROR_CODES } from '../services/youtubeApi';

interface LessonPlayerProps {
  youtubeId: string;
  title: string;
  onEnded: () => void;
}

// FR-2/FR-3: youtube-nocookie player via the IFrame Player API so "ended" and unavailable errors are real events.
export const LessonPlayer: React.FC<LessonPlayerProps> = ({ youtubeId, title, onEnded }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setReady(false);
    setFailed(false);
    if (!navigator.onLine) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    let player: YTPlayer | null = null;
    const timers: number[] = [];
    const fail = () => !cancelled && setFailed(true);
    timers.push(window.setTimeout(fail, 12000));

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled) return;
        const mount = document.createElement('div');
        host.appendChild(mount);
        player = new YT.Player(mount, {
          host: 'https://www.youtube-nocookie.com',
          videoId: youtubeId,
          width: '100%',
          height: '100%',
          playerVars: { controls: 1, rel: 0, modestbranding: 1, playsinline: 1, origin: window.location.origin },
          events: {
            onReady: (e) => {
              timers.forEach(clearTimeout);
              if (cancelled) return;
              setReady(true);
              // Removed/private videos can load an empty shell without an error event.
              timers.push(
                window.setTimeout(() => {
                  const data = e.target.getVideoData?.();
                  if (data && !data.title && !data.video_id) fail();
                }, 5000)
              );
            },
            onStateChange: (e) => e.data === YT_STATE_ENDED && onEndedRef.current(),
            onError: (e) => YT_UNAVAILABLE_ERROR_CODES.includes(e.data) && fail(),
          },
        });
      })
      .catch(fail);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      player?.destroy();
      host.innerHTML = '';
    };
  }, [youtubeId, attempt]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#0F1320]">
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
          <p className="text-base font-semibold">This video can&apos;t be played right now</p>
          <p className="text-sm text-white/70 max-w-sm">
            It may have been removed or you may be offline. Try again, or continue with another lesson.
          </p>
          <button
            onClick={() => setAttempt((n) => n + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : (
        !ready && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">Loading video…</div>
      )}
      <div
        ref={hostRef}
        title={title}
        className={`absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 ${failed ? 'hidden' : ''}`}
      />
    </div>
  );
};
