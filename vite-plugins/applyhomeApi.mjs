import {
  searchApartments,
  streamSearch,
  getApartmentDetail,
  triggerCrawl,
  getCrawlStatus,
} from '../lib/applyhome/handlers.mjs';

/**
 * Vite dev plugin: serves the applyhome `/api/*` endpoints from inside the dev
 * server, replacing the old standalone Express backend. The crawler runs here
 * in Node (server-side), so the browser never hits applyhome.co.kr directly and
 * there is no CORS problem. In production the same handlers back the Vercel
 * functions in `api/` — this plugin is the local mirror of that.
 */

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const query = Object.fromEntries(url.searchParams.entries());
  const method = req.method || 'GET';

  // Health check
  if (path === '/api/health') {
    return sendJson(res, 200, { status: 'OK', timestamp: new Date().toISOString() });
  }

  // Streaming search (SSE) — must be matched before the plain search route.
  if (path === '/api/apartments/search/stream' && method === 'GET') {
    await streamSearch(query, req, res);
    return;
  }

  // Apartment search (live crawl, paginated)
  if (path === '/api/apartments/search' && method === 'GET') {
    const { status, body } = await searchApartments(query);
    return sendJson(res, status, body);
  }

  // Single 단지 detail — /api/apartments/:houseManageNo/detail
  const detailMatch = path.match(/^\/api\/apartments\/([^/]+)\/detail$/);
  if (detailMatch && method === 'GET') {
    const houseManageNo = decodeURIComponent(detailMatch[1]);
    const { status, body } = await getApartmentDetail(houseManageNo, query);
    return sendJson(res, status, body);
  }

  // Crawl control (legacy, kept for UI compatibility)
  if (path === '/api/crawl/trigger' && method === 'POST') {
    const reqBody = await readBody(req);
    const { status, body } = triggerCrawl(reqBody);
    return sendJson(res, status, body);
  }
  const statusMatch = path.match(/^\/api\/crawl\/status\/([^/]+)$/);
  if (statusMatch && method === 'GET') {
    const { status, body } = getCrawlStatus(decodeURIComponent(statusMatch[1]));
    return sendJson(res, status, body);
  }

  // Unknown /api route
  return sendJson(res, 404, { error: 'Route not found' });
}

export function applyhomeApiPlugin() {
  return {
    name: 'applyhome-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();
        handle(req, res).catch((error) => {
          if (!res.headersSent) {
            sendJson(res, 500, { error: 'Internal server error', message: error.message });
          } else {
            res.end();
          }
        });
      });
    },
  };
}

export default applyhomeApiPlugin;
