import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Readable } from 'node:stream';

const router = Router();

// ncert.nic.in serves its chapter PDFs with "X-Frame-Options: SAMEORIGIN", so a browser refuses to
// show them inside our viewer. Streaming them through our own origin is the only way to embed them.
// The allow-list is the security boundary: without it this route would be an open proxy (SSRF).
const ALLOWED_HOSTS = new Set(['ncert.nic.in', 'www.ncert.nic.in']);
const UPSTREAM_TIMEOUT_MS = 20_000;

export function allowedUpstream(raw: unknown): URL | null {
  if (typeof raw !== 'string' || raw.length > 500) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (!ALLOWED_HOSTS.has(url.hostname)) return null;
  if (!url.pathname.toLowerCase().endsWith('.pdf')) return null;
  return url;
}

const pdfLimiter = rateLimit({ windowMs: 5 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });

// Passed straight through so the browser's PDF viewer keeps working: it fetches large files in
// byte ranges rather than all at once, and revalidates with the caching headers.
const FORWARDED_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag'];

router.get('/pdf', pdfLimiter, async (req, res) => {
  const upstream = allowedUpstream(req.query.url);
  if (!upstream) return res.status(400).json({ error: 'Only NCERT chapter PDF links can be opened here.' });

  const range = req.headers.range;
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream, {
      headers: range ? { Range: range } : {},
      redirect: 'follow',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return res.status(504).json({ error: 'NCERT did not respond. Try opening the PDF in a new tab.' });
  }

  if (!upstreamRes.ok && upstreamRes.status !== 206) {
    return res.status(502).json({ error: 'This chapter PDF is not available on ncert.nic.in right now.' });
  }
  // A redirect to an HTML error page must not be served as if it were the textbook.
  if (!(upstreamRes.headers.get('content-type') ?? '').toLowerCase().includes('pdf')) {
    return res.status(502).json({ error: 'That link no longer points to a PDF on ncert.nic.in.' });
  }

  res.status(upstreamRes.status);
  for (const header of FORWARDED_HEADERS) {
    const value = upstreamRes.headers.get(header);
    if (value) res.setHeader(header, value);
  }
  res.setHeader('Content-Disposition', 'inline');
  // helmet's defaults (X-Frame-Options + CSP frame-ancestors 'self') would block the viewer whenever
  // the API is not the exact same origin as the app, e.g. localhost:5173 -> localhost:4000 in dev.
  // Safe to drop here: the response is a public NCERT PDF, not an interactive page worth clickjacking.
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  if (!upstreamRes.body) return res.end();
  Readable.fromWeb(upstreamRes.body as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
});

export default router;
