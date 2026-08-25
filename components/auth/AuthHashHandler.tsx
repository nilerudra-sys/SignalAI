'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Supabase's default email templates (signup confirmation, password reset,
// magic link, email change) all link to the legacy implicit-flow shape
// `{{ .SiteURL }}/#access_token=...&type=<kind>` rather than
// `{{ .ConfirmationURL }}` (which would hit /auth/callback?code=... like
// the rest of this app's auth) — none of the project's Supabase email
// templates were customized to switch over. Fragments never reach the
// server, so this has to be handled client-side: catch the tokens here,
// turn them into a real session, then route based on what kind of link it
// was. Originally this only checked for `type=recovery` (password reset) —
// that missed signup-confirmation links entirely: a `type=signup` hash
// arrived, was silently ignored, and the user just landed on the plain
// homepage with nothing verified. Handling any recognized type with valid
// tokens fixes both.
export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const type = params.get('type');
    if (!access_token || !refresh_token) return;

    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(() => {
      router.replace(type === 'recovery' ? '/reset-password' : '/dashboard');
    });
  }, [router]);

  return null;
}
