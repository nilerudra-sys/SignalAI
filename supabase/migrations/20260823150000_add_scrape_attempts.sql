-- scrape_attempts: append-only log of every scrape attempt (success or
-- failure), regardless of whether it produced a new snapshot.
--
-- `snapshots` only ever holds successfully-scraped content, so a failed
-- attempt (page unreachable, scraper error) was previously invisible
-- entirely — the dashboard had no way to distinguish "never checked" from
-- "checked, but it's currently broken." This table is what the dashboard's
-- activity feed and per-source status ("last checked" / failed) read from.

create table if not exists public.scrape_attempts (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  page_type text not null check (page_type in ('pricing', 'changelog')),
  status text not null check (status in ('success', 'error')),
  error_message text,
  attempted_at timestamptz not null default now()
);

create index if not exists scrape_attempts_competitor_page_attempted_idx
  on public.scrape_attempts (competitor_id, page_type, attempted_at desc);

alter table public.scrape_attempts enable row level security;

create policy "Users can view scrape attempts of their own competitors"
  on public.scrape_attempts for select
  using (
    exists (
      select 1 from public.competitors c
      where c.id = scrape_attempts.competitor_id
        and c.user_id = (select auth.uid())
    )
  );

-- No insert policy for authenticated users — written only by the scrape job
-- via the service-role key (scripts/scrape.ts), same as `snapshots`.
