-- profiles: one row per auth user, extending it with app-specific fields.
-- competitor_limit lets an admin override the free-tier cap per user (e.g.
-- for demos or paid customers) without needing a full billing/plans system.
-- This is the table the comment at the top of the core schema migration
-- anticipated ("profiles table ... plan, timezone, etc.").

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  competitor_limit integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

-- No insert/update policy for authenticated users — competitor_limit is
-- only ever changed by an admin (via the service-role key, see
-- lib/supabase/admin.ts) or by the on-signup trigger below. Users must
-- never be able to self-elevate their own limit.

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill profiles for any users who signed up before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- Update the free-tier trigger (from
-- 20260821220000_enforce_free_plan_competitor_limit.sql) to read the
-- per-user limit from profiles instead of a hardcoded 1. Keep
-- FREE_PLAN_COMPETITOR_LIMIT in lib/plan.ts in sync as the default for new
-- profiles and the client-side fallback if a profile row is ever missing.
create or replace function public.enforce_free_competitor_limit()
returns trigger
language plpgsql
as $$
declare
  competitor_count integer;
  user_limit integer;
begin
  select count(*) into competitor_count
  from public.competitors
  where user_id = new.user_id;

  select competitor_limit into user_limit
  from public.profiles
  where id = new.user_id;

  if user_limit is null then
    user_limit := 1;
  end if;

  if competitor_count >= user_limit then
    raise exception 'You have reached your competitor limit (%). Upgrade to add more.', user_limit
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;
