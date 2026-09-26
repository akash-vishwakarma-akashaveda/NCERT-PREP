import type { SheetRow } from './syncVideoRows.js';

// Same header names/mapping as prep_ncert/backend/scripts/google-apps-script-sync.js — the Excel
// export and the Google Sheet share the same column layout, so one mapping serves both.
const COLUMN_MAP: Record<string, keyof SheetRow> = {
  class: 'class_display',
  'class numeral': 'class_sort',
  subject: 'subject',
  book: 'textbook',
  chapter: 'chapter_id',
  'chapter title': 'chapter_name',
  'yt vid title': 'video_title',
  'yt vid id': 'youtube_id',
};

const OPTIONAL_COLUMN_MAP: Record<string, string> = {
  'yt vid published': 'published_raw',
  url: 'pdf_url',
  timestamps: 'timestamps',
  'english chapter name': 'english_chapter_name',
};

function normaliseHeader(header: unknown): string {
  return String(header ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Converts a sheet of raw cell rows (first row = headers, matched case-insensitively, column
 * order irrelevant, unknown columns ignored) into SheetRow objects ready for syncVideoRows.
 * Rows without a recognisable YouTube ID column value are skipped.
 */
export function rowsFromSheetCells(cellRows: unknown[][]): { rows: SheetRow[]; missingColumns: string[] } {
  const [headerRow, ...dataRows] = cellRows;
  if (!headerRow) return { rows: [], missingColumns: Object.keys(COLUMN_MAP) };

  const headerIndex = new Map<string, number>();
  headerRow.forEach((header, idx) => {
    const key = normaliseHeader(header);
    const field = COLUMN_MAP[key] ?? OPTIONAL_COLUMN_MAP[key];
    if (field && !headerIndex.has(field)) headerIndex.set(field, idx);
  });

  const missingColumns = Object.entries(COLUMN_MAP)
    .filter(([, field]) => !headerIndex.has(field))
    .map(([name]) => name);
  if (missingColumns.length > 0) return { rows: [], missingColumns };

  const byId = new Map<string, Record<string, string>>();
  const order: string[] = [];

  for (const dataRow of dataRows) {
    const record: Record<string, string> = {};
    headerIndex.forEach((idx, field) => {
      record[field] = String(dataRow[idx] ?? '').trim();
    });
    const youtubeId = record.youtube_id;
    if (!youtubeId) continue;
    if (!byId.has(youtubeId)) order.push(youtubeId);
    byId.set(youtubeId, record); // last duplicate row wins
  }

  const rows: SheetRow[] = order.map((id) => {
    const record = byId.get(id)!;
    const row: SheetRow = {
      youtube_id: record.youtube_id,
      class_sort: record.class_sort ?? '',
      class_display: record.class_display ?? '',
      subject: record.subject ?? '',
      textbook: record.textbook,
      chapter_id: record.chapter_id ?? '',
      chapter_name: record.chapter_name || record.english_chapter_name || '',
      video_title: record.video_title ?? '',
      pdf_url: record.pdf_url,
      timestamps: record.timestamps,
    };
    if (record.published_raw !== undefined) row.yt_public = /^PUBLISH_OK/i.test(record.published_raw);
    return row;
  });

  return { rows, missingColumns: [] };
}
