'use client';

import { useLayoutEffect, useState } from 'react';
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
// was.
export function AuthHashHandler() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);

  // useLayoutEffect (not useEffect) so this runs — and, if it shows the
  // overlay below, forces a re-render — before the browser's first paint.
  // The server has no way to see a URL fragment, so it always renders the
  // normal logged-out homepage first; with useEffect that homepage was
  // visibly flashing on screen for a moment before the redirect below
  // fired, which read as "the link just took me to the website" even
  // though it was about to self-correct a second later. This was the
  // actual bug seen live in an interview — the link itself (and the
  // session it sets) was already working; only the visible flash wasn't.
  useLayoutEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const type = params.get('type');

    // Undoes the blocking script in app/layout.tsx's <head>, which hides
    // the page as soon as it sees "access_token=" in the hash. If the
    // tokens don't actually parse out, there's nothing to verify — restore
    // the normal page instead of leaving it hidden.
    document.documentElement.style.visibility = '';
    if (!access_token || !refresh_token) return;

    setVerifying(true);

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error: sessionError }) => {
        if (sessionError) throw sessionError;
        if (type === 'recovery') {
          // /reset-password only checks auth client-side, so a soft
          // navigation is fine here.
          router.replace('/reset-password');
        } else {
          // /dashboard is gated by middleware reading cookies server-side.
          // setSession() writes the session to a cookie, but a soft
          // client-side navigation's request can fire before that cookie is
          // reliably attached (seen in production, not locally) — a hard
          // navigation guarantees the server reads a fresh Cookie header.
          window.location.href = '/dashboard';
        }
      })
      .catch(() => {
        // An expired or already-used link rejects here. Without this, the
        // "Signing you in…" overlay above would stay up forever — no
        // redirect ever fires to replace it, unlike the pre-overlay
        // version where a failure just left the (still usable) homepage
        // showing. Send them somewhere real instead of leaving them stuck.
        window.location.href = '/login?error=auth';
      });
  }, [router]);

  if (!verifying) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper">
      <p className="font-mono text-[13px] text-slate-dim">Signing you in…</p>
    </div>
  );
}
