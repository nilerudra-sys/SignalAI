import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * ONLY import this from server-only code (Server Components, Server
 * Actions, Route Handlers) that has already verified the caller is the
 * admin (see lib/admin.ts). Never import this from a "use client" file or
 * pass its output to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY for the admin client.');
  }

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
