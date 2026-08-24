# Signal — Local Testing Guide

A manual, end-to-end test pass for everything built so far, run entirely on
`localhost`. No deploy required for any of this.

---

## 1. Startup

### 1.1 Prerequisites

- Node.js **22+** required (`package.json` declares `engines.node: ">=22"` —
  `@supabase/supabase-js`'s realtime client needs the native `WebSocket`
  global, which only exists from Node 22 onward). Confirmed on this machine:
  `node --version` → `v22.18.0`. ✅
- Playwright's Chromium binary is used as a fallback for JS-heavy pages in
  the scraper. Already installed and cached on this machine
  (`%LOCALAPPDATA%\ms-playwright\chromium-1234`). ✅ On a genuinely fresh
  machine you'd need `npx playwright install chromium` once — not needed
  here.

### 1.2 Install & start

From the project root (`signal/`):

```bash
npm install
```

```bash
npm run dev
```

If port 3000 is already in use (e.g. another terminal already has the dev
server running), Next.js will either reuse it or fail — either way, just
open the URL below; you don't need two copies running.

### 1.3 URLs to open

| URL | What it is |
| --- | --- |
| `http://localhost:3000` | Landing page |
| `http://localhost:3000/login` | Login |
| `http://localhost:3000/signup` | Signup |
| `http://localhost:3000/dashboard` | Dashboard (redirects to `/login` if signed out) |
| `http://localhost:3000/settings` | Settings (placeholder page) |
| `http://localhost:3000/admin` | Admin (only `nilerudra@gmail.com`, redirects everyone else to `/`) |

### 1.4 Other local services

There is no separate backend server, queue, or worker — everything runs
inside the Next.js dev server **except** the scrape and digest-send jobs,
which are standalone scripts you run by hand from the terminal (they are
*not* wired into any UI button — that's intentional, see README "Weekly
automation"). There is no cron running locally, so:

- **Scraping** happens only when you run `npm run scrape` (optionally with a
  competitor id) yourself.
- **Sending digest emails** happens only when you run `npm run send-digests`
  yourself.

Both read `.env.local` directly via `dotenv`, so no extra setup beyond the
env file below.

### 1.5 Environment variables — current status

Checked `.env.local` against `.env.example`:

| Variable | Required for | Status |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Everything (auth, DB) | ✅ set |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Everything (auth, DB) | ✅ set |
| `SUPABASE_SECRET_KEY` | `npm run scrape`, `npm run send-digests`, `/admin` | ✅ set |
| `GEMINI_API_KEY` | AI summarization step | ✅ set |
| `GEMINI_MODEL` | Optional | not set — defaults to `gemini-3.6-flash` in code. This model name has drifted before; if `npm run scrape` errors on the summarize step with something like "model not found," this is the first thing to check. |
| `RESEND_API_KEY` | `npm run send-digests` | ✅ set |
| `RESEND_FROM_EMAIL` | Optional | not set — defaults to Resend's shared sandbox sender `onboarding@resend.dev`, which **only delivers to the email address your Resend account itself is registered with**. Anything else gets a 403. See section 3. |
| `NEXT_PUBLIC_SITE_URL` | Optional | not set — defaults to `http://localhost:3000` in code, which is correct for local testing. |
| Razorpay / any payment keys | — | Not applicable — no billing/payment integration has been built yet, so there's nothing to configure or test here. |

**All four required secrets are filled in with what look like real keys, not
placeholders.** The app should work fully locally. The two blank optional
vars are genuinely optional and have sane local defaults — no action needed
unless you hit the Resend delivery restriction in section 3.

---

## 2. Full walkthrough checklist

### A. Landing page (`/`)

- [ ] Page loads, `SiteHeader` shows the blinking signal dot + "Signal" +
      "Log in" / "Join waitlist" (when signed out).
- [ ] Hero section ("Issue 14 · Week of Aug 17…") renders with the headline
      and the three pillars (Pricing, Launches, Hiring).
- [ ] Waitlist form (in the Hero) accepts an email and submits — confirm via
      **browser devtools console**, not a network call: it should log
      `[signal] waitlist signup {...}` and show "You're on the list…".
      There is no backend for this yet, by design — don't expect a DB row.
- [ ] **Quick Check** widget: enter a real domain (try the three example
      chips — `linear.app`, `notion.so`, `vercel.com`), confirm it returns a
      pricing-page excerpt without needing to sign in.
  - [ ] Try a domain with no findable pricing page (e.g. a random small
        site) and confirm it shows a clean "couldn't find a public pricing
        page" message, not a crash.
  - [ ] Submit 6 checks within a minute to confirm the 5/min rate limit
        kicks in with a `rate_limited` message.
- [ ] Sample digest, pricing teaser, and closing signup sections render
      below.

### B. Signup / Login — email + password

- [ ] `/signup` → fill in email + password ("At least 6 characters") →
      submit → redirected to `/dashboard`, dashboard renders (assuming
      Supabase's "Confirm email" setting is off — see section 3 if you see
      a "check your email" message instead).
- [ ] `/login` → same credentials → redirected to `/dashboard`.
- [ ] Click the logout button in the dashboard header (`DashboardHeader` →
      `LogoutButton`) and confirm `/dashboard` redirects to `/login` when
      signed out.
- [ ] Try logging in with a wrong password — confirm a clear inline error,
      not a crash or blank page.

### C. Signup / Login — "Continue with Google"

- [ ] Click it on `/login` or `/signup`.
- [ ] **Expected result: it breaks.** You'll be redirected away from the
      app to a raw Supabase JSON error page (`"Unsupported provider:
      missing OAuth secret"`). This is a known, already-diagnosed issue —
      Google OAuth was never configured in the Supabase project — not
      something newly broken by recent changes. See `DEBUG-NOTES.md` and
      section 3. **Don't spend time re-debugging this unless you're
      specifically working on fixing it.**

### D. Dashboard — new user, empty state

- [ ] Sign up as a brand-new user (or a user with 0 competitors).
- [ ] Dashboard shows "Nothing tracked yet — 1 slot on your plan," the
      stats row (Tracked `0 of 1`, Changes this week `0`, Last check
      `Never`, Next digest → next Monday), and the dashed empty-state panel
      "Add your first competitor" with its own "Add competitor" button.
- [ ] "This week so far" section shows "Nothing to report yet."

### E. Add competitor flow + free-tier limit

- [ ] Click "Add competitor," fill in:
  - Competitor name (e.g. "Linear")
  - Website URL (`https://linear.app`)
  - Pricing page URL (`https://linear.app/pricing`)
  - Changelog / blog URL — optional, leave blank once to confirm it's
    truly optional
- [ ] Submit → modal closes, card appears immediately (no page reload
      needed), stats update to `1 of 1`.
- [ ] Try adding the same website URL again as a second competitor for the
      same user — confirm the "You're already tracking a competitor with
      this website URL" message (unique constraint).
- [ ] **Client-side limit UX**: with 1 competitor tracked (free-plan limit
      is 1), the "Add competitor" button should now be **hidden entirely**
      (not disabled) and replaced by the blue "You're tracking 1 of 1…
      Upgrade to watch your whole set" banner with a "View plans" link. You
      will not see a form to attempt a 2nd add through the UI — that's the
      intended UX, not a bug.
  - [ ] **Real DB-level enforcement** (the actual security boundary, since
        a user could otherwise call the Supabase API directly, bypassing
        the UI): in the Supabase dashboard → SQL Editor, run an insert as
        that user would, e.g.:
        ```sql
        insert into competitors (user_id, name, website_url, pricing_page_url)
        values ('<that user's id from auth.users>', 'Test 2', 'https://example.com', 'https://example.com/pricing');
        ```
        Confirm it's rejected with `You have reached your competitor limit
        (1). Upgrade to add more.` — this is the real enforcement; the
        hidden button is just UX polish on top of it.

### F. Manually running the scrape script

- [ ] Get the competitor's `id`: Supabase dashboard → Table Editor →
      `competitors`, or Table Editor's row detail view.
- [ ] Run:
  ```bash
  npm run scrape -- <competitor_id>
  ```
- [ ] Confirm terminal output shows: which page it's scraping, "Rendered
      with: fetch" (or "playwright" if it fell back), the extracted text,
      "Saved snapshot (pricing)." For a brand-new competitor: "First
      snapshot for this page — nothing to compare yet." (expected — there's
      nothing to diff against yet).
- [ ] Confirm in Supabase Table Editor → `snapshots` that a new row exists
      with `raw_text` populated and a recent `scraped_at`.
- [ ] Run `npm run scrape` with **no argument** once, too — confirm it logs
      "Scraping N competitor(s)..." and loops through everyone (this is
      exactly what the weekly GitHub Action runs).

### G. Diff detection between two snapshots

Real pricing pages rarely change minute-to-minute, so to actually see a
diff fire during a test session, seed a deliberately different "previous"
snapshot rather than waiting for a real page to change:

- [ ] After step F has created one real snapshot, go to Supabase SQL Editor
      and insert a second, slightly different one for the same competitor
      + page type, e.g.:
      ```sql
      insert into snapshots (competitor_id, page_type, raw_text, scraped_at)
      values (
        '<competitor_id>',
        'pricing',
        '<paste the real raw_text from the row F created, but edit one line — e.g. change a price>',
        now()
      );
      ```
- [ ] Run `npm run scrape -- <competitor_id>` again. This performs a fresh
      real scrape and diffs it against your seeded row (the two most recent
      snapshots for that page type).
- [ ] Confirm the terminal shows `Change detected since <timestamp>` with
      the diff lines printed (lines prefixed `+`/`-`), **not** "No
      meaningful change."

### H. AI summarization

This runs automatically as part of the same `npm run scrape` invocation in
step G, right after a meaningful diff is found — there's no separate
command.

- [ ] In that same terminal output, confirm you see:
      `Summary [<change_type>]: <headline>` and `Why it matters: <text>`,
      followed by `Saved digest event.`
- [ ] Sanity-check the summary is grounded in what you actually changed in
      the diff (not hallucinated) — the prompt explicitly forbids inventing
      details, so this is worth a real look, not just a rubber stamp.
- [ ] Confirm in Supabase Table Editor → `digest_events` that a new row
      exists with `sent_at` still `null`.
- [ ] Refresh `/dashboard` — the competitor's card should now show the new
      change summary instead of "No changes detected yet," and "This week
      so far" should list it.

### I. Manually running the send-digests script

- [ ] **Before running this**: check which email your Resend account is
      registered with (Resend dashboard → Account), and make sure the
      Supabase auth user who owns the test competitor has *that exact*
      email — otherwise Resend will 403 the send (sandbox mode, see
      section 3). If needed, sign up/test with your real
      `nilerudra@gmail.com` account rather than a `+alias` variant, since
      Resend's sandbox restriction is on the literal registered address.
- [ ] Run:
  ```bash
  npm run send-digests
  ```
- [ ] Confirm terminal output: "Found unsent events for 1 user(s)," then
      "Sent digest to `<email>` (1 event(s), id: `<resend-id>`)," then
      "Marked 1 event(s) as sent."
- [ ] Check that inbox for a real email — subject "Your Signal digest — 1
      competitor, 1 change" — and confirm the change summary, headline, and
      why-it-matters render correctly in the email body.
- [ ] Confirm in Supabase Table Editor that the `digest_events` row now has
      a non-null `sent_at`.
- [ ] Run `npm run send-digests` again immediately — confirm it says "No
      unsent digest events from the past week. Nothing to send." (proves it
      won't double-send).

### J. Admin dashboard

- [ ] Signed in as `nilerudra@gmail.com`, open `/admin` — confirm it loads
      a table of every signed-up user (email, signup date, competitor
      count, editable limit field).
- [ ] Signed in as any **other** user, try opening `/admin` directly by URL
      — confirm you're redirected to `/` (not `/login` — that's
      intentional, so the redirect doesn't reveal `/admin` requires a
      specific account).
- [ ] As admin, change a test user's `Limit` field from `1` to `2` and
      click Save.
- [ ] Sign in as that test user (or refresh their already-open dashboard
      session) — confirm the stats row now says `Tracked X of 2` and, if
      they were previously at their limit, the "Add competitor" button
      reappears and the upgrade banner disappears.
- [ ] Confirm this actually changed the DB, not just the UI: check
      Supabase Table Editor → `profiles` → that user's `competitor_limit`
      is now `2`.

### K. Vercel Analytics

- [ ] ⚠️ **Not present in the codebase yet** — I checked `package.json`
      (`@vercel/analytics` is not a dependency) and `app/layout.tsx` (no
      `<Analytics />` import/render). There's nothing to click through here
      because it hasn't been added. Flagging this now since it was on your
      list to verify — let me know if you want it wired in before deploy.

### L. Settings page

- [ ] `/settings` loads a plain "Email preferences are coming soon"
      placeholder with a link back to `/`. Confirmed intentional
      placeholder, not a bug.

---

## 3. Known limitations locally

Things that are expected to behave differently (or not work at all) on
`localhost` — so you don't mistake environment limitations for real bugs.

- **Google OAuth is fully broken, not just "different locally."** It was
  never configured in the Supabase project (no Client ID/Secret under
  Authentication → Providers → Google) — this isn't a localhost-vs-domain
  redirect quirk, it fails the exact same way in production too, until it's
  actually configured (see README "5. Enable Google OAuth" and
  `DEBUG-NOTES.md` for the full root-cause writeup). Once it *is*
  configured, note that Google's authorized redirect URIs and Supabase's
  Site URL/Redirect URLs **are** environment-specific — you'd need
  `localhost:3000` entries for local testing and separate production-domain
  entries later; that part of the setup doesn't carry over automatically
  when you deploy.
- **Resend is in sandbox mode.** No verified sending domain, so
  `onboarding@resend.dev` can only deliver to the exact email your Resend
  account is registered with. Testing with any other address will silently
  fail with a 403 in the script output — that's expected until a domain is
  verified and `RESEND_FROM_EMAIL` is set (a deploy-time task, not
  something to fix locally).
- **No cron runs locally.** The weekly schedule (`.github/workflows/weekly-digest.yml`,
  Mondays 07:00 UTC) only exists on GitHub Actions once deployed/pushed.
  Locally you are always triggering `npm run scrape` and
  `npm run send-digests` by hand — this is the correct way to test the
  pipeline locally, not a workaround for something broken.
- **No timezone-aware scheduling exists at all yet** (local or deployed) —
  the digest always runs at 07:00 UTC for every user regardless of their
  timezone, despite "7:00 local" copy elsewhere implying otherwise. This is
  a known gap, not something you'll see behave differently locally vs. in
  production.
- **Playwright's headless Chromium fallback works locally** (it's a real
  browser binary on your machine either way), so this one *doesn't* differ
  from production — but it's worth knowing the GitHub Actions runner
  installs it fresh every run (`playwright install --with-deps chromium`),
  which is slower there than here where it's already cached.
- **The Quick Check rate limiter is in-memory and per-process.** Restarting
  `npm run dev` resets it. This will also be true in most serverless
  production deployments (each instance has its own memory) — so "resets on
  restart" isn't a local-only quirk, just worth knowing before you read too
  much into rate-limit testing either locally or after deploy.
- **Vercel Analytics can't show real data locally even once added** —
  it only reports from actual deployed traffic, so this is something you
  can, at best, confirm is *present* locally (script tag renders, no
  console errors) but never confirm is *working* until after a real deploy.
  Currently moot since it isn't in the codebase yet (see checklist item K).
- **Changelog diff noise** — some competitors' changelog pages return their
  entire history on every scrape rather than just recent entries, which
  produces large, noisy diffs. Not fixed yet, not localhost-specific — just
  something to expect if you test with a changelog URL that behaves this
  way.
