'use client';

import { useId, useState, type FormEvent } from 'react';

export function ClosingSignup() {
  const inputId = useId();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'closing' }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };

      if (!data.ok) {
        setError(data.message ?? 'Something went wrong. Try again.');
        return;
      }

      setSubmitted(true);
      setEmail('');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="waitlist" className="scroll-mt-16 border-b border-hairline bg-graphite text-paper">
      <div className="mx-auto grid max-w-[1000px] grid-cols-1 items-center gap-8 px-7 py-14 sm:py-16 md:grid-cols-2">
        <div className="min-w-0">
          <h2 className="max-w-[18ch] text-balance text-[28px] font-semibold leading-[1.08] tracking-tight text-white sm:text-[38px]">
            Stop checking competitor sites by hand
          </h2>
          <p className="mt-3.5 max-w-[42ch] text-balance text-[15.5px] leading-relaxed text-slate-faint">
            Watching more than two competitors? Join the waitlist for the paid plan — track your
            whole competitive set, plus AI chat across every past digest — and lock in early
            pricing before it opens.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <label htmlFor={inputId} className="sr-only">
              Email address
            </label>
            <input
              id={inputId}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourstartup.com"
              className="min-w-[200px] flex-1 rounded-lg border border-graphite-soft bg-[#22262a] px-3.5 py-3 text-[14.5px] text-white outline-none placeholder:text-slate-faint focus:border-slate"
            />
            <button
              type="submit"
              disabled={submitting}
              className="shrink-0 rounded-lg bg-paper px-5 py-3 text-[14.5px] font-medium text-graphite transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Joining…' : 'Get the digest'}
            </button>
          </div>
          <p className={`text-[12.5px] ${error ? 'text-rose-tint' : 'text-slate-faint'}`}>
            {error ??
              (submitted
                ? "You're on the list — we'll email you when the paid plan opens."
                : "No spam — we'll only email you when the paid plan opens.")}
          </p>
        </form>
      </div>
    </section>
  );
}
