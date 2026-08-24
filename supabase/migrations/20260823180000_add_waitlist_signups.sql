-- waitlist_signups: emails collected from the landing page's "Join the
-- waitlist" form (components/SignupForm.tsx). Previously this only logged
-- to the browser console — nothing was persisted and nobody was notified.

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_signups_email_unique
  on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;

-- No policies — this table is only ever written to (and would only ever be
-- read) via app/api/waitlist/route.ts using the service-role key, same
-- trusted-backend-only pattern as scrape_attempts/snapshots.
