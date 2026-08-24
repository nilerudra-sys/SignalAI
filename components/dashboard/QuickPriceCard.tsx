'use client';

import { useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { PriceReadout } from '@/components/PriceReadout';

type QuickCheckResult =
  | { ok: true; domain: string; url: string; excerpt: string; truncated: boolean }
  | { ok: false; reason: 'invalid' | 'not_found' | 'blocked' | 'rate_limited'; message: string };

export function QuickPriceCard() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickCheckResult | null>(null);

  async function runCheck() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/quick-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: query }),
      });
      setResult((await res.json()) as QuickCheckResult);
    } catch {
      setResult({
        ok: false,
        reason: 'blocked',
        message: 'Something went wrong. Try again in a moment.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCheck();
    }
  }

  return (
    <div className="max-w-[480px] rounded-xl border border-hairline bg-paper-surface p-[18px]">
      <div className="font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
        Don&rsquo;t wait for Monday
      </div>
      <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-graphite">
        Check any pricing page now
      </h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate">
        One-off read of a live pricing page. Doesn&rsquo;t use a watchlist slot.
      </p>

      <div className="mt-3.5 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="competitor.com"
          className="min-w-0 flex-1 rounded-lg border border-hairline-input bg-paper-surface px-3 py-2.5 text-[13.5px] text-graphite outline-none focus:border-cobalt"
        />
        <button
          type="button"
          onClick={runCheck}
          disabled={loading}
          className="shrink-0 rounded-lg border border-hairline-card bg-paper-raised px-3.5 py-2.5 text-[13.5px] font-medium text-graphite disabled:opacity-60"
        >
          {loading ? 'Reading…' : 'Check'}
        </button>
      </div>

      {result && (
        <div className="mt-3.5 overflow-hidden rounded-lg border border-hairline-soft">
          <div className="border-b border-hairline-soft bg-paper-raised px-3 py-2 font-mono text-[11px] text-slate">
            {result.ok ? `${result.url} · read just now` : 'not found'}
          </div>
          <div className="max-h-[320px] overflow-y-auto px-3 py-3">
            {!result.ok && <p className="text-[13px] leading-relaxed text-rose">{result.message}</p>}
            {result.ok && <PriceReadout key={result.url} excerpt={result.excerpt} />}
          </div>
        </div>
      )}

      <Link href="/dashboard/prices" className="mt-3.5 inline-block text-[13px] font-medium text-cobalt">
        Full price search &rarr;
      </Link>
    </div>
  );
}
