const CONTRAST = [
  {
    label: 'Enterprise CI tools',
    bg: 'bg-paper-raised',
    labelFg: 'text-slate-dim',
    itemFg: 'text-slate',
    mark: '—',
    markFg: 'text-slate-faint',
    items: [
      'From ~$20,000 a year, annual contract, sales call first',
      'Assumes an analyst on staff to tune and read it',
      'Real-time alert firehose you learn to ignore',
      'A dashboard you have to remember to open',
    ],
  },
  {
    label: 'Signal',
    bg: 'bg-cobalt-tint',
    labelFg: 'text-cobalt',
    itemFg: 'text-cobalt-tint-text',
    mark: '✓',
    markFg: 'text-moss',
    items: [
      'Free during beta, no card, no call',
      'Set up in minutes by the person who decides',
      'One email a week — or a line saying nothing moved',
      'Every claim shows the diff it came from',
    ],
  },
];

export function WhyNotEnterprise() {
  return (
    <section className="border-b border-hairline bg-paper-surface">
      <div className="mx-auto max-w-[1000px] px-7 py-12 sm:py-16">
        <div className="border-b border-hairline-soft pb-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-dim">
          04 — Why not the enterprise tools
        </div>
        <h2 className="mt-5 max-w-[24ch] text-balance text-[24px] font-semibold leading-[1.12] tracking-tight text-graphite sm:text-[32px]">
          Built for the founder, not the analyst
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-hairline-soft bg-hairline-soft sm:grid-cols-2">
          {CONTRAST.map((c) => (
            <div key={c.label} className={`${c.bg} p-5 sm:p-6`}>
              <div className={`font-mono text-[10.5px] uppercase tracking-wide ${c.labelFg}`}>
                {c.label}
              </div>
              <div className="mt-3 flex flex-col gap-2.5">
                {c.items.map((item) => (
                  <div key={item} className="flex items-baseline gap-2.5 text-[13.5px] leading-relaxed">
                    <span className={`shrink-0 font-mono text-[12px] ${c.markFg}`}>{c.mark}</span>
                    <span className={`min-w-0 text-balance ${c.itemFg}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
