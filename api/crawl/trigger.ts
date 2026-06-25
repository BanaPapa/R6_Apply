import type { VercelRequest, VercelResponse } from '@vercel/node';
import { triggerCrawl } from '../../lib/applyhome/handlers.mjs';

// POST /api/crawl/trigger — legacy no-op kept for UI compatibility (crawling is
// live inside the search endpoints). Validates input only.
export default function handler(req: VercelRequest, res: VercelResponse): void {
  const { status, body } = triggerCrawl(req.body || {});
  res.status(status).json(body);
}
