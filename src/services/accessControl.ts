import { Video, User } from '../types';

/**
 * Access Control for NCERT Prep:
 * - Registered Users (signed in via Google, Email, OTP, or Demo): Full, unlimited access to all lessons,
 *   notes, formula cheat sheets, private doubts, and progress tracking.
 * - Visitors (unauthenticated): Limited preview access.
 *   Only Chapter 1 (the first lesson of each subject) is available as a Free Preview.
 *   All subsequent chapters (Chapters 2..N) require creating/logging into a free student account.
 */

/**
 * Determines if a video is eligible as a free preview sample for visitors.
 * By default, the first chapter of any subject (index 0 or CH-01 / *-01) is free preview.
 */
export function isFreePreviewLesson(
  video: Video,
  chapterIndex?: number,
  videoIndexInChapter?: number
): boolean {
  if (typeof chapterIndex === 'number') {
    return chapterIndex === 0 && (typeof videoIndexInChapter === 'number' ? videoIndexInChapter === 0 : true);
  }

  // Fallback if chapterIndex is not supplied: inspect chapter_id
  const cid = video.chapter_id.trim();
  const isFirstChapterId =
    cid === 'CH-01' ||
    cid.endsWith('-01') ||
    cid.endsWith('-1') ||
    cid === '1';

  return isFirstChapterId;
}

/**
 * Checks if a specific lesson is unlocked for the current user.
 */
export function isLessonUnlocked(
  video: Video,
  user: User | null,
  chapterIndex?: number,
  videoIndexInChapter?: number
): boolean {
  // Signed-in users always have full access to all curriculum content
  if (user) return true;

  // Visitors only get the free preview lesson
  return isFreePreviewLesson(video, chapterIndex, videoIndexInChapter);
}

/**
 * Returns access status with explanatory labels for the UI.
 */
export function getLessonAccessInfo(
  video: Video,
  user: User | null,
  chapterIndex?: number,
  videoIndexInChapter?: number
) {
  const isMember = Boolean(user);
  const isPreview = isFreePreviewLesson(video, chapterIndex, videoIndexInChapter);
  const isUnlocked = isMember || isPreview;

  return {
    isUnlocked,
    isPreview,
    isMember,
    badgeText: isMember
      ? null
      : isPreview
      ? 'Free Preview'
      : 'Free Account Required',
  };
}
