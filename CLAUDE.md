# Signal — project state

Signal is a competitive intelligence digest tool for solo SaaS founders: it
watches named competitors' pricing pages and changelogs, detects meaningful
changes, summarizes them in plain English via AI, and emails a weekly
digest. Built for a single founder/small team, not enterprise scale.

Repo: https://github.com/nilerudra-sys/SignalAI (branch `main`)

## What's built (in build order)

1. **Landing page** (`app/page.tsx` + `components/{Hero,SampleDigest,
   PricingTeaser,ClosingSignup,SiteHeader,SiteFooter}.tsx`) — waitlist
   signup (console.log only, no backend), sample digest showcase, pricing
   teaser, and (latest addition) a real **Quick Check** widget.
2. **Auth** — Supabase Auth, email/password + Google OAuth intended.
   `/login`, `/signup`, `/auth/callback`. Email/password works.
   **Google OAuth is broken — see "Known issues" below, do not assume it
   works.**
3. **Database schema** (`supabase/migrations/`) — `competitors`,
   `snapshots`, `digest_events`, `profiles` tables with RLS. See
   "Architecture" below for the shape of each.
4. **Dashboard** (`/dashboard`) — add/list tracked competitors, enforces a
   per-user `competitor_limit` (from `profiles`, defaults to 1) both
   client-side (UX) and via a DB trigger (real enforcement).
5. **Scraper** (`lib/scraper.ts`) — fetch + Cheerio first, falls back to
   Playwright (headless Chromium) if the page looks JS-rendered (thin
   extracted text). Strips nav/footer/scripts/ads, inserts line breaks at
   block-element boundaries so extracted text is diffable line-by-line.
6. **Diff** (`lib/diff.ts`) — plain line-based text diff (`jsdiff`), no AI.
   Returns only meaningfully-changed lines (ignores whitespace-only diffs).
7. **AI summarization** (`lib/summarize.ts`) — Gemini (free tier, Flash
   model, name configurable via `GEMINI_MODEL` env var — the exact model ID
   has already drifted once, see git history). JSON-schema-constrained
   output, low temperature, prompt explicitly forbids inventing details not
   in the diff. Produces `{ change_type, headline, why_it_matters }`.
8. **Email digests** — `emails/DigestEmail.tsx` (React Email), sent via
   Resend from `scripts/send-digests.ts`. Groups a user's unsent
   `digest_events` by competitor.
8.5. **Admin dashboard** (`/admin`) — hardcoded to one email
   (`lib/admin.ts` `ADMIN_EMAIL`), lets the admin view all users and adjust
   any user's `competitor_limit` inline (Server Action, service-role
   client). Gated in middleware + page + the Server Action itself (3
   layers, since Server Actions can be invoked directly).
9. **Weekly automation** — `.github/workflows/weekly-digest.yml`, GitHub
   Actions (not Vercel Cron — Playwright needs a real VM, painful on
   serverless). Runs `npm run scrape` (all competitors, no args) then
   `npm run send-digests` every Monday 07:00 UTC. Repo secrets already set.
10. **Design polish** (most recent) — `/login` and `/signup` were still on
    an old dark theme from before the rest of the app got redesigned;
    restyled to match. Landing page's fake pricing-check demo replaced with
    a **real** `components/QuickCheck.tsx` — visitor enters a domain,
    `POST /api/quick-check` (`lib/quickCheck.ts`) tries `/pricing`,
    `/price`, `/plans` with a real fetch (deliberately no Playwright — this
    endpoint is public/unauthenticated), has an SSRF guard (resolves and
    checks the real IP, not just the hostname string) and a per-IP
    in-memory rate limit (5/min).

## Currently in progress

**Debugging a login bug** — see `DEBUG-NOTES.md` for full details, don't
duplicate that investigation here. Short version: clicking "Continue with
Google" sends visitors to a broken Supabase OAuth redirect (raw JSON error
page) because Google OAuth was never actually configured in the Supabase
project, and `GoogleButton.tsx`'s error handling structurally cannot catch
this specific failure (Supabase redirects the browser away before the
"provider not configured" error is knowable client-side). Two ruled-out
false alarms are also documented there — read them before re-investigating
anything that looks similar.

## Known issues / things to watch out for

- **Google OAuth is not configured** and the button currently leads to a
  broken experience (see above). Don't assume "Continue with Google" works
  in any testing.
- **Resend is in sandbox mode** — no verified sending domain yet, so the
  default `onboarding@resend.dev` sender can only deliver to whatever email
  Resend's own account is registered with. Real recipients will get a 403
  until a domain is verified and `RESEND_FROM_EMAIL` is set.
- **Changelog diffs can be huge.** Some competitors' changelog pages return
  their entire history on every scrape (seen 50–59KB from real sites in
  testing), not just recent entries. Diffing two full-history snapshots is
  noisy. Not yet solved — worth revisiting before this matters in practice.
- **Quick Check's rate limiter is in-memory, single-process.** Resets on
  restart, doesn't share state across instances. Fine for now, would need
  real shared state (Redis, DB-backed) for multi-instance deployment.
- **No timezone-aware digest scheduling.** The weekly cron runs 07:00 UTC
  for everyone, not each user's local time, despite copy elsewhere ("7:00
  local") implying otherwise.
- **Node version matters.** `@supabase/supabase-js`'s realtime client
  requires the native `WebSocket` global (Node 22+). This already broke the
  GitHub Actions workflow once (was pinned to Node 20). `package.json` now
  declares `engines.node: ">=22"` — respect it in any new tooling/CI.
- The admin account (`nilerudra@gmail.com`) and the primary test account
  (`nilerudra+signaltest@gmail.com`) are real Supabase Auth users in the
  live project, not fixtures. Don't delete them; do clean up any test
  `competitors`/`snapshots`/`digest_events` rows created during debugging.

## Architecture

- **Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase
  (Postgres + Auth), Gemini API, Resend, Playwright, GitHub Actions.
- **Design system**: Tailwind tokens in `tailwind.config.ts` are split into
  two unrelated namespaces — don't mix them:
  - `paper`, `graphite`, `slate`, `hairline`, `cobalt`, `rose`, `moss` — the
    current light theme, used everywhere now (landing, dashboard, admin,
    auth pages).
  - `ink`, `signal`, `diff`, `muted`, plus the base `background`/
    `foreground` CSS vars — an older dark theme. Nothing should use these
    anymore as of the auth-page restyle; if you find a component still
    using them, that's a bug, not an intentional dark-mode area.
- **Folder layout**:
  - `app/` — routes. `app/api/quick-check/route.ts` is the only Route
    Handler; everything else auth-related uses Server Components/Actions.
  - `components/` — UI, split into `components/auth/` and
    `components/dashboard/` subfolders for those areas.
  - `lib/` — business logic: `scraper.ts`, `diff.ts`, `summarize.ts`,
    `quickCheck.ts`, `admin.ts`, `plan.ts`, `changeCategory.ts`,
    `relativeTime.ts`, and `lib/supabase/{client,server,middleware,admin}.ts`
    for the four different Supabase client contexts (browser, server
    component, middleware, service-role admin).
  - `scripts/` — standalone Node scripts run via `tsx`
    (`npm run scrape`, `npm run send-digests`), not part of the Next.js app
    itself. Take `--` args from the CLI (e.g. `npm run scrape -- <id>`).
  - `emails/` — React Email templates, rendered by `scripts/send-digests.ts`.
  - `supabase/migrations/` — SQL migrations, applied via
    `npx supabase db push` (project is linked; see README).
  - `.github/workflows/` — the weekly automation.
- **Auth model**: `auth.users` (Supabase-managed) + a `profiles` table
  (one row per user, auto-created via an `on_auth_user_created` trigger)
  holding just `competitor_limit` so far. RLS on `profiles` only allows
  users to read their own row — writes are admin/trigger-only, by design
  (users must never self-elevate their own limit).
- **Service-role usage**: `SUPABASE_SECRET_KEY` (bypasses RLS entirely) is
  used in three places, each gated by an application-level check rather
  than relying on RLS alone: `lib/supabase/admin.ts` (admin dashboard),
  `scripts/scrape.ts` and `scripts/send-digests.ts` (trusted backend jobs).
  Never import `lib/supabase/admin.ts` from a `"use client"` file.
- **Free-tier limit**: enforced twice — client-side in
  `components/dashboard/CompetitorsPanel.tsx` (UX: hide the "Add
  competitor" button) and server-side via a Postgres trigger
  (`enforce_free_competitor_limit`, reads `profiles.competitor_limit`) that
  raises a Postgres exception if exceeded. The DB trigger is the real
  enforcement; the client-side check is just UX.
