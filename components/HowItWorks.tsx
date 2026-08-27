const STEPS = [
  {
    num: '01',
    kicker: 'You, once',
    title: 'Name the companies you watch',
    text: 'Type a domain. Signal finds their pricing page and changelog on its own — no URLs to hunt down, no config file.',
    chips: ['linear.app', 'notion.so', '+ add'],
  },
  {
    num: '02',
    kicker: 'Signal, every week',
    title: 'It re-reads every page and diffs it',
    text: 'Each page is fetched fresh and compared line by line against the last snapshot. Reformatting is ignored; anything else is recorded with the exact lines that changed.',
    chips: ['/pricing', '/changelog'],
  },
  {
    num: '03',
    kicker: 'Monday morning',
    title: 'You get one email with what to do',
    text: 'The diff, then the read on it in plain English. If nothing moved, the email says so in one line. Nothing to log into.',
    chips: ['1 email', 'no dashboard', 'reply to ask'],
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 border-b border-hairline bg-paper">
      <div className="mx-auto max-w-[1180px] px-7 py-14 sm:py-16">
        <div className="border-b border-hairline pb-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-dim">
          01 — How it works
        </div>
        <h2 className="mt-5 max-w-[22ch] text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-graphite sm:text-[38px]">
          Three minutes to set up. Then you never touch it.
        </h2>
        <p className="mt-3 max-w-[52ch] text-balance text-[15.5px] leading-relaxed text-slate">
          No dashboards to tend, no alert rules to write, no integrations. You name the
          companies; Signal does the checking.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.num} className="flex min-h-[220px] flex-col gap-3 bg-paper-surface p-6">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[32px] font-medium leading-none tracking-tight text-cobalt-tint-border">
                  {s.num}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
                  {s.kicker}
                </span>
              </div>
              <h3 className="text-balance text-[18px] font-semibold leading-tight tracking-tight text-graphite">
                {s.title}
              </h3>
              <p className="text-[13.5px] leading-relaxed text-slate">{s.text}</p>
              <div className="mt-auto flex flex-wrap gap-1.5 border-t border-hairline-soft pt-3.5">
                {s.chips.map((c) => (
                  <span
                    key={c}
                    className="rounded border border-hairline-soft bg-paper-raised px-2 py-1 font-mono text-[11px] text-slate"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
