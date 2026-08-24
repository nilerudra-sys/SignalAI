# Signal — Deployment Plan (signal-ai.in)

Status: **planning only — nothing below has been executed.**

Decisions made:
- Host: **Vercel** (app itself never touches Playwright — that only runs
  in the GitHub Actions weekly job — so Vercel's serverless limits don't
  matter here).
- Supabase: **reuse the current project** as production (no data migration).
- Resend: **verify signal-ai.in** as a sending domain now, while DNS is
  already being touched for the site.

---

## Phase 0 — Pre-flight cleanup (do before anything else)

- [ ] Decide what happens to the `nilerudra+signaltest@gmail.com` test
      account and any test `competitors`/`snapshots`/`digest_events` rows
      (per `CLAUDE.md`) — since prod reuses this same Supabase project,
      clean these up or accept they'll be visible in production data.
- [ ] Confirm `.env.local` (has real secrets) is not committed —
      confirmed already: only `.env.example` is tracked in git, good.
- [ ] `git push` current `main` to `origin` (GitHub: `nilerudra-sys/SignalAI`)
      so Vercel deploys from the real latest commit.

## Phase 1 — Domain

- [ ] In your domain registrar for **signal-ai.in**, you'll add DNS
      records pointed at Vercel (Phase 3) and at Resend (Phase 2) —
      both are just DNS entries, no conflict between them.
- [ ] Decide on `www.signal-ai.in` vs bare `signal-ai.in` as the
      canonical host (recommend bare domain, redirect `www` → apex —
      Vercel handles this with one click once the domain is added).

## Phase 2 — Resend (verify signal-ai.in for sending)

- [ ] In Resend dashboard → Domains → add `signal-ai.in`.
- [ ] Add the SPF/DKIM (and DMARC, optional but recommended) TXT/CNAME
      records Resend gives you to the domain's DNS.
- [ ] Wait for verification (usually minutes, can take longer for `.in`
      registrars).
- [ ] Pick a sender address, e.g. `Signal <digest@signal-ai.in>` — this
      becomes `RESEND_FROM_EMAIL`.
- [ ] Once verified, digest/contact/waitlist emails can go to **any**
      recipient, not just the Resend account owner (current sandbox
      limitation noted in `CLAUDE.md`).

## Phase 3 — Vercel project + env vars

- [ ] Import the GitHub repo (`nilerudra-sys/SignalAI`, branch `main`)
      into a new Vercel project. Framework preset: Next.js (auto-detected).
- [ ] Set production environment variables in Vercel (values from
      `.env.local`, adjusted where noted):
      - `NEXT_PUBLIC_SUPABASE_URL`
      - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
      - `SUPABASE_SECRET_KEY` — needed here because `app/admin` Server
        Actions use `lib/supabase/admin.ts` (service-role) directly in
        the Next.js app, not just in the GH Actions scripts.
      - `GEMINI_API_KEY`, `GEMINI_MODEL` (optional)
      - `RESEND_API_KEY`
      - `RESEND_FROM_EMAIL` → `Signal <digest@signal-ai.in>` (from Phase 2)
      - `NEXT_PUBLIC_SITE_URL` → `https://signal-ai.in` (currently
        defaults to `http://localhost:3000` — this is the one existing
        value that MUST change for prod, it's used to build the "Manage
        email preferences" link in digest emails)
- [ ] Deploy once to get the `*.vercel.app` preview URL working before
      wiring the custom domain (isolates DNS issues from app issues).
- [ ] Add `signal-ai.in` (and `www.signal-ai.in`) as a custom domain in
      Vercel project settings; add the A/CNAME records it gives you to
      the domain's DNS (from Phase 1); Vercel auto-provisions SSL.

## Phase 4 — Supabase Auth production config

This is the step most likely to bite silently, based on this session's
password-reset debugging — Supabase Auth has its own allow-list separate
from Vercel/DNS:

- [ ] Supabase dashboard → Authentication → URL Configuration:
      - **Site URL** → `https://signal-ai.in`
      - **Redirect URLs** → add `https://signal-ai.in/**` (or explicit
        `https://signal-ai.in/auth/callback`, `https://signal-ai.in/reset-password`)
      — without this, `exchangeCodeForSession` / recovery links will
      redirect to the wrong origin or get rejected.
- [ ] Re-test the forgot-password flow end-to-end against the real
      domain once deployed (same manual test as was done for localhost
      earlier) — the legacy-template hash-based link behavior
      (`RecoveryHashHandler.tsx`) needs to keep working under the real
      domain and HTTPS, not just `http://localhost:3000`.
- [ ] Double check email-rate-limit settings on the Supabase project
      (this bit earlier during local testing) — production traffic
      pattern is different from dev testing bursts.

## Phase 5 — GitHub Actions (weekly digest) — mostly unaffected

- [ ] The workflow (`.github/workflows/weekly-digest.yml`) already runs
      independently of hosting — only two secrets need updating:
      - `RESEND_FROM_EMAIL` → same verified `digest@signal-ai.in` sender
      - `NEXT_PUBLIC_SITE_URL` → `https://signal-ai.in`
      (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`
      stay as-is since the Supabase project isn't changing.)
- [ ] Trigger one manual `workflow_dispatch` run after updating secrets
      to confirm scrape → summarize → email still works end-to-end
      against prod config before waiting for the real Monday cron.

## Phase 6 — Post-deploy verification checklist

- [ ] Landing page loads at `https://signal-ai.in`, waitlist signup
      writes to `waitlist_signups` and emails `ADMIN_EMAIL`
      (`nilerudra@gmail.com`, hardcoded in `lib/admin.ts` — not env-based,
      no change needed).
- [ ] Sign up → login → dashboard flow works on the real domain.
- [ ] Forgot password → reset password full round trip on real domain.
- [ ] Add competitor (quick-add + manual) works; delete competitor works.
- [ ] `/dashboard/prices` quick-check and search-and-track work.
- [ ] `/contact` form sends and admin receives it.
- [ ] `/admin` gated correctly (only `nilerudra@gmail.com`).
- [ ] Confirm the `sitemap`/robots/social-share basics if you care about
      that at launch (not currently in the codebase — flag as a
      follow-up, not a blocker).

## Known limitations to carry into production (from `CLAUDE.md`, unchanged by this deploy)

- No per-user timezone digest scheduling — everyone gets Monday 07:00 UTC.
- Changelog diffs can be noisy on sites that return full history each scrape.
- Google OAuth is still removed, not reconfigured.
- Quick Check's rate limiter is in-memory/per-process — fine on Vercel's
  serverless model per-invocation, but not a real distributed limiter;
  acceptable for launch traffic, worth revisiting if abuse shows up.

---

**Nothing in this plan has been executed.** Say the word on any phase and
I'll do just that phase, or the whole thing in order.
