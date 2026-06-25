import { createClient } from '@supabase/supabase-js';
import logger from '../applyhome/logger.mjs';

/**
 * Server-side Supabase client (service_role) for the applyhome archive.
 * Runs inside the Vite dev plugin / Vercel function. Uses the service_role key
 * so the crawler can write the 청약 archive (bypasses RLS).
 *
 * Degrades gracefully: when the env vars are absent the client is `null` and
 * every archive call becomes a no-op, so local dev without credentials behaves
 * exactly like pure live-crawl.
 *
 * NEVER import this from browser code — the service_role key must stay server-side.
 */
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (url && serviceKey) {
  supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  logger.info('Supabase archive enabled (service_role client ready)');
} else {
  logger.info('Supabase archive disabled (set VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to enable)');
}

export { supabaseAdmin };
export const isArchiveEnabled = () => !!supabaseAdmin;
