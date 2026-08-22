const TIERS = [
  {
    name: 'Free',
    detail: 'Track 1 competitor',
    description: 'The full weekly digest for a single competitor. No card required.',
    accent: false,
  },
  {
    name: 'Paid',
    detail: 'Track more + AI chat',
    description: 'Watch your whole competitive set and ask questions across every past digest.',
    accent: true,
  },
];

export function PricingTeaser() {
  return (
    <section id="pricing" className="scroll-mt-16 border-b border-hairline bg-paper-surface">
      <div className="mx-auto max-w-[1000px] px-6 py-14 sm:px-8 sm:py-16">
        <h2 className="text-[24px] font-semibold tracking-tight text-graphite sm:text-[32px]">
          Pricing that fits a team of one
        </h2>
        <p className="mt-2 text-[15px] text-slate">
          No seat minimums, no annual contract, no sales call.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-5 ${
                tier.accent
                  ? 'border-cobalt bg-cobalt-tint'
                  : 'border-hairline-card bg-paper-raised'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2.5">
                <span
                  className={`text-base font-semibold ${tier.accent ? 'text-cobalt' : 'text-graphite'}`}
                >
                  {tier.name}
                </span>
                <span
                  className={`font-mono text-[12.5px] ${tier.accent ? 'text-cobalt' : 'text-slate'}`}
                >
                  {tier.detail}
                </span>
              </div>
              <p
                className={`mt-3 text-sm leading-relaxed ${tier.accent ? 'text-cobalt-tint-text' : 'text-slate'}`}
              >
                {tier.description}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[13px] text-slate-dim">
          Waitlist members get pricing locked in before public launch.
        </p>
      </div>
    </section>
  );
}
