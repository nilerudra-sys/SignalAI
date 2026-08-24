import Link from 'next/link';

const PRINCIPLES = [
  {
    title: 'Evidence first',
    text: 'Every claim links to the diff we saw. No summaries you can’t check.',
  },
  {
    title: 'Weekly, not constant',
    text: 'Real-time alerts train you to ignore them. One email does not.',
  },
  {
    title: 'Plain English',
    text: 'Written for the founder who has to decide, not for a research team.',
  },
];

const FACTS = [
  { label: 'Started', value: 'Jan 2026, as a cron job' },
  { label: 'Team', value: '1' },
  { label: 'Based in', value: 'Pune, India' },
  { label: 'Pages read so far', value: '184,000+' },
];

export function About() {
  return (
    <section id="about" className="scroll-mt-16 border-b border-hairline">
      <div className="mx-auto max-w-[1000px] px-6 py-14 sm:px-8 sm:py-16">
        <div className="border-b border-hairline pb-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-dim">
          About Signal
        </div>

        <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-11">
          <div className="min-w-0">
            <h2 className="text-balance max-w-[26ch] text-[24px] font-semibold tracking-tight text-graphite sm:text-[28px] md:text-[30px]">
              Competitive intelligence, sized for a team of one
            </h2>
            <p className="mt-3.5 max-w-[58ch] text-balance text-[15px] leading-relaxed text-graphite-soft">
              Signal watches the pages your competitors actually change — pricing, changelog,
              careers — and re-reads them six times a day. When something moves, it records the
              diff, works out whether it matters, and holds it until Monday. You get one email:
              what changed, and what you should do about it.
            </p>
            <p className="mt-3.5 max-w-[58ch] text-balance text-[15px] leading-relaxed text-slate">
              The enterprise tools in this category start around $20,000 a year and assume you
              have an analyst to feed them. Most founders don&rsquo;t. They have a browser with
              nine competitor tabs and a nagging feeling they missed something. Signal is that
              habit, automated — no dashboards to tend, no alert firehose, one page a week.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3.5 border-t border-hairline-soft pt-4 sm:grid-cols-3">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="min-w-0">
                  <div className="text-[13.5px] font-semibold tracking-tight text-graphite">
                    {p.title}
                  </div>
                  <div className="mt-1 text-balance text-[13px] leading-relaxed text-slate">
                    {p.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-hairline-card bg-paper-surface">
            <div className="border-b border-hairline-soft bg-paper-raised px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
              Who builds it
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-cobalt-tint-border bg-cobalt-tint text-[15px] font-semibold tracking-tight text-cobalt">
                  RN
                </span>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold tracking-tight text-graphite">
                    Rudra Nilekar
                  </div>
                  <div className="mt-0.5 font-mono text-[11.5px] text-slate-dim">
                    Creator &amp; sole maintainer
                  </div>
                </div>
              </div>

              <p className="mt-3.5 text-balance text-[14px] leading-relaxed text-graphite-soft">
                Signal started as a script Rudra ran on his own competitors every Monday morning.
                It is still built and maintained by one person, which is the reason it stays this
                small: every feature has to justify itself to a founder with no time.
              </p>

              <div className="mt-4 flex flex-col gap-2 border-t border-hairline-soft pt-3.5">
                {FACTS.map((f) => (
                  <div key={f.label} className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="text-slate-dim">{f.label}</span>
                    <span className="font-mono text-[12px] text-graphite">{f.value}</span>
                  </div>
                ))}
              </div>

              <p className="mt-3.5 text-[13px] leading-relaxed text-slate">
                Questions, bugs, or a competitor we read badly? Mail{' '}
                <a href="mailto:nilerudra@gmail.com" className="text-cobalt">
                  nilerudra@gmail.com
                </a>{' '}
                or use the{' '}
                <Link href="/contact" className="text-cobalt">
                  contact page
                </Link>{' '}
                — it reaches him, not a queue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
