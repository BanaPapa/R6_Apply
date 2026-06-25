import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client (anon key) — for user-facing features such as
 * 저장 슬롯 (apply_slots, RLS-scoped to auth.users) and 저장 검색.
 *
 * Returns `null` when the env vars are not set, so the app runs without Supabase
 * configured (저장 슬롯은 localStorage 로 동작). Archive WRITES happen server-side
 * with the service_role key (see lib/supabase/serverClient.mjs).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export const isSupabaseEnabled = (): boolean => supabase !== null;
