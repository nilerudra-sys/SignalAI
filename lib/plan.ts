// Everyone is on the free plan for now — no billing/plans system yet.
// Keep this in sync with the hardcoded limit in
// supabase/migrations/20260821220000_enforce_free_plan_competitor_limit.sql,
// which enforces the same limit at the database level.
export const FREE_PLAN_COMPETITOR_LIMIT = 1;
