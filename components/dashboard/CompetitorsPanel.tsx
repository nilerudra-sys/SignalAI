'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { relativeTime, nextMonday7am } from '@/lib/relativeTime';
import { hostnameOf } from '@/lib/hostname';
import type { Competitor, DigestEvent, ScrapeAttempt, Snapshot } from '@/types/competitor';
import { AddCompetitorModal } from './AddCompetitorModal';
import { CompetitorCard } from './CompetitorCard';
import { QuickPriceCard } from './QuickPriceCard';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SAME_CHECK_WINDOW_MS = 5 * 60 * 1000;
const ACTIVITY_LIMIT = 8;

type ActivityItem = {
  id: string;
  timestamp: string;
  kind: 'change' | 'checked' | 'failed';
  competitorName: string;
  text: string;
  badge: string;
  badgeTone: 'change' | 'neutral' | 'error';
};

export function CompetitorsPanel({
  userId,
  userEmail,
  initialCompetitors,
  digestEvents,
  snapshots,
  scrapeAttempts,
  competitorLimit,
}: {
  userId: string;
  userEmail: string;
  initialCompetitors: Competitor[];
  digestEvents: DigestEvent[];
  snapshots: Snapshot[];
  scrapeAttempts: ScrapeAttempt[];
  competitorLimit: number;
}) {
  const router = useRouter();
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [modalOpen, setModalOpen] = useState(false);

  const atLimit = competitors.length >= competitorLimit;
  const slotsFree = competitorLimit - competitors.length;

  const competitorById = useMemo(() => new Map(competitors.map((c) => [c.id, c])), [competitors]);

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

  const snapshotCountByCompetitor = useMemo(() => {
    const map = new Map<string, number>();
    for (const snap of snapshots) {
      map.set(snap.competitor_id, (map.get(snap.competitor_id) ?? 0) + 1);
    }
    return map;
  }, [snapshots]);

  const latestAttemptByCompetitor = useMemo(() => {
    const map = new Map<string, { pricing: ScrapeAttempt | null; changelog: ScrapeAttempt | null }>();
    // scrapeAttempts is already ordered attempted_at desc.
    for (const attempt of scrapeAttempts) {
      const entry = map.get(attempt.competitor_id) ?? { pricing: null, changelog: null };
      if (!entry[attempt.page_type]) entry[attempt.page_type] = attempt;
      map.set(attempt.competitor_id, entry);
    }
    return map;
  }, [scrapeAttempts]);

  const stats = useMemo(() => {
    const changesThisWeek = digestEvents.filter(
      (e) => Date.now() - new Date(e.detected_at).getTime() <= WEEK_MS,
    ).length;
    const lastCheck = snapshots.length > 0 ? relativeTime(snapshots[0].scraped_at) : 'Never';

    return [
      {
        label: 'Tracked',
        value: `${competitors.length} of ${competitorLimit}`,
        note: slotsFree >= 0 ? `${slotsFree} slot${slotsFree === 1 ? '' : 's'} free` : 'over limit',
      },
      { label: 'Changes this week', value: String(changesThisWeek), note: '' },
      { label: 'Last check', value: lastCheck, note: '' },
      { label: 'Next digest', value: nextMonday7am(), note: '07:00 UTC' },
    ];
  }, [competitors.length, competitorLimit, slotsFree, digestEvents, snapshots]);

  // Total pages actually being watched (pricing always, changelog only when set).
  const totalPages = useMemo(
    () => competitors.reduce((n, c) => n + 1 + (c.changelog_url ? 1 : 0), 0),
    [competitors],
  );

  const setupSteps = useMemo(
    () => [
      {
        title: 'Competitors added',
        detail: `${competitors.length} compan${competitors.length === 1 ? 'y' : 'ies'}, ${totalPages} page${totalPages === 1 ? '' : 's'}`,
        dot: 'bg-moss',
      },
      {
        title: 'Baseline snapshot',
        detail: 'runs next time the scraper runs',
        dot: 'bg-cobalt',
      },
      {
        title: 'First digest',
        detail: `${nextMonday7am()}, 07:00 UTC`,
        dot: 'bg-slate-faint',
      },
    ],
    [competitors.length, totalPages],
  );

  const showSetupBanner = competitors.length > 0 && snapshots.length === 0;

  // A successful scrape_attempts row that led directly to a digest_event
  // (same competitor, timestamps within a few minutes — they're written in
  // the same script run) is already represented by that change entry; don't
  // also show it as a separate "no changes" line.
  const changeTimestampsByCompetitor = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const event of digestEvents) {
      const list = map.get(event.competitor_id) ?? [];
      list.push(new Date(event.detected_at).getTime());
      map.set(event.competitor_id, list);
    }
    return map;
  }, [digestEvents]);

  const activity = useMemo<ActivityItem[]>(() => {
    const changeItems: ActivityItem[] = digestEvents.map((event) => ({
      id: `change-${event.id}`,
      timestamp: event.detected_at,
      kind: 'change',
      competitorName: competitorById.get(event.competitor_id)?.name ?? 'Unknown',
      text: event.change_summary,
      badge: event.change_type,
      badgeTone: 'change',
    }));

    const checkedItems: ActivityItem[] = [];
    const failedItems: ActivityItem[] = [];

    for (const attempt of scrapeAttempts) {
      const competitor = competitorById.get(attempt.competitor_id);
      const url = attempt.page_type === 'pricing' ? competitor?.pricing_page_url : competitor?.changelog_url;
      const source = `${hostnameOf(url) || 'source'} ${attempt.page_type}`;

      if (attempt.status === 'error') {
        failedItems.push({
          id: `failed-${attempt.id}`,
          timestamp: attempt.attempted_at,
          kind: 'failed',
          competitorName: competitor?.name ?? 'Unknown',
          text: `Failed to check ${source}${attempt.error_message ? ` — ${attempt.error_message}` : ''}`,
          badge: 'failed',
          badgeTone: 'error',
        });
        continue;
      }

      const attemptTime = new Date(attempt.attempted_at).getTime();
      const nearbyChange = (changeTimestampsByCompetitor.get(attempt.competitor_id) ?? []).some(
        (t) => Math.abs(t - attemptTime) < SAME_CHECK_WINDOW_MS,
      );
      if (nearbyChange) continue;

      checkedItems.push({
        id: `checked-${attempt.id}`,
        timestamp: attempt.attempted_at,
        kind: 'checked',
        competitorName: competitor?.name ?? 'Unknown',
        text: `Checked ${source} — no changes`,
        badge: 'checked',
        badgeTone: 'neutral',
      });
    }

    return [...changeItems, ...checkedItems, ...failedItems]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, ACTIVITY_LIMIT);
  }, [digestEvents, scrapeAttempts, competitorById, changeTimestampsByCompetitor]);

  function handleCreated(competitor: Competitor) {
    setCompetitors((prev) => [competitor, ...prev]);
    setModalOpen(false);
  }

  function handleDeleted(competitorId: string) {
    setCompetitors((prev) => prev.filter((c) => c.id !== competitorId));
    router.refresh();
  }

  const digestFacts = [
    { label: 'Digest goes to', value: userEmail, action: 'Change recipient' },
    { label: 'Schedule', value: 'Mondays, 07:00 UTC', action: 'Change schedule' },
    { label: 'Included', value: 'Pricing + changelog changes', action: 'Choose what counts' },
  ];

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
            className="shrink-0 rounded-lg bg-graphite px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Add competitor
          </button>
        )}
      </div>

      {showSetupBanner && (
        <div className="mt-[18px] flex flex-col gap-3.5 rounded-xl border border-cobalt-tint-border bg-cobalt-tint px-[18px] py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-wide text-cobalt-tint-text opacity-75">
                Setup status
              </div>
              <p className="mt-1.5 text-[15px] font-semibold tracking-tight text-graphite">
                Watching {competitors.length} compan{competitors.length === 1 ? 'y' : 'ies'}. Baseline
                snapshots run on the next scrape.
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11.5px] text-cobalt-tint-text">
              no changes to report until then
            </span>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border border-cobalt-tint-border bg-cobalt-tint-border sm:grid-cols-3">
            {setupSteps.map((step) => (
              <div key={step.title} className="flex flex-col gap-1.5 bg-paper-raised px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${step.dot}`} />
                  <span className="text-[13px] font-medium text-graphite">{step.title}</span>
                </div>
                <span className="font-mono text-[11px] text-slate">{step.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-[18px] grid grid-cols-2 overflow-hidden rounded-[10px] border border-hairline bg-paper-surface sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-r border-hairline-soft px-4 py-3.5 last:border-r-0">
            <div className="font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
              {s.label}
            </div>
            <div className="mt-1.5 text-base font-semibold tracking-tight text-graphite">
              {s.value}
            </div>
            {s.note && <div className="mt-0.5 font-mono text-[11px] text-slate-faint">{s.note}</div>}
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
            className="mt-[18px] rounded-lg border border-graphite px-[18px] py-2.5 text-sm font-medium text-graphite"
          >
            Add competitor
          </button>
        </div>
      ) : (
        <div className="mt-[26px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2.5">
            <h2 className="text-[15px] font-semibold tracking-tight text-graphite">Watchlist</h2>
            <span className="font-mono text-[11.5px] text-slate-dim">
              {competitors.length} of {competitorLimit} slots used
            </span>
          </div>
          <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {competitors.map((competitor) => {
              const snap = latestSnapshotByCompetitor.get(competitor.id);
              const lastAttempt = latestAttemptByCompetitor.get(competitor.id);
              return (
                <CompetitorCard
                  key={competitor.id}
                  competitor={competitor}
                  latestEvent={latestEventByCompetitor.get(competitor.id) ?? null}
                  pricingCheckedAt={snap?.pricing ?? null}
                  changelogCheckedAt={snap?.changelog ?? null}
                  pricingLastAttempt={lastAttempt?.pricing ?? null}
                  changelogLastAttempt={lastAttempt?.changelog ?? null}
                  snapshotCount={snapshotCountByCompetitor.get(competitor.id) ?? 0}
                  onDeleted={handleDeleted}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-[30px]">
        <QuickPriceCard />
      </div>

      <div className="mt-[30px] border-t border-hairline pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <h2 className="text-[15px] font-semibold tracking-tight text-graphite">
            This week so far
          </h2>
          <span className="font-mono text-[11.5px] text-slate-dim">
            next digest &middot; {nextMonday7am()}, 07:00
          </span>
        </div>

        <div className="mt-2.5 overflow-hidden rounded-[10px] border border-hairline bg-paper-surface">
          {activity.length === 0 ? (
            <div className="px-4 py-4 text-[13.5px] text-slate">
              Nothing to report yet. Add a competitor and this fills up on its own.
            </div>
          ) : (
            activity.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[96px_1fr_auto] items-baseline gap-3 border-b border-hairline-soft px-4 py-2.5 text-[13.5px] last:border-b-0"
              >
                <span className="font-mono text-[11.5px] text-slate-faint">
                  {relativeTime(item.timestamp)}
                </span>
                <span
                  className={`min-w-0 text-balance ${
                    item.kind === 'failed' ? 'text-rose' : 'text-graphite-soft'
                  }`}
                >
                  {item.competitorName} — {item.text}
                </span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10.5px] uppercase ${
                    item.badgeTone === 'error'
                      ? 'bg-rose-tint text-rose'
                      : item.badgeTone === 'neutral'
                        ? 'bg-hairline-soft text-slate-dim'
                        : 'bg-hairline-soft text-slate-dim'
                  }`}
                >
                  {item.badge}
                </span>
              </div>
            ))
          )}
        </div>
        <p className="mt-2.5 text-[12.5px] text-slate-dim">
          Checks run whenever the scraper runs — manually, or automatically every Monday. Only
          real differences become digest entries; routine checks stay in this log.
        </p>
      </div>

      <div className="mt-[34px] grid grid-cols-1 gap-4 rounded-xl border border-hairline bg-paper-raised px-[18px] py-4 sm:grid-cols-3">
        {digestFacts.map((f) => (
          <div key={f.label}>
            <div className="font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
              {f.label}
            </div>
            <div className="mt-1 truncate text-[13.5px] text-graphite">{f.value}</div>
            <Link href="/settings" className="mt-1 inline-block text-[12.5px] text-cobalt">
              {f.action}
            </Link>
          </div>
        ))}
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
