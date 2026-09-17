import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserProgress } from '../types';
import { useAuth } from './AuthContext';
import { FirestoreService } from '../services/firestore';
import { StorageService } from '../services/storage';

interface ProgressContextType {
  progressMap: Record<string, UserProgress>;
  lastWatchedId: string | null;
  loading: boolean;
  isCompleted: (youtubeId: string) => boolean;
  isFavorited: (youtubeId: string) => boolean;
  toggleCompleted: (youtubeId: string) => Promise<void>;
  toggleFavorite: (youtubeId: string) => Promise<void>;
  recordVideoWatched: (youtubeId: string) => Promise<void>;
  completedCount: number;
  favoritesCount: number;
  favoriteIds: string[];
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, recordStudyActivity } = useAuth();
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});
  const [lastWatchedId, setLastWatchedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load progress when user changes or on boot
  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      setLoading(true);
      const cachedLastWatched = StorageService.getLastWatchedVideo();
      if (cachedLastWatched && isMounted) {
        setLastWatchedId(cachedLastWatched);
      }

      if (user) {
        try {
          const map = await FirestoreService.getUserProgress(user.userId);
          if (isMounted) {
            setProgressMap(map);
            if (user.last_watched_video) {
              setLastWatchedId(user.last_watched_video);
            }
          }
        } catch (err) {
          console.error('Failed to load user progress:', err);
        }
      } else {
        // Visitor mode: check local visitor storage
        const visitorProgress = StorageService.getUserProgress('visitor');
        if (isMounted) {
          setProgressMap(visitorProgress);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const isCompleted = useCallback(
    (youtubeId: string): boolean => {
      return Boolean(progressMap[youtubeId]?.completed);
    },
    [progressMap]
  );

  const isFavorited = useCallback(
    (youtubeId: string): boolean => {
      return Boolean(progressMap[youtubeId]?.favorited);
    },
    [progressMap]
  );

  // Optimistic toggle for completed state
  const toggleCompleted = useCallback(
    async (youtubeId: string) => {
      const current = isCompleted(youtubeId);
      const nextState = !current;
      const targetUserId = user ? user.userId : 'visitor';

      // Optimistic update
      setProgressMap((prev) => ({
        ...prev,
        [youtubeId]: {
          youtube_id: youtubeId,
          completed: nextState,
          favorited: Boolean(prev[youtubeId]?.favorited),
          last_viewed: Date.now(),
        },
      }));

      try {
        await FirestoreService.saveVideoProgress(targetUserId, youtubeId, {
          completed: nextState,
        });
      } catch (err) {
        console.error('Failed to save completed state:', err);
      }
    },
    [user, isCompleted]
  );

  // Optimistic toggle for favorite state (FR-6)
  const toggleFavorite = useCallback(
    async (youtubeId: string) => {
      const current = isFavorited(youtubeId);
      const nextState = !current;
      const targetUserId = user ? user.userId : 'visitor';

      // Optimistic update
      setProgressMap((prev) => ({
        ...prev,
        [youtubeId]: {
          youtube_id: youtubeId,
          completed: Boolean(prev[youtubeId]?.completed),
          favorited: nextState,
          last_viewed: Date.now(),
        },
      }));

      try {
        await FirestoreService.saveVideoProgress(targetUserId, youtubeId, {
          favorited: nextState,
        });
      } catch (err) {
        console.error('Failed to toggle favorite:', err);
      }
    },
    [user, isFavorited]
  );

  // Record that a video was viewed & update last_watched_video (FR-6)
  const recordVideoWatched = useCallback(
    async (youtubeId: string) => {
      setLastWatchedId(youtubeId);
      const targetUserId = user ? user.userId : 'visitor';

      // Record in progress map
      setProgressMap((prev) => ({
        ...prev,
        [youtubeId]: {
          youtube_id: youtubeId,
          completed: Boolean(prev[youtubeId]?.completed),
          favorited: Boolean(prev[youtubeId]?.favorited),
          last_viewed: Date.now(),
        },
      }));

      try {
        await FirestoreService.saveVideoProgress(targetUserId, youtubeId, {});
        await FirestoreService.updateLastWatched(targetUserId, youtubeId);
        if (user) await recordStudyActivity();
      } catch (err) {
        console.error('Failed to record video watch:', err);
      }
    },
    [user, recordStudyActivity]
  );

  // Aggregates (counting completed and favorites, including deactivated ones per SRS 4.3)
  const completedCount = useMemo(() => {
    return Object.values(progressMap).filter((item) => item.completed).length;
  }, [progressMap]);

  const favoritesCount = useMemo(() => {
    return Object.values(progressMap).filter((item) => item.favorited).length;
  }, [progressMap]);

  const favoriteIds = useMemo(() => {
    return Object.values(progressMap)
      .filter((item) => item.favorited)
      .map((item) => item.youtube_id);
  }, [progressMap]);

  return (
    <ProgressContext.Provider
      value={{
        progressMap,
        lastWatchedId,
        loading,
        isCompleted,
        isFavorited,
        toggleCompleted,
        toggleFavorite,
        recordVideoWatched,
        completedCount,
        favoritesCount,
        favoriteIds,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
