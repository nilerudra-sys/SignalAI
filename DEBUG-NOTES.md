# Debug notes — Google OAuth login bug

Status: **investigating, not fixed**. Written mid-investigation so work isn't
lost across a context/session boundary.

## The real bug

Clicking **"Continue with Google"** on `/login` (or `/signup`) sends the
visitor to Supabase's OAuth authorize endpoint, which returns a raw,
unstyled JSON error instead of anything resembling the app:

```
https://wrjfuebckoehrexpfcvi.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&code_challenge=...

{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}
```

This is what the user reported as "error and blank page when i click log
in" — they left the app entirely and landed on Supabase's own domain
showing raw JSON.

### Root cause (confirmed, not yet fixed)

Google OAuth was never actually configured for this Supabase project — no
Client ID/Secret set under Authentication -> Providers -> Google in the
Supabase dashboard. This was always documented as an *optional* setup step
(README, "### 5. Enable Google OAuth") that was never completed.

The reason this produces a broken-looking dead end instead of a clean
in-app error: `supabase-js`'s `signInWithOAuth()` does **not** validate
provider configuration before navigating. It optimistically redirects the
browser straight to Supabase's `/authorize` endpoint; the "provider not
configured" failure is only discovered server-side, **after** the browser
has already left the app. This means `GoogleButton.tsx`'s existing
`if (error) { setError(...) }` handling structurally **cannot** catch this
failure — that code path only fires for errors that happen before redirect
(e.g. a network problem constructing the request), never for "the provider
you asked for isn't set up," which Supabase only reports after navigation.

### Relevant code

- `components/auth/GoogleButton.tsx` — the button, the `signInWithOAuth`
  call, and the error handling that can't catch this specific failure mode.
- `app/login/page.tsx`, `app/signup/page.tsx` — both render `<GoogleButton />`.
- `lib/supabase/client.ts` — the browser Supabase client used.
- `README.md`, section "### 5. Enable Google OAuth" — documents the
  (never-completed) setup: create OAuth credentials in Google Cloud Console,
  paste Client ID/Secret into Supabase dashboard.
- Supabase Dashboard (external, not in this repo) — Authentication ->
  Providers -> Google — where the missing Client ID/Secret would go.

### Exact repro steps

1. Confirm Google OAuth is not configured in the Supabase project (current
   state — Authentication -> Providers -> Google has no Client ID/Secret).
2. Go to `/login` (or `/signup`) in a **clean** browser session (see false
   alarm #2 below for why "clean" matters).
3. Click **Continue with Google**.
4. Browser navigates away to
   `https://wrjfuebckoehrexpfcvi.supabase.co/auth/v1/authorize?provider=google&...`.
5. That page shows raw JSON: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}`.

I was in the middle of step 3 (a deliberate click in a fresh tab, `tab-3`,
to get a final clean confirmation) when this session was interrupted to
write these notes instead — so this is very strong circumstantial evidence,
not yet a directly-observed clean repro in a fresh tab. That direct
confirmation click is the right very-first step next session.

### Likely next steps (need a decision, not just a fix)

Two real options — pick one before touching code:

1. **Actually configure Google OAuth.** Needs the user's Google Cloud
   Console access: create OAuth 2.0 credentials, add the Supabase callback
   URL as an authorized redirect URI, then paste the Client ID/Secret into
   Supabase's dashboard. Steps already written in README "### 5. Enable
   Google OAuth" — just never completed. Makes the button actually work.
2. **Hide/disable "Continue with Google" until it's configured**, so no
   visitor can hit this dead end. Straightforward in `GoogleButton.tsx` /
   the two auth pages, but it's a product decision (removing a stated
   feature), not something to do unilaterally without confirming first.

Either way, a smaller independent improvement worth doing regardless of
which option is picked: `GoogleButton.tsx` could at least attempt to fail
more gracefully (e.g. there's no reliable way to pre-check provider config
client-side, but the copy/behavior around this button should not leave a
visitor stranded on a raw JSON page with no way back to the app).

## False alarms ruled out this session (do not re-investigate these)

1. **Quick Check "Something went wrong checking that domain" for claude.ai.**
   User saw this generic client-side error. Reproduced via two different
   paths — a direct `fetch()` to `/api/quick-check` and the actual UI form
   in a clean tab — and **both correctly returned** the proper structured
   response: `{"ok":false,"reason":"not_found","message":"Couldn't find a
   public pricing page for claude.ai at the usual spots."}`. Could not
   reproduce the generic error at all. Most likely a transient dev-server
   hot-reload hiccup during the original test, not a code bug. **No fix
   applied — if it recurs, it's worth a fresh look, but don't assume the
   code is broken.**

2. **`/login` appeared to auto-redirect to Google OAuth on page load** in
   the primary test tab ("seed"). This looked alarming (matches the same
   Google OAuth error above) but **did not reproduce in a fresh tab**
   (`tab-3`) — `/login` loaded the normal form correctly there. Almost
   certainly a stale/queued click left over from earlier browser-automation
   interactions in that specific tab session (this browser tool has shown a
   recurring pattern all session of clicks sometimes not registering until
   a second attempt — the flip side is an occasional delayed/replayed
   click), not a real app bug. The *separate*, real bug is the one
   documented above — it just happens to produce the same-looking error
   page, which is what made this one look scarier than it was.

3. **Real email/password login** (the actual "Log in" submit button,
   distinct from "Continue with Google") — tested in the same clean tab
   with real test credentials (`nilerudra+signaltest@gmail.com`): submitted
   successfully, redirected to `/dashboard`, rendered correctly, no errors.
   **This part of the login flow works fine.** The bug is specifically and
   only the Google OAuth button.
