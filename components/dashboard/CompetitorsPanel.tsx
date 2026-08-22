'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { relativeTime, nextMonday7am } from '@/lib/relativeTime';
import type { Competitor, DigestEvent, Snapshot } from '@/types/competitor';
import { AddCompetitorModal } from './AddCompetitorModal';
import { CompetitorCard } from './CompetitorCard';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function CompetitorsPanel({
  userId,
  initialCompetitors,
  digestEvents,
  snapshots,
  competitorLimit,
}: {
  userId: string;
  initialCompetitors: Competitor[];
  digestEvents: DigestEvent[];
  snapshots: Snapshot[];
  competitorLimit: number;
}) {
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [modalOpen, setModalOpen] = useState(false);

  const atLimit = competitors.length >= competitorLimit;

  const latestEventByCompetitor = useMemo(() => {
    const map = new Map<string, DigestEvent>();
    // digestEvents is already ordered detected_at desc, so the first hit per
    // competitor is the latest.
    for (const event of digestEvents) {
      if (!map.has(event.competitor_id)) map.set(event.competitor_id, event);
    }
    return map;
  }, [digestEvents]);

  const latestSnapshotByCompetitor = useMemo(() => {
    const map = new Map<string, { pricing: string | null; changelog: string | null }>();
    for (const snap of snapshots) {
      const entry = map.get(snap.competitor_id) ?? { pricing: null, changelog: null };
      if (!entry[snap.page_type]) entry[snap.page_type] = snap.scraped_at;
      map.set(snap.competitor_id, entry);
    }
    return map;
  }, [snapshots]);

  const stats = useMemo(() => {
    const changesThisWeek = digestEvents.filter(
      (e) => Date.now() - new Date(e.detected_at).getTime() <= WEEK_MS,
    ).length;
    const lastCheck = snapshots.length > 0 ? relativeTime(snapshots[0].scraped_at) : 'Never';

    return [
      { label: 'Tracked', value: `${competitors.length} of ${competitorLimit}` },
      { label: 'Changes this week', value: String(changesThisWeek) },
      { label: 'Last check', value: lastCheck },
      { label: 'Next digest', value: nextMonday7am() },
    ];
  }, [competitors.length, competitorLimit, digestEvents, snapshots]);

  const recentActivity = useMemo(() => digestEvents.slice(0, 5), [digestEvents]);
  const competitorNameById = useMemo(
    () => new Map(competitors.map((c) => [c.id, c.name])),
    [competitors],
  );

  function handleCreated(competitor: Competitor) {
    setCompetitors((prev) => [competitor, ...prev]);
    setModalOpen(false);
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-14 pt-6 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-graphite">
            Your competitors
          </h1>
          <p className="mt-1.5 text-[13.5px] text-slate">
            {competitors.length === 0
              ? `Nothing tracked yet — ${competitorLimit} slot${competitorLimit === 1 ? '' : 's'} on your plan.`
              : `${competitors.length} tracked · digest sends Monday 07:00`}
          </p>
        </div>
        {!atLimit && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="shrink-0 rounded-lg bg-cobalt px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Add competitor
          </button>
        )}
      </div>

      <div className="mt-[18px] grid grid-cols-2 overflow-hidden rounded-[10px] border border-hairline bg-paper-surface sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-r border-hairline-soft px-4 py-3.5 last:border-r-0">
            <div className="font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
              {s.label}
            </div>
            <div className="mt-1.5 text-base font-semibold tracking-tight text-graphite">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {atLimit && (
        <div className="mt-4 flex flex-col gap-2 rounded-[10px] border border-cobalt-tint-border bg-cobalt-tint px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13.5px] text-cobalt-tint-text">
            You&rsquo;re tracking {competitors.length} of {competitorLimit} competitor
            {competitorLimit === 1 ? '' : 's'} allowed on your plan. Upgrade to watch your whole
            set and ask questions across past digests.
          </p>
          <Link href="/#pricing" className="shrink-0 text-[13.5px] font-medium text-cobalt">
            View plans &rarr;
          </Link>
        </div>
      )}

      {competitors.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-hairline-card bg-paper-raised px-6 py-12 text-center sm:py-14">
          <div className="font-mono text-[11px] uppercase tracking-wide text-slate-faint">
            Nothing tracked
          </div>
          <h2 className="mt-3 text-[19px] font-semibold tracking-tight text-graphite">
            Add your first competitor
          </h2>
          <p className="mx-auto mt-2 max-w-[44ch] text-balance text-sm leading-relaxed text-slate">
            Give us a name and their pricing page. We start checking within the hour and your
            first digest lands the next Monday.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-[18px] rounded-lg bg-cobalt px-[18px] py-2.5 text-sm font-medium text-white"
          >
            Add competitor
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {competitors.map((competitor) => {
            const snap = latestSnapshotByCompetitor.get(competitor.id);
            return (
              <CompetitorCard
                key={competitor.id}
                competitor={competitor}
                latestEvent={latestEventByCompetitor.get(competitor.id) ?? null}
                pricingCheckedAt={snap?.pricing ?? null}
                changelogCheckedAt={snap?.changelog ?? null}
              />
            );
          })}
        </div>
      )}

      <div className="mt-[26px] border-t border-hairline pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <h2 className="text-[15px] font-semibold tracking-tight text-graphite">
            This week so far
          </h2>
          <span className="font-mono text-[11.5px] text-slate-dim">
            next digest &middot; {nextMonday7am()}, 07:00
          </span>
        </div>

        <div className="mt-2.5 overflow-hidden rounded-[10px] border border-hairline bg-paper-surface">
          {recentActivity.length === 0 ? (
            <div className="px-4 py-4 text-[13.5px] text-slate">
              Nothing to report yet. Add a competitor and this fills up on its own.
            </div>
          ) : (
            recentActivity.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-[78px_1fr_auto] items-baseline gap-3 border-b border-hairline-soft px-4 py-2.5 text-[13.5px] last:border-b-0"
              >
                <span className="font-mono text-[11.5px] text-slate-faint">
                  {relativeTime(event.detected_at)}
                </span>
                <span className="min-w-0 text-balance text-graphite-soft">
                  {competitorNameById.get(event.competitor_id) ?? 'Unknown'} —{' '}
                  {event.change_summary}
                </span>
                <span className="shrink-0 rounded bg-hairline-soft px-1.5 py-0.5 font-mono text-[10.5px] uppercase text-slate-dim">
                  {event.change_type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {modalOpen && (
        <AddCompetitorModal
          userId={userId}
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
