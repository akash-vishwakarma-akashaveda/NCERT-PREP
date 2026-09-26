import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { toPublicVideo, toPrismaVideoData } from '../shared/publicVideo.js';

const router = Router();

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const todayUtc = () => new Date().toISOString().slice(0, 10);

// Public: the full catalogue, including hidden/inactive videos — the frontend filters those out
// for the student-facing views itself (useCatalog.ts) and needs them for the admin table.
router.get('/', async (_req, res) => {
  const videos = await prisma.video.findMany({ orderBy: [{ classSort: 'asc' }, { subject: 'asc' }, { chapterId: 'asc' }] });
  res.json(videos.map(toPublicVideo));
});

const videoFieldsSchema = z.object({
  class_sort: z.string().min(1),
  class_display: z.string().optional(),
  subject: z.string().min(1),
  textbook: z.string().optional(),
  chapter_id: z.string().min(1),
  chapter_name: z.string().min(1),
  video_title: z.string().min(1),
  isActive: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  pyq_available: z.boolean().optional(),
  yt_public: z.boolean().optional(),
  pdf_url: z.string().optional(),
  timestamps: z.string().optional(),
});

const createSchema = videoFieldsSchema.extend({ youtube_id: z.string().regex(YOUTUBE_ID) });

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { youtube_id, class_sort, class_display, ...fields } = parsed.data;

  const existing = await prisma.video.findUnique({ where: { youtubeId: youtube_id } });
  if (existing) return res.status(409).json({ error: 'A video with this YouTube ID already exists.' });

  const video = await prisma.video.create({
    data: {
      youtubeId: youtube_id,
      classSort: class_sort,
      classDisplay: class_display || `Class ${parseInt(class_sort, 10)}`,
      subject: fields.subject,
      textbook: fields.textbook ?? '',
      chapterId: fields.chapter_id,
      chapterName: fields.chapter_name,
      videoTitle: fields.video_title,
      isActive: fields.isActive ?? true,
      isPremium: fields.isPremium ?? false,
      pyqAvailable: fields.pyq_available ?? false,
      ytPublic: fields.yt_public ?? true,
      pdfUrl: fields.pdf_url ?? '',
      timestamps: fields.timestamps ?? '',
    },
  });
  res.status(201).json(toPublicVideo(video));
});

const updateSchema = videoFieldsSchema.partial();

router.patch('/:youtubeId', requireAuth, requireAdmin, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const video = await prisma.video
    .update({ where: { youtubeId: req.params.youtubeId }, data: toPrismaVideoData(parsed.data) })
    .catch(() => null);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json(toPublicVideo(video));
});

router.delete('/:youtubeId', requireAuth, requireAdmin, async (req, res) => {
  await prisma.video.delete({ where: { youtubeId: req.params.youtubeId } }).catch(() => null);
  res.json({ ok: true });
});

const heartbeatSchema = z.object({ seconds: z.number().int().min(1).max(45) });
// No auth: visitors watch too, and this feeds a revenue-hours estimate that should count them.
// Rate limit + per-ping cap bound how much a spammer could inflate it.
const heartbeatLimiter = rateLimit({ windowMs: 5 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false });

router.post('/:youtubeId/watch-heartbeat', heartbeatLimiter, async (req, res) => {
  const parsed = heartbeatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const video = await prisma.video.findUnique({ where: { youtubeId: req.params.youtubeId }, select: { youtubeId: true } });
  if (!video) return res.status(404).json({ error: 'Unknown video' });

  const day = todayUtc();
  await prisma.videoWatchStat.upsert({
    where: { youtubeId_day: { youtubeId: video.youtubeId, day } },
    create: { youtubeId: video.youtubeId, day, secondsWatched: parsed.data.seconds },
    update: { secondsWatched: { increment: parsed.data.seconds } },
  });
  res.status(204).end();
});

const watchStatsMonthSchema = z.string().regex(/^\d{4}-\d{2}$/);

// Per-video watched-hours for one calendar month, for an approximate revenue estimate.
router.get('/admin/watch-stats', requireAuth, requireAdmin, async (req, res) => {
  const monthParam = typeof req.query.month === 'string' ? req.query.month : undefined;
  const parsedMonth = monthParam ? watchStatsMonthSchema.safeParse(monthParam) : null;
  const now = new Date();
  const label = parsedMonth?.success ? parsedMonth.data : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  const grouped = await prisma.videoWatchStat.groupBy({
    by: ['youtubeId'],
    where: { day: { startsWith: label } },
    _sum: { secondsWatched: true },
  });
  if (grouped.length === 0) return res.json({ month: label, totalSeconds: 0, rows: [] });

  const videos = await prisma.video.findMany({
    where: { youtubeId: { in: grouped.map((g) => g.youtubeId) } },
    select: { youtubeId: true, videoTitle: true, subject: true, chapterName: true, classSort: true },
  });
  const videoById = new Map(videos.map((v) => [v.youtubeId, v]));

  const rows = grouped
    .map((g) => {
      const v = videoById.get(g.youtubeId);
      const seconds = g._sum.secondsWatched ?? 0;
      return {
        youtubeId: g.youtubeId,
        title: v?.videoTitle ?? '(deleted video)',
        subject: v?.subject ?? '',
        chapterName: v?.chapterName ?? '',
        classSort: v?.classSort ?? '',
        seconds,
        hours: Math.round((seconds / 3600) * 100) / 100,
      };
    })
    .sort((a, b) => b.seconds - a.seconds);

  res.json({ month: label, totalSeconds: rows.reduce((n, r) => n + r.seconds, 0), rows });
});

export default router;
