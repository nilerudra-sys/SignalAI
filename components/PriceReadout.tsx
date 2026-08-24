'use client';

import { useState } from 'react';
import { classifyPricingLines, formatPrice, type ClassifiedLine } from '@/lib/classifyPricingLines';

// Full-sentence marketing copy ("Guests are external collaborators
// outside...") reads fine at this length; a real feature tag doesn't run
// this long. Above the cutoff, a line goes behind the "longer descriptions"
// toggle instead of bulking out the default view.
const SHORT_MAX = 46;
// A real page can dedupe down to 40-60+ distinct short features — still far
// more than anyone will actually read. Show a handful as highlights by
// default, same "tuck the rest behind a toggle" pattern as long descriptions.
const FEATURE_DISPLAY_LIMIT = 8;

type PlanTile = { name: string | null; amount: string; unit: string };
type DedupedFeature = { text: string; count: number };

function isPlanLine(line: ClassifiedLine): line is Extract<ClassifiedLine, { kind: 'plan' }> {
  return line.kind === 'plan';
}

/**
 * Renders an extracted pricing-page excerpt (lib/quickCheck.ts) densely
 * instead of as a long stacked list — shared by the public landing-page
 * Quick Check widget and the dashboard's "Check prices" screen. Tiers sit
 * side by side, repeated feature lines collapse to a "×N" count, short
 * feature tags flow into columns, and full-sentence descriptions hide
 * behind a toggle so the default view stays scannable.
 */
export function PriceReadout({ excerpt }: { excerpt: string }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const lines = classifyPricingLines(excerpt);

  const introText = lines.find((l) => l.kind === 'intro')?.text;

  const allPlans: PlanTile[] = lines.filter(isPlanLine).map((line) => {
    const formatted = line.price ? formatPrice(line.price) : '';
    const match = formatted.match(/^(\$?\d[\d,.]*)\s*(.*)$/);
    // A "Recommended"/"Popular" badge glued straight onto the plan name
    // ("BusinessRecommended") is common enough to strip explicitly — left
    // in, it'd make this tile fail to dedupe against the same plan listed
    // elsewhere on the page under its plain name.
    const name = line.name?.replace(/(recommended|popular|best value)$/i, '').trim() || null;
    return {
      name,
      amount: match ? match[1] : formatted,
      unit: match ? match[2] : '',
    };
  });

  // Some sites render the same tiers twice (a card layout, then a full
  // comparison table further down) — often with slightly different unit
  // wording each time ("per member / month" vs "per seat/month" for the
  // same $10). Keying on name+amount only (not unit) still can't collide
  // for two genuinely different tiers, and actually catches the duplicate.
  const seenPlans = new Set<string>();
  const plans = allPlans.filter((p) => {
    const key = `${p.name?.trim().toLowerCase() ?? ''}|${p.amount}`;
    if (seenPlans.has(key)) return false;
    seenPlans.add(key);
    return true;
  });

  // Plan descriptions and feature bullets are both just "detail lines" —
  // pool them together, dedupe (case-insensitive), then split by length.
  const rawTexts = lines
    .filter((l) => l.kind === 'feature' || l.kind === 'description')
    .map((l) => l.text);

  const seen = new Map<string, DedupedFeature>();
  for (const text of rawTexts) {
    const key = text.trim().toLowerCase();
    const existing = seen.get(key);
    seen.set(key, { text: text.trim(), count: (existing?.count ?? 0) + 1 });
  }
  const deduped = [...seen.values()];

  const shortFeatures = deduped
    .filter((f) => f.text.length <= SHORT_MAX)
    .map((f) => ({ text: f.text.replace(/\.$/, ''), count: f.count }));
  const longFeatures = deduped.filter((f) => f.text.length > SHORT_MAX).map((f) => f.text);

  const hiddenFeatureCount = Math.max(shortFeatures.length - FEATURE_DISPLAY_LIMIT, 0);
  const visibleShortFeatures =
    featuresOpen || hiddenFeatureCount === 0
      ? shortFeatures
      : shortFeatures.slice(0, FEATURE_DISPLAY_LIMIT);

  return (
    <div className="flex flex-col gap-3">
      {introText && <p className="text-[12.5px] leading-relaxed text-slate">{introText}</p>}

      {plans.length > 0 && (
        <div
          className="grid divide-x divide-hairline-soft overflow-hidden rounded-lg border border-hairline-soft"
          style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}
        >
          {plans.map((p, i) => (
            <div key={i} className="flex min-w-0 flex-col gap-1 px-3.5 py-2.5">
              {p.name && (
                <span className="truncate font-mono text-[10px] uppercase tracking-wide text-slate-dim">
                  {p.name}
                </span>
              )}
              <span className="flex items-baseline gap-1">
                <span className="text-[19px] font-semibold tracking-tight text-graphite">
                  {p.amount}
                </span>
                {p.unit && <span className="truncate text-[11px] text-slate-dim">{p.unit}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {shortFeatures.length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-slate-dim">
            {hiddenFeatureCount > 0 && !featuresOpen
              ? `${FEATURE_DISPLAY_LIMIT} of ${shortFeatures.length} features`
              : `${shortFeatures.length} feature${shortFeatures.length === 1 ? '' : 's'} found`}
          </div>
          <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            {visibleShortFeatures.map((f, i) => (
              <div key={i} className="flex min-w-0 items-baseline gap-1.5">
                <span className="mt-[-2px] h-1 w-1 shrink-0 rounded-full bg-moss" />
                <span className="min-w-0 truncate text-[12.5px] leading-relaxed text-graphite-soft">
                  {f.text}
                </span>
                {f.count > 1 && (
                  <span className="shrink-0 font-mono text-[10.5px] text-slate-faint">
                    ×{f.count}
                  </span>
                )}
              </div>
            ))}
          </div>
          {hiddenFeatureCount > 0 && (
            <button
              type="button"
              onClick={() => setFeaturesOpen((v) => !v)}
              className="mt-2 font-mono text-[10px] uppercase tracking-wide text-cobalt"
            >
              {featuresOpen ? '− show fewer' : `+ ${hiddenFeatureCount} more`}
            </button>
          )}
        </div>
      )}

      {longFeatures.length > 0 && (
        <div className="border-t border-hairline-soft pt-2.5">
          <button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-wide text-slate-dim"
          >
            {notesOpen ? '−' : '+'} {notesOpen ? 'hide' : 'show'} {longFeatures.length} longer
            description{longFeatures.length === 1 ? '' : 's'}
          </button>
          {notesOpen && (
            <div className="mt-2 flex flex-col gap-1.5">
              {longFeatures.map((text, i) => (
                <p key={i} className="text-balance text-[12px] leading-relaxed text-slate">
                  {text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
