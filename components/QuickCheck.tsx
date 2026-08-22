'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

const EXAMPLES = ['linear.app', 'notion.so', 'vercel.com'];

type QuickCheckResult =
  | { ok: true; domain: string; url: string; excerpt: string; truncated: boolean }
  | { ok: false; reason: 'invalid' | 'not_found' | 'blocked' | 'rate_limited'; message: string };

export function QuickCheck() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickCheckResult | null>(null);

  async function runCheck(value: string) {
    if (!value.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/quick-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: value }),
      });
      const data = (await res.json()) as QuickCheckResult;
      setResult(data);
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

  return (
    <section className="border-b border-hairline bg-paper-surface">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-8 px-6 py-12 sm:px-8 sm:py-14 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="text-[22px] font-semibold tracking-tight text-graphite sm:text-[28px]">
            Check a company&rsquo;s pricing page instantly
          </h2>
          <p className="mt-2.5 max-w-[46ch] text-balance text-[15px] leading-relaxed text-slate">
            Enter a domain. We&rsquo;ll do a live check of their pricing page right now — no
            account needed.
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
              {loading ? 'Checking…' : result ? 'Re-check' : 'Check pricing'}
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
        </div>

        <div className="min-w-0">
          <div className="overflow-hidden rounded-xl border border-hairline-card bg-paper-raised">
            <div className="flex items-center justify-between gap-3 border-b border-hairline-soft bg-paper-surface px-3.5 py-2.5">
              <span className="truncate font-mono text-[11.5px] text-slate">
                {result?.ok ? result.url : loading ? 'checking…' : 'not checked yet'}
              </span>
              {result?.ok && (
                <span className="shrink-0 font-mono text-[11px] text-slate-dim">just now</span>
              )}
            </div>

            <div className="px-3.5 py-4">
              {!result && !loading && (
                <p className="text-[13px] leading-relaxed text-slate-dim">
                  Results will show up here.
                </p>
              )}
              {loading && (
                <p className="text-[13px] leading-relaxed text-slate-dim">
                  Reading their pricing page&hellip;
                </p>
              )}
              {result && !result.ok && (
                <p className="text-[13px] leading-relaxed text-rose">{result.message}</p>
              )}
              {result?.ok && (
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-graphite-soft">
                  {result.excerpt}
                </p>
              )}
            </div>
          </div>

          {result && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cobalt-tint-border bg-cobalt-tint px-4 py-3.5">
              <p className="text-[13.5px] text-cobalt-tint-text">
                Track this automatically &mdash; get a weekly digest instead of checking by hand.
              </p>
              <Link
                href="/signup"
                className="shrink-0 rounded-lg bg-cobalt px-3.5 py-2 text-[13px] font-medium text-white"
              >
                Sign up free
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
