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
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    // No backend yet — record the intent locally so it's visible during development.
    console.log('[signal] waitlist signup', { email, source, at: new Date().toISOString() });

    setSubmitted(true);
    setEmail('');
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
          className={`shrink-0 rounded-lg px-5 py-3 text-[14.5px] font-medium text-white transition-opacity hover:opacity-90 ${
            variant === 'accent' ? 'bg-cobalt' : 'bg-graphite'
          }`}
        >
          Join the waitlist
        </button>
      </form>
      <p className="text-[12.5px] text-slate-dim">
        {submitted
          ? "You're on the list — we'll email you when Signal opens up."
          : 'Free while in beta. One email a week, no other mail, ever.'}
      </p>
    </div>
  );
}
