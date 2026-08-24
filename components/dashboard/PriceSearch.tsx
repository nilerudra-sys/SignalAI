'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { hostnameOf } from '@/lib/hostname';
import { PriceReadout } from '@/components/PriceReadout';
import type { Competitor } from '@/types/competitor';
import { AddCompetitorModal } from './AddCompetitorModal';

type QuickCheckResult =
  | { ok: true; domain: string; url: string; excerpt: string; truncated: boolean }
  | { ok: false; reason: 'invalid' | 'not_found' | 'blocked' | 'rate_limited'; message: string };

type DiscoverResponse =
  | { ok: true; name: string; websiteUrl: string; pricingUrl: string | null; changelogUrl: string | null }
  | { ok: false; message: string };

const EXAMPLES = ['linear.app', 'notion.so', 'vercel.com'];

export function PriceSearch({
  userId,
  trackedHostnames,
}: {
  userId: string;
  trackedHostnames: Set<string>;
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickCheckResult | null>(null);

  const [preparing, setPreparing] = useState(false);
  const [prefill, setPrefill] = useState<{
    name: string;
    websiteUrl: string;
    pricingPageUrl: string;
    changelogUrl: string;
  } | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  async function runCheck(value: string) {
    if (!value.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setJustAdded(null);

    try {
      const res = await fetch('/api/quick-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: value }),
      });
      setResult((await res.json()) as QuickCheckResult);
    } catch {
      setResult({
        ok: false,
        reason: 'blocked',
        message: 'Something went wrong checking that domain. Try again in a moment.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    runCheck(query);
  }

  async function handleTrack() {
    if (!result || !result.ok || preparing) return;
    setPreparing(true);

    try {
      const res = await fetch('/api/discover-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: result.domain }),
      });
      const data = (await res.json()) as DiscoverResponse;

      if (data.ok) {
        setPrefill({
          name: data.name,
          websiteUrl: data.websiteUrl,
          pricingPageUrl: data.pricingUrl ?? result.url,
          changelogUrl: data.changelogUrl ?? '',
        });
      } else {
        // Discovery re-check failed for some reason — fall back to what the
        // price check itself already found rather than blocking "Track."
        setPrefill({
          name: result.domain,
          websiteUrl: `https://${result.domain}`,
          pricingPageUrl: result.url,
          changelogUrl: '',
        });
      }
    } finally {
      setPreparing(false);
    }
  }

  const alreadyTracked = result?.ok ? trackedHostnames.has(result.domain) : false;

  return (
    <div className="rounded-xl border border-hairline-card bg-paper-surface p-5">
      <h2 className="text-[17px] font-semibold tracking-tight text-graphite">
        Check any competitor&rsquo;s current price
      </h2>
      <p className="mt-1.5 text-[13.5px] text-slate">
        Not tracking them yet? Search their domain to see their pricing page right now.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex max-w-[460px] flex-wrap gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-hairline-input bg-paper-surface px-3">
          <span className="shrink-0 font-mono text-[12.5px] text-slate-dim">https://</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="acme.com"
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14.5px] text-graphite outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg border border-graphite bg-graphite px-4 py-2.5 text-[14.5px] font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Checking…' : result ? 'Re-check' : 'Check price'}
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
              runCheck(ex);
            }}
            disabled={loading}
            className="rounded-full border border-hairline bg-paper-raised px-2.5 py-1 font-mono text-[11.5px] text-slate disabled:opacity-60"
          >
            {ex}
          </button>
        ))}
      </div>

      {result && (
        <div className="mt-4 overflow-hidden rounded-lg border border-hairline-card bg-paper-raised">
          <div className="flex items-center justify-between gap-3 border-b border-hairline-soft bg-paper-surface px-3.5 py-2.5">
            <span className="truncate font-mono text-[11.5px] text-slate">
              {result.ok ? result.url : 'not found'}
            </span>
            {result.ok && <span className="shrink-0 font-mono text-[11px] text-slate-dim">just now</span>}
          </div>

          <div className="max-h-[420px] overflow-y-auto px-3.5 py-4">
            {!result.ok && <p className="text-[13px] leading-relaxed text-rose">{result.message}</p>}
            {result.ok && <PriceReadout key={result.url} excerpt={result.excerpt} />}
          </div>

          {result.ok && (
            <div className="flex items-center justify-between gap-3 border-t border-hairline-soft px-3.5 py-3">
              {alreadyTracked ? (
                <span className="text-[13px] text-slate">You&rsquo;re already tracking this one.</span>
              ) : justAdded === result.domain ? (
                <span className="text-[13px] text-moss">
                  Added — see it on your{' '}
                  <Link href="/dashboard" className="font-medium underline">
                    dashboard
                  </Link>
                  .
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleTrack}
                  disabled={preparing}
                  className="rounded-lg bg-cobalt px-3.5 py-2 text-[13px] font-medium text-white disabled:opacity-60"
                >
                  {preparing ? 'Preparing…' : 'Track this competitor'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {prefill && (
        <AddCompetitorModal
          userId={userId}
          initial={{
            name: prefill.name,
            websiteUrl: prefill.websiteUrl,
            pricingPageUrl: prefill.pricingPageUrl,
            changelogUrl: prefill.changelogUrl,
          }}
          onClose={() => setPrefill(null)}
          onCreated={(competitor: Competitor) => {
            setJustAdded(hostnameOf(competitor.website_url));
            setPrefill(null);
          }}
        />
      )}
    </div>
  );
}
