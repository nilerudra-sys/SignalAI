import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact — Signal',
  description: 'Write to Signal and Rudra reads it himself.',
};

const FACTS = [
  { label: 'Based in', value: 'Pune, India (IST)' },
  { label: 'Typical reply', value: 'under 24h' },
  { label: 'Team size', value: '1' },
];

const INCLUDE = [
  'The competitor’s name and the exact URL we read',
  'The digest date, if it’s about something we sent',
  'A screenshot if the page looks different to you than to us',
];

const FAQS = [
  {
    q: 'Can I track a competitor whose pricing needs a login?',
    a: 'Not yet. Signal only reads pages a browser can reach without an account — we don’t sign in to anything.',
  },
  {
    q: 'What happens to my data if I leave?',
    a: 'Delete a competitor and its snapshots go with it. Ask for a full account wipe and it happens the same day, by hand.',
  },
  {
    q: 'Can I get the digest more often than weekly?',
    a: 'Daily sending exists on paid plans, but we’ll try to talk you out of it — the weekly cadence is why the email gets read.',
  },
  {
    q: 'We read a competitor wrong. Now what?',
    a: 'Tell us which line was off. Corrections go out with the next digest, and the fix applies to everyone tracking that page.',
  },
];

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col bg-paper font-sans text-graphite">
      <SiteHeader />

      <div className="mx-auto w-full max-w-[1000px] px-6 pb-16 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-graphite pb-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-dim">
          <span>Contact</span>
          <span>One inbox, one person reading it</span>
        </div>

        <div className="mt-5 max-w-[60ch]">
          <h1 className="text-balance text-[28px] font-semibold leading-[1.06] tracking-tight text-graphite sm:text-[36px] md:text-[42px]">
            Write to Signal and Rudra reads it himself.
          </h1>
          <p className="mt-3 text-balance text-[15.5px] leading-relaxed text-slate">
            There is no support tier, no ticket number, and no chatbot in front of this form.
            Replies usually land within one working day &mdash; two if a digest is going out.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
          <ContactForm />

          <div className="flex min-w-0 flex-col gap-3.5">
            <div className="overflow-hidden rounded-xl border border-hairline-card bg-paper-surface">
              <div className="border-b border-hairline-soft bg-paper-raised px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
                Direct
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cobalt-tint-border bg-cobalt-tint text-[14.5px] font-semibold tracking-tight text-cobalt">
                    RN
                  </span>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold tracking-tight text-graphite">
                      Rudra Nilekar
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-dim">
                      Creator &amp; sole maintainer
                    </div>
                  </div>
                </div>

                <a
                  href="mailto:nilerudra@gmail.com"
                  className="mt-3.5 flex items-center justify-between gap-2.5 rounded-lg border border-hairline-input bg-paper-raised px-3 py-2.5"
                >
                  <span className="truncate font-mono text-[12.5px] text-graphite">
                    nilerudra@gmail.com
                  </span>
                  <span className="shrink-0 text-[12.5px] font-medium text-cobalt">Mail &rarr;</span>
                </a>

                <div className="mt-3.5 flex flex-col gap-2 border-t border-hairline-soft pt-3.5">
                  {FACTS.map((f) => (
                    <div key={f.label} className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="text-slate-dim">{f.label}</span>
                      <span className="font-mono text-[12px] text-graphite">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-hairline bg-paper-raised p-4">
              <div className="font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
                Helps us reply faster
              </div>
              <div className="mt-2.5 flex flex-col gap-2">
                {INCLUDE.map((i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[auto_1fr] items-baseline gap-2 border-b border-hairline-soft pb-2 text-[13.5px] text-graphite-soft last:border-b-0 last:pb-0"
                  >
                    <span className="shrink-0 text-moss">+</span>
                    <span className="text-balance">{i}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-hairline pt-4">
          <h2 className="text-[16px] font-semibold tracking-tight text-graphite">
            Answered already &mdash; no need to write
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {FAQS.map((f) => (
              <div key={f.q} className="min-w-0 rounded-xl border border-hairline bg-paper-surface p-4">
                <div className="text-balance text-[14px] font-semibold tracking-tight text-graphite">
                  {f.q}
                </div>
                <p className="mt-1.5 text-balance text-[13.5px] leading-relaxed text-slate">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
