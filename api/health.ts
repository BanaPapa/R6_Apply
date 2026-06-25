import type { VercelRequest, VercelResponse } from '@vercel/node';

// GET /api/health — liveness check.
export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
}
