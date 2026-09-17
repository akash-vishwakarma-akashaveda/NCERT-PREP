import { NotesTarget } from '../types';

export function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'x';
}

export function subjectKey(classSort: string, subject: string): string {
  return `${classSort}_${slug(subject)}`;
}

export function chapterKey(classSort: string, subject: string, chapterId: string): string {
  return `${subjectKey(classSort, subject)}_${slug(chapterId)}`;
}

export function notesKey(target: NotesTarget): string {
  return chapterKey(target.class_sort, target.subject, target.chapter_id);
}
