'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Supabase's default "Reset Password" email template links to
// `{{ .SiteURL }}/#access_token=...&type=recovery` (the pre-PKCE implicit
// flow) rather than `{{ .ConfirmationURL }}` (which would hit
// /auth/callback?code=... like the rest of this app's auth). Fragments
// never reach the server, so this has to be handled client-side: catch the
// tokens here, turn them into a real session, then hand off to
// /reset-password exactly as if the PKCE callback had run.
export function RecoveryHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) return;

    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return;

    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(() => {
      router.replace('/reset-password');
    });
  }, [router]);

  return null;
}
