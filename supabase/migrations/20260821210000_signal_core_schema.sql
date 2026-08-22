-- Signal core schema: competitors, snapshots, digest_events.
--
-- Users are handled entirely by Supabase Auth (auth.users) — no extra
-- `profiles` table yet, since nothing in the app needs fields beyond what
-- Auth already stores (id, email, created_at). If/when we need them, likely
-- candidates are: display_name, plan ('free' | 'paid'), timezone and
-- digest_day_of_week (for scheduling the weekly send). That table would look
-- like:
--   create table public.profiles (
--     id uuid primary key references auth.users (id) on delete cascade,
--     plan text not null default 'free' check (plan in ('free', 'paid')),
--     timezone text not null default 'UTC'
--   );

-- competitors -----------------------------------------------------------
-- One row per competitor a user is tracking.

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  website_url text not null,
  pricing_page_url text,
  changelog_url text,
  created_at timestamptz not null default now()
);

create index if not exists competitors_user_id_idx
  on public.competitors (user_id);

-- Prevents accidentally tracking the same competitor twice.
create unique index if not exists competitors_user_website_unique
  on public.competitors (user_id, website_url);

alter table public.competitors enable row level security;

create policy "Users can view their own competitors"
  on public.competitors for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own competitors"
  on public.competitors for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own competitors"
  on public.competitors for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own competitors"
  on public.competitors for delete
  using ((select auth.uid()) = user_id);

-- snapshots ---------------------------------------------------------------
-- Raw scraped text of a competitor's page at a point in time. Written by
-- the scraping job (via the service_role key, which bypasses RLS) — end
-- users only ever read their own through the app.

create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  page_type text not null check (page_type in ('pricing', 'changelog')),
  raw_text text not null,
  scraped_at timestamptz not null default now()
);

-- Covers plain "snapshots for this competitor" lookups (leftmost prefix)
-- as well as the diffing job's actual query: latest snapshot of a given
-- page type for a given competitor.
create index if not exists snapshots_competitor_page_scraped_idx
  on public.snapshots (competitor_id, page_type, scraped_at desc);

alter table public.snapshots enable row level security;

create policy "Users can view snapshots of their own competitors"
  on public.snapshots for select
  using (
    exists (
      select 1 from public.competitors c
      where c.id = snapshots.competitor_id
        and c.user_id = (select auth.uid())
    )
  );

-- digest_events -------------------------------------------------------------
-- A detected, human-readable change, waiting to be (or already) included in
-- a weekly digest email. Also written by a backend job, not the end user.

create table if not exists public.digest_events (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  change_summary text not null,
  change_type text not null check (change_type in ('pricing', 'feature', 'hiring', 'other')),
  source_url text,
  detected_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists digest_events_competitor_id_idx
  on public.digest_events (competitor_id);

-- Speeds up the weekly digest job's query: "every event not yet sent".
create index if not exists digest_events_unsent_idx
  on public.digest_events (detected_at)
  where sent_at is null;

alter table public.digest_events enable row level security;

create policy "Users can view digest events for their own competitors"
  on public.digest_events for select
  using (
    exists (
      select 1 from public.competitors c
      where c.id = digest_events.competitor_id
        and c.user_id = (select auth.uid())
    )
  );
