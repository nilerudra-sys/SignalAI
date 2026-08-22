# Signal

Signal is a competitive intelligence digest tool for solo SaaS founders. It watches
competitors — changelogs, pricing pages, landing pages, review sites, and more — and
distills what changed into a short, digestible briefing, so a solo founder can stay on
top of the competitive landscape without spending hours manually checking sites.

This repository currently has a public landing page and account authentication
(email/password + Google). Competitor tracking and digests haven't been built yet.

## Tech stack

- [Next.js 14](https://nextjs.org/docs) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase Auth](https://supabase.com/docs/guides/auth) (email/password + Google OAuth)
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)

## Project structure

```
app/
  page.tsx            # Public landing page
  login/              # Email/password + Google login
  signup/             # Email/password + Google signup
  auth/callback/      # OAuth / email-confirmation redirect handler
  dashboard/          # Protected route — redirects to /login if signed out
components/
  auth/               # Auth forms, buttons, and shared auth UI
lib/
  supabase/           # Browser, server, and middleware Supabase clients
middleware.ts         # Refreshes the Supabase session and guards /dashboard
types/                # Shared TypeScript types
```

## Getting started

### Prerequisites

- Node.js 18.17 or later
- npm

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file and fill in any values as they're introduced:

   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication

Auth is powered by [Supabase Auth](https://supabase.com/docs/guides/auth). You need a
Supabase project connected before signup, login, or the `/dashboard` route will work.

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com/dashboard). It's free for
development.

### 2. Add your project keys

In the Supabase dashboard, go to **Project Settings -> API** and copy:

- **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
- **Publishable key** -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Paste them into `.env.local` (see `.env.example`), then restart `npm run dev`.

### 3. Set the allowed redirect URLs

In the Supabase dashboard, go to **Authentication -> URL Configuration**:

- **Site URL**: `http://localhost:3000` (use your deployed URL in production)
- **Redirect URLs**: add `http://localhost:3000/**` (and your production URL's `/**`)

This lets Google OAuth and email-confirmation links redirect back to `/auth/callback`.

### 4. Email/password behavior

By default, Supabase requires users to confirm their email before they get a session
(**Authentication -> Providers -> Email -> Confirm email**). With this on, signup shows
a "check your email" message instead of redirecting straight to `/dashboard`. For local
testing without setting up SMTP, you can turn **Confirm email** off — signup will then
sign the user in immediately.

### 5. Enable Google OAuth

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create
   an **OAuth 2.0 Client ID** (Application type: **Web application**).
2. Add this as an **Authorized redirect URI**:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (find `<your-project-ref>` in your Supabase project URL).
3. In the Supabase dashboard, go to **Authentication -> Providers -> Google**, enable
   it, and paste in the **Client ID** and **Client Secret** from Google Cloud Console.

## Database schema

SQL migrations live in `supabase/migrations/`. The core schema
(`competitors`, `snapshots`, `digest_events`) is defined in
`20260821210000_signal_core_schema.sql`, with foreign keys, indexes, and Row
Level Security policies so each user can only see their own data.

Users themselves are handled by Supabase Auth (`auth.users`), extended by a
`profiles` table (`20260823090000_add_profiles_and_dynamic_limit.sql`) — one
row per user, auto-created on signup via an `on_auth_user_created` trigger.
Right now it holds just `competitor_limit` (defaults to 1, matching the free
tier); the free-tier-limit trigger reads this per-user instead of a hardcoded
value, so raising it via `/admin` takes effect immediately.

To run the migration against your Supabase project, either:

- **Dashboard (quickest):** open your project's **SQL Editor**, paste in the
  contents of the migration file, and run it.
- **Supabase CLI (recommended for ongoing work):**

  ```bash
  npx supabase login
  npx supabase link --project-ref <your-project-ref>
  npx supabase db push
  ```

  `<your-project-ref>` is the subdomain in your project URL
  (`https://<project-ref>.supabase.co`). `db push` applies any migrations in
  `supabase/migrations/` that haven't been run yet, and keeps future ones
  in sync the same way.

## Scraping

`lib/scraper.ts` fetches a URL and extracts clean readable text, stripping
scripts, nav/header/footer chrome, and common ad/cookie-banner/newsletter
patterns. It tries a plain `fetch` + [Cheerio](https://cheerio.js.org/) parse
first (fast, no browser); if that fails or the extracted text is too thin —
the signature of a client-rendered page whose initial HTML is just an empty
app shell — it falls back to rendering the page in headless Chromium via
[Playwright](https://playwright.dev/).

`scripts/scrape.ts` is a manual runner: given a competitor id, it looks up
that competitor's `pricing_page_url` and `changelog_url`, scrapes both, prints
the extracted text, and saves each as a new row in `snapshots`.

```bash
npm run scrape -- <competitor_id>
```

This needs your project's **Secret key**, not the Publishable key — the
script writes directly to `snapshots`, which has no insert policy for regular
users (only a trusted backend job should be creating snapshots). Get it from
**Project Settings -> API -> Secret key** and set `SUPABASE_SECRET_KEY` in
`.env.local` (see `.env.example`). Never expose this key to the browser or
commit it — it bypasses Row Level Security entirely.

## Diffing and AI summaries

`lib/diff.ts` compares a competitor's newest snapshot to the previous one of
the same `page_type` using a plain line-based text diff
([jsdiff](https://github.com/kpdecker/jsdiff), no AI) and returns only the
lines that meaningfully changed.

When `scripts/scrape.ts` finds a meaningful diff, it passes that diff to
`lib/summarize.ts`, which calls the [Gemini API](https://ai.google.dev/) (free
tier, Flash model) to turn it into a structured summary — `change_type`,
`headline`, and `why_it_matters` — using JSON-schema-constrained output and a
prompt that's explicitly instructed not to state anything beyond what's in the
diff. The result is saved as a new row in `digest_events`.

Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
and set `GEMINI_API_KEY` in `.env.local` (see `.env.example`). Like the
Supabase Secret key, this is server-side only — never expose it to the
browser.

## Email digests

`emails/DigestEmail.tsx` is a [React Email](https://react.email/) template
that renders a user's unsent `digest_events` grouped by competitor, with a
colored tag per change type, the headline, and why it matters — plus a
"Manage email preferences" link to the `/settings` placeholder page.

`scripts/send-digests.ts` is the runner:

```bash
npm run send-digests
```

For every user with at least one unsent `digest_event` from the past week, it
groups those events by competitor, renders and sends the digest email via
[Resend](https://resend.com/), then marks the included events as sent
(`sent_at`). Users with no unsent events are skipped entirely — no email, no
Resend call.

Get a free API key at [resend.com/api-keys](https://resend.com/api-keys) and
set `RESEND_API_KEY` in `.env.local` (see `.env.example`) — server-side only,
same rule as the other secret keys. Until you verify a sending domain in
Resend, the default `onboarding@resend.dev` sender can only deliver to the
email address your Resend account itself is registered with — anything else
gets a `403`. Verify a domain at [resend.com/domains](https://resend.com/domains)
and set `RESEND_FROM_EMAIL` once you're ready to send to real users.

## Admin dashboard

`/admin` lists every signed-up user — email, signup date, competitors
tracked, and `competitor_limit` — with an inline field to raise or lower any
user's limit, saved immediately via a Server Action.

Access is hardcoded to one email (`ADMIN_EMAIL` in `lib/admin.ts`), enforced
in two places: `lib/supabase/middleware.ts` redirects anyone else straight to
`/` (not `/login`, so the redirect doesn't reveal that `/admin` requires a
specific account), and the page itself re-checks and redirects again as a
backstop. The Server Action that updates `competitor_limit` re-checks a third
time, since Server Actions can be invoked directly and not just through the
form they're attached to.

The page reads every user (`auth.users`) and their `profiles` row using
`lib/supabase/admin.ts` — a service-role client built from
`SUPABASE_SECRET_KEY`. That file is only ever imported from server-only code
(the admin page and its Server Action) that has already verified the caller
is the admin; never import it from a `"use client"` component.

## Available scripts

| Script                              | Description                                    |
| ------------------------------------ | ----------------------------------------------- |
| `npm run dev`                       | Start the development server                   |
| `npm run build`                     | Build the app for production                   |
| `npm run start`                     | Run the production build                       |
| `npm run lint`                      | Lint the codebase with ESLint                  |
| `npm run format`                    | Format the codebase with Prettier              |
| `npm run format:check`              | Check formatting without writing changes       |
| `npm run scrape -- <competitor_id>` | Scrape a competitor's pages and save snapshots |
| `npm run send-digests`              | Email unsent digest events to each user        |
