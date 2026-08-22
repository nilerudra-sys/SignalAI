-- digest_events.change_summary holds the one-sentence headline of what
-- changed; why_it_matters holds the separate 1-2 sentence explanation of why
-- it's worth a founder's attention. Table is empty so far, so no backfill.

alter table public.digest_events
  add column why_it_matters text not null;
