// Everyone is on the free plan for now — no billing/plans system yet.
// Keep this in sync with the default in
// supabase/migrations/20260825000000_raise_free_plan_limit_to_two.sql,
// which enforces the same limit at the database level.
export const FREE_PLAN_COMPETITOR_LIMIT = 2;
