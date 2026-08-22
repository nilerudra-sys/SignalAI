import type { Competitor, DigestEvent } from '@/types/competitor';
import { categoryFor } from '@/lib/changeCategory';
import { relativeTime } from '@/lib/relativeTime';

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

type SourceRow = { label: string; value: string; checkedAt: string | null };

export function CompetitorCard({
  competitor,
  latestEvent,
  pricingCheckedAt,
  changelogCheckedAt,
}: {
  competitor: Competitor;
  latestEvent: DigestEvent | null;
  pricingCheckedAt: string | null;
  changelogCheckedAt: string | null;
}) {
  const category = categoryFor(latestEvent?.change_type);

  const sources: SourceRow[] = [
    { label: 'Website', value: hostname(competitor.website_url), checkedAt: null },
    { label: 'Pricing', value: hostname(competitor.pricing_page_url), checkedAt: pricingCheckedAt },
    competitor.changelog_url
      ? { label: 'Changelog', value: hostname(competitor.changelog_url), checkedAt: changelogCheckedAt }
      : { label: 'Changelog', value: 'Not set', checkedAt: null },
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
        <span
          className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wide ${category.tagBg} ${category.tagFg}`}
        >
          {category.label}
        </span>
      </div>

      <div className="flex flex-col gap-1 px-4 pb-3.5">
        {sources.map((s) => (
          <div key={s.label} className="grid grid-cols-[66px_1fr_auto] items-baseline gap-2.5 text-[12.5px]">
            <span className="text-slate-faint">{s.label}</span>
            <span className="min-w-0 truncate font-mono text-[11.5px] text-graphite-soft">
              {s.value}
            </span>
            <span className="font-mono text-[10.5px] text-slate-faint">
              {s.value === 'Not set' || s.label === 'Website' ? '—' : relativeTime(s.checkedAt)}
            </span>
          </div>
        ))}
      </div>

      <div className={`mt-auto flex items-start gap-2.5 border-t border-hairline-soft px-4 py-3 ${category.footBg}`}>
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${category.dot}`} />
        <div className="min-w-0">
          <div className="text-balance text-[13.5px] leading-relaxed text-graphite">
            {latestEvent ? latestEvent.change_summary : 'No changes detected yet'}
          </div>
          <div className="mt-1 font-mono text-[10.5px] text-slate-faint">
            {latestEvent ? `detected ${relativeTime(latestEvent.detected_at)}` : 'watching'}
          </div>
        </div>
      </div>
    </div>
  );
}
