import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCrawlStatus } from '../../../lib/applyhome/handlers.mjs';

// GET /api/crawl/status/:jobId — legacy status (always completed).
export default function handler(req: VercelRequest, res: VercelResponse): void {
  const { status, body } = getCrawlStatus(String(req.query.jobId || ''));
  res.status(status).json(body);
}
