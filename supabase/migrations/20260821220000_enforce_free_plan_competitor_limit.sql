-- Enforces the free-tier competitor limit at the database level, so it can't
-- be bypassed by calling the API directly (the app also checks this
-- client-side for a nicer "upgrade" prompt before the user even submits).
--
-- Everyone is on the free plan for now, hardcoded to 1 competitor. Once a
-- real `profiles.plan` column exists, replace the hardcoded limit below with
-- a lookup of the inserting user's plan. Keep this in sync with
-- FREE_PLAN_COMPETITOR_LIMIT in lib/plan.ts.

create or replace function public.enforce_free_competitor_limit()
returns trigger
language plpgsql
as $$
declare
  competitor_count integer;
begin
  select count(*) into competitor_count
  from public.competitors
  where user_id = new.user_id;

  if competitor_count >= 1 then
    raise exception 'Free plan is limited to 1 tracked competitor. Upgrade to add more.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger trg_enforce_free_competitor_limit
  before insert on public.competitors
  for each row
  execute function public.enforce_free_competitor_limit();
