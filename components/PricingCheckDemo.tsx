'use client';

import { useState, type FormEvent } from 'react';

const EXAMPLES = ['acmeanalytics.com', 'chartline.io', 'northstarmetrics.com'];

const RESULT_TIERS = [
  { name: 'Starter', price: '$19', note: 'per user / mo · 3 seats max', color: 'text-graphite' },
  { name: 'Pro', price: '$59', note: 'was $49 — raised Aug 14', color: 'text-rose' },
  { name: 'Enterprise', price: 'Call', note: 'SSO, audit log, SLA', color: 'text-graphite' },
];

export function PricingCheckDemo() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const domain = query.trim() || 'acmeanalytics.com';

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearched(true);
  }

  return (
    <section className="border-b border-hairline bg-paper-surface">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-8 px-6 py-12 sm:px-8 sm:py-14 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="text-[22px] font-semibold tracking-tight text-graphite sm:text-[28px]">
            Check a company&rsquo;s pricing page instantly
          </h2>
          <p className="mt-2.5 max-w-[46ch] text-balance text-[15px] leading-relaxed text-slate">
            Paste a domain. Signal finds the pricing page, reads the plans, and shows you the
            current tiers — no account needed.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 flex max-w-[460px] flex-wrap gap-2">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-hairline-input bg-paper-surface px-3">
              <span className="shrink-0 font-mono text-[12.5px] text-slate-dim">https://</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="acmeanalytics.com"
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14.5px] text-graphite outline-none"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-graphite bg-graphite px-4 py-2.5 text-[14.5px] font-medium text-white"
            >
              {searched ? 'Re-check' : 'Read pricing'}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[12.5px] text-slate-dim">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQuery(ex);
                  setSearched(true);
                }}
                className="rounded-full border border-hairline bg-paper-raised px-2.5 py-1 font-mono text-[11.5px] text-slate"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-hairline-card bg-paper-raised">
          <div className="flex items-center justify-between gap-3 border-b border-hairline-soft bg-paper-surface px-3.5 py-2.5">
            <span className="truncate font-mono text-[11.5px] text-slate">
              https://{domain}/pricing
            </span>
            <span className="shrink-0 font-mono text-[11px] text-slate-dim">
              {searched ? 'read 0.9s ago' : 'not checked yet'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {RESULT_TIERS.map((t) => (
              <div
                key={t.name}
                className="border-b border-r border-hairline-soft p-3.5 last:border-r-0"
              >
                <div className="text-[12.5px] text-slate">{t.name}</div>
                <div className={`mt-1 font-mono text-xl font-semibold tracking-tight ${t.color}`}>
                  {t.price}
                </div>
                <div className="mt-1.5 text-xs leading-snug text-slate-dim">{t.note}</div>
              </div>
            ))}
          </div>
          <div className="px-3.5 py-3 text-[13px] leading-relaxed text-graphite-soft">
            Pro moved from $49 to $59 nine days ago. Track this page and we&rsquo;ll tell you the
            next time it moves.
          </div>
        </div>
      </div>
    </section>
  );
}
