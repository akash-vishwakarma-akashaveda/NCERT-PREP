export interface VideoData {
  youtube_id: string;
  class_sort: string;
  subject: string;
  chapter_id: string;
  chapter_name: string;
  video_title: string;
}

// Accepts the sheet format ("Class 9", "Class IX") or the app format ("09") and returns "09".
export function classSortOf(raw: unknown): string {
  if (raw === undefined || raw === null) return '';
  const text = String(raw).trim().toUpperCase();
  const digits = text.match(/\d+/);
  if (digits) return String(parseInt(digits[0], 10)).padStart(2, '0');
  const roman = text.replace(/^CLASS\s*/, '');
  if (!/^[IVX]+$/.test(roman)) return '';
  const values: Record<string, number> = { I: 1, V: 5, X: 10 };
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const cur = values[roman[i]];
    const next = values[roman[i + 1]] || 0;
    total += cur < next ? -cur : cur;
  }
  return total > 0 ? String(total).padStart(2, '0') : '';
}

function syllabusOrder(a: VideoData, b: VideoData): number {
  return (
    a.class_sort.localeCompare(b.class_sort) ||
    a.subject.localeCompare(b.subject) ||
    a.chapter_id.localeCompare(b.chapter_id, undefined, { numeric: true, sensitivity: 'base' })
  );
}

/**
 * FR-7: next lesson after last_watched_video in syllabus order (same class & subject, then same class),
 * restricted to the student's enrolled class when known. Falls back to the first lesson of that class.
 */
export function pickNextVideo(
  videos: VideoData[],
  lastWatchedId: string | null,
  enrolledClass: string
): VideoData | null {
  const ordered = [...videos].sort(syllabusOrder);
  const inClass = enrolledClass ? ordered.filter((v) => v.class_sort === enrolledClass) : ordered;
  const pool = inClass.length > 0 ? inClass : ordered;

  const last = lastWatchedId ? pool.find((v) => v.youtube_id === lastWatchedId) : undefined;
  if (last) {
    const sameSubject = pool.filter((v) => v.class_sort === last.class_sort && v.subject === last.subject);
    const idx = sameSubject.findIndex((v) => v.youtube_id === last.youtube_id);
    if (idx >= 0 && idx < sameSubject.length - 1) return sameSubject[idx + 1];

    const sameClass = pool.filter((v) => v.class_sort === last.class_sort);
    const classIdx = sameClass.findIndex((v) => v.youtube_id === last.youtube_id);
    if (classIdx >= 0 && classIdx < sameClass.length - 1) return sameClass[classIdx + 1];
  }

  return pool[0] || null;
}
