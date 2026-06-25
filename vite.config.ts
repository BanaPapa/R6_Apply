import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { applyhomeApiPlugin } from './vite-plugins/applyhomeApi.mjs';

// The applyhome `/api/*` endpoints are served by a dev plugin (the crawler runs
// in Node, so there is no standing Express server and no browser CORS problem).
// In production the same handlers in lib/applyhome back the Vercel functions.
export default defineConfig(({ mode }) => {
  // Expose .env values (incl. non-VITE_ secrets like SUPABASE_SERVICE_ROLE_KEY)
  // to the Node-side dev plugin via process.env. On Vercel these are already
  // populated from the project's environment variables.
  const env = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...env };

  return {
    plugins: [react(), applyhomeApiPlugin()],
    server: {
      port: 5173,
    },
  };
});
