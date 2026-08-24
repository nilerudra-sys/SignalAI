'use client';

import { useId, useState, type FormEvent } from 'react';

export function SignupForm({
  source,
  variant = 'dark',
}: {
  source: string;
  variant?: 'dark' | 'accent';
}) {
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
        body: JSON.stringify({ email: email.trim(), source }),
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
    <div className="flex w-full flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
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
          className="min-w-[200px] flex-1 rounded-lg border border-hairline-input bg-paper-surface px-3.5 py-3 text-[14.5px] text-graphite outline-none placeholder:text-slate-dim focus:border-cobalt"
        />
        <button
          type="submit"
          disabled={submitting}
          className={`shrink-0 rounded-lg px-5 py-3 text-[14.5px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${
            variant === 'accent' ? 'bg-cobalt' : 'bg-graphite'
          }`}
        >
          {submitting ? 'Joining…' : 'Join the waitlist'}
        </button>
      </form>
      <p className={`text-[12.5px] ${error ? 'text-rose' : 'text-slate-dim'}`}>
        {error ??
          (submitted
            ? "You're on the list — we'll email you when Signal opens up."
            : 'Free while in beta. One email a week, no other mail, ever.')}
      </p>
    </div>
  );
}
