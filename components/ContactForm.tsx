'use client';

import { useState, type FormEvent } from 'react';

const TOPICS = ['Product question', 'Wrong reading', 'Billing & plans', 'Something else'] as const;
type Topic = (typeof TOPICS)[number];

const HINTS: Record<Topic, string> = {
  'Product question': '(what you were trying to do)',
  'Wrong reading': '(which competitor and which page)',
  'Billing & plans': '(the email on the account)',
  'Something else': '(as much or as little as you like)',
};

const PLACEHOLDERS: Record<Topic, string> = {
  'Product question':
    'I want to track a competitor whose pricing sits behind a login — is that possible?',
  'Wrong reading':
    'Last Monday’s digest said Chartline raised prices, but that row is their annual toggle.',
  'Billing & plans': 'I’m on the free plan and want to add a second competitor before launch.',
  'Something else': 'Anything at all.',
};

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<Topic>('Product question');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameError = touched && !name.trim() ? 'Tell us who you are.' : '';
  const emailError = touched && !email.trim() ? 'We need an address to reply to.' : '';
  const messageError = touched && !message.trim() ? 'Add a line or two so we can help.' : '';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setTouched(true);
      setSent(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), topic, message: message.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };

      if (!data.ok) {
        setSubmitError(data.message ?? 'Something went wrong. Try again.');
        return;
      }

      setSent(true);
      setTouched(false);
      setMessage('');
    } catch {
      setSubmitError('Something went wrong. Try again, or email nilerudra@gmail.com directly.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-hairline-card bg-paper-surface shadow-[0_1px_2px_rgba(20,24,28,0.04),0_14px_36px_-28px_rgba(20,24,28,0.2)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline-soft bg-paper-raised px-4 py-2.5">
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
          Send a message
        </span>
        <span className="font-mono text-[11px] text-slate-dim">
          {sent ? 'sent' : 'replies within 1 working day'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 p-4" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label className="text-[13px] font-medium text-graphite">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rudra Nilekar"
              className={`w-full rounded-lg border bg-paper-surface px-3 py-2.5 text-sm text-graphite outline-none placeholder:text-slate-faint focus:border-cobalt ${
                nameError ? 'border-rose-border' : 'border-hairline-input'
              }`}
            />
            {nameError && <span className="text-xs text-rose">{nameError}</span>}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label className="text-[13px] font-medium text-graphite">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourstartup.com"
              className={`w-full rounded-lg border bg-paper-surface px-3 py-2.5 text-sm text-graphite outline-none placeholder:text-slate-faint focus:border-cobalt ${
                emailError ? 'border-rose-border' : 'border-hairline-input'
              }`}
            />
            {emailError && <span className="text-xs text-rose">{emailError}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-graphite">What&rsquo;s this about?</label>
          <div className="flex flex-wrap gap-1.5">
            {TOPICS.map((t) => {
              const on = topic === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`rounded-full border px-3 py-1.5 text-[13px] ${
                    on
                      ? 'border-cobalt-tint-border bg-cobalt-tint text-cobalt'
                      : 'border-hairline-card bg-paper-surface text-slate'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-baseline gap-1.5 text-[13px] font-medium text-graphite">
            <span>Message</span>
            <span className="text-xs font-normal text-slate-faint">{HINTS[topic]}</span>
          </label>
          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={PLACEHOLDERS[topic]}
            className={`w-full resize-y rounded-lg border bg-paper-surface px-3 py-2.5 text-sm leading-relaxed text-graphite outline-none placeholder:text-slate-faint focus:border-cobalt ${
              messageError ? 'border-rose-border' : 'border-hairline-input'
            }`}
          />
          <div className="flex justify-between gap-2.5">
            <span className="text-xs text-rose">{messageError}</span>
            <span className="font-mono text-[11px] text-slate-faint">{message.length} chars</span>
          </div>
        </div>

        {submitError && <p className="text-sm text-rose">{submitError}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-hairline-soft pt-3.5">
          <span className="text-[12.5px] text-slate-dim">No mailing list, no follow-up sequence.</span>
          <button
            type="submit"
            disabled={submitting}
            className="shrink-0 rounded-lg bg-graphite px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Sending…' : sent ? 'Send another' : 'Send message'}
          </button>
        </div>

        {sent && (
          <div className="rounded-md border border-cobalt-tint-border bg-cobalt-tint px-3.5 py-3 text-[13.5px] leading-relaxed text-cobalt-tint-text">
            Message sent. You&rsquo;ll get a reply at the address above — usually within a working day.
          </div>
        )}
      </form>
    </div>
  );
}
