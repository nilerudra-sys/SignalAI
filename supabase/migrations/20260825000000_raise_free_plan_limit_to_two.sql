-- Raises the free-tier competitor limit from 1 to 2. This project is a
-- portfolio/demo build, not a real business trying to protect a paid tier's
-- value prop — a slightly more generous free limit gives visitors a
-- stronger sense of the product (comparing competitors side by side) with
-- effectively no real cost. Keep in sync with FREE_PLAN_COMPETITOR_LIMIT in
-- lib/plan.ts.

alter table public.profiles
  alter column competitor_limit set default 2;

-- Bring existing free-tier profiles up to the new default. Only rows still
-- at the old default (1) are touched — anyone with a custom override
-- (the admin account's 999, or any other manually-set limit) is untouched.
update public.profiles
set competitor_limit = 2
where competitor_limit = 1;

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
    user_limit := 2;
  end if;

  if competitor_count >= user_limit then
    raise exception 'You have reached your competitor limit (%). Upgrade to add more.', user_limit
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;
