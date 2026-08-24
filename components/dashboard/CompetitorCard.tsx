'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Competitor, DigestEvent, ScrapeAttempt } from '@/types/competitor';
import { categoryFor, QUEUED_CATEGORY } from '@/lib/changeCategory';
import { hostnameOf as hostname } from '@/lib/hostname';
import { relativeTime, shortDate } from '@/lib/relativeTime';

type SourceStatus = {
  text: string;
  failed: boolean;
  title?: string;
};

function statusFor(checkedAt: string | null, lastAttempt: ScrapeAttempt | null): SourceStatus {
  const attemptIsNewer =
    lastAttempt && (!checkedAt || new Date(lastAttempt.attempted_at) > new Date(checkedAt));

  if (lastAttempt && lastAttempt.status === 'error' && attemptIsNewer) {
    return {
      text: `check failed ${relativeTime(lastAttempt.attempted_at)}`,
      failed: true,
      title: lastAttempt.error_message ?? undefined,
    };
  }

  if (!checkedAt) {
    return { text: 'not checked yet', failed: false };
  }

  return { text: relativeTime(checkedAt), failed: false };
}

type SourceRow = { label: string; value: string; status: SourceStatus | null };

export function CompetitorCard({
  competitor,
  latestEvent,
  pricingCheckedAt,
  changelogCheckedAt,
  pricingLastAttempt,
  changelogLastAttempt,
  snapshotCount,
  onDeleted,
}: {
  competitor: Competitor;
  latestEvent: DigestEvent | null;
  pricingCheckedAt: string | null;
  changelogCheckedAt: string | null;
  pricingLastAttempt: ScrapeAttempt | null;
  changelogLastAttempt: ScrapeAttempt | null;
  snapshotCount: number;
  onDeleted: (competitorId: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const queued = snapshotCount === 0;
  const category = queued ? QUEUED_CATEGORY : categoryFor(latestEvent?.change_type);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);

    const supabase = createClient();
    const { error } = await supabase.from('competitors').delete().eq('id', competitor.id);

    if (error) {
      setDeleting(false);
      setConfirming(false);
      setDeleteError(error.message);
      return;
    }

    onDeleted(competitor.id);
  }

  const sources: SourceRow[] = [
    { label: 'Website', value: hostname(competitor.website_url), status: null },
    {
      label: 'Pricing',
      value: hostname(competitor.pricing_page_url),
      status: statusFor(pricingCheckedAt, pricingLastAttempt),
    },
    competitor.changelog_url
      ? {
          label: 'Changelog',
          value: hostname(competitor.changelog_url),
          status: statusFor(changelogCheckedAt, changelogLastAttempt),
        }
      : { label: 'Changelog', value: 'Not set', status: null },
  ];

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-hairline-card bg-paper-surface">
      <div className="flex items-baseline justify-between gap-3 px-4 pb-3.5 pt-4">
        <div className="min-w-0">
          <div className="truncate text-[15.5px] font-semibold tracking-tight text-graphite">
            {competitor.name}
          </div>
          <a
            href={competitor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate font-mono text-[11.5px] text-slate-dim hover:text-cobalt"
          >
            {hostname(competitor.website_url)}
          </a>
        </div>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-0.5 text-[11.5px] text-slate">Delete?</span>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="rounded px-2 py-1 text-[11.5px] font-medium text-slate-dim transition-colors hover:text-graphite disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded bg-rose px-2 py-1 text-[11.5px] font-medium text-white disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className={`rounded px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wide ${category.tagBg} ${category.tagFg}`}
            >
              {category.label}
            </span>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Delete ${competitor.name}`}
              title="Delete competitor"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-faint transition-colors hover:bg-rose-tint hover:text-rose"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2.5 4.5H13.5M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M12.5 4.5L12 13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1L3.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.5 7.5V11M9.5 7.5V11"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {deleteError && (
        <p className="px-4 pb-2 text-[12px] text-rose">Couldn&rsquo;t delete: {deleteError}</p>
      )}

      {queued && !deleteError && (
        <p className="px-4 pb-2.5 text-[12px] text-cobalt-tint-text">
          First check pending — runs next time the scraper does.
        </p>
      )}

      <div className="flex flex-col gap-1 px-4 pb-3.5">
        {sources.map((s) => (
          <div key={s.label} className="grid grid-cols-[66px_1fr_auto] items-baseline gap-2.5 text-[12.5px]">
            <span className="text-slate-faint">{s.label}</span>
            <span className="min-w-0 truncate font-mono text-[11.5px] text-graphite-soft">
              {s.value}
            </span>
            <span
              className={`font-mono text-[10.5px] ${s.status?.failed ? 'text-rose' : 'text-slate-faint'}`}
              title={s.status?.title}
            >
              {s.value === 'Not set' ? '—' : (s.status?.text ?? '—')}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-hairline-soft px-4 py-2 font-mono text-[10.5px] text-slate-faint">
        <span>added {shortDate(competitor.created_at)}</span>
        <span>
          {snapshotCount} snapshot{snapshotCount === 1 ? '' : 's'} recorded
        </span>
      </div>

      <div className={`mt-auto flex items-start gap-2.5 border-t border-hairline-soft px-4 py-3 ${category.footBg}`}>
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${category.dot}`} />
        <div className="min-w-0">
          <div className="text-balance text-[13.5px] leading-relaxed text-graphite">
            {latestEvent
              ? latestEvent.change_summary
              : queued
                ? 'Not checked yet'
                : 'No changes detected yet'}
          </div>
          <div className="mt-1 font-mono text-[10.5px] text-slate-faint">
            {latestEvent ? `detected ${relativeTime(latestEvent.detected_at)}` : queued ? 'queued' : 'watching'}
          </div>
        </div>
      </div>
    </div>
  );
}
