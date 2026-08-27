import Link from 'next/link';

const BETA_INCLUDES = [
  'Two competitors, both pages watched',
  'The full weekly digest — same one paid users get',
  'Instant pricing-page checks, unlimited',
  'Cancel by ignoring the email. Nothing to unsubscribe from.',
];

const PRICING_RULES = [
  {
    title: 'Flat monthly, never per seat',
    text: 'Signal is for the person who decides. Charging per seat would price a team of one the same as a team of fifty.',
  },
  {
    title: 'Benchmarked against your hour',
    text: 'It replaces roughly an hour a week of checking tabs. That hour is what the price has to be worth — not what enterprise CI tools charge.',
  },
  {
    title: 'Published, not quoted',
    text: 'The price is written on the page, not hidden behind a form. No sales call, no discount ladder, no annual lock-in.',
  },
];

export function PricingTeaser() {
  return (
    <section id="pricing" className="scroll-mt-16 border-b border-hairline bg-paper">
      <div className="mx-auto max-w-[1000px] px-7 py-14 sm:py-16">
        <div className="border-b border-hairline pb-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-dim">
          05 — Access &amp; pricing
        </div>
        <h2 className="mt-5 max-w-[22ch] text-balance text-[26px] font-semibold leading-[1.1] tracking-tight text-graphite sm:text-[34px]">
          Free while it&rsquo;s in beta. Priced with the people using it.
        </h2>
        <p className="mt-3 max-w-[52ch] text-balance text-[15.5px] leading-relaxed text-slate">
          Signal is pre-launch, so there is no price list yet — on purpose. Here is exactly what
          you get today, and how the paid tier will be priced when it exists.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-xl border border-hairline-card bg-paper-surface p-6">
            <div className="flex items-baseline justify-between gap-2.5">
              <span className="font-mono text-[10.5px] uppercase tracking-wide text-moss">
                Available today
              </span>
              <span className="font-mono text-[12px] text-slate-dim">beta</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-semibold tracking-tight text-graphite">Free</span>
              <span className="text-[13px] text-slate-dim">no card, no trial clock</span>
            </div>
            <div className="flex flex-col gap-2 border-t border-hairline-soft pt-3.5">
              {BETA_INCLUDES.map((item) => (
                <div key={item} className="flex items-baseline gap-2.5 text-[13.5px] leading-relaxed text-graphite-soft">
                  <span className="shrink-0 font-mono text-[11px] text-moss">✓</span>
                  <span className="min-w-0 text-balance">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/signup" className="mt-auto pt-2 text-[13.5px] font-medium text-cobalt hover:text-cobalt-hover">
              Start free &rarr;
            </Link>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-cobalt bg-cobalt-tint p-6">
            <div className="flex items-baseline justify-between gap-2.5">
              <span className="font-mono text-[10.5px] uppercase tracking-wide text-cobalt">
                At launch
              </span>
              <span className="font-mono text-[12px] text-cobalt">not priced yet</span>
            </div>
            <div className="text-[32px] font-semibold tracking-tight text-cobalt">Paid plan</div>
            <p className="text-[13.5px] leading-relaxed text-cobalt-tint-text">
              A flat monthly price for your whole competitive set, plus questions across every
              past digest. No seats to count, no enterprise sales process, no call.
            </p>
            <div className="border-t border-cobalt-tint-border pt-3.5 text-[12.5px] leading-relaxed text-cobalt-tint-text">
              The number gets set with the first cohort, not before it. Waitlist members are
              asked first and keep whatever price they joined at.
            </div>
            <a href="#waitlist" className="mt-auto pt-2 text-[13.5px] font-medium text-cobalt hover:text-cobalt-hover">
              Premium plans soon &rarr;
            </a>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-hairline bg-paper-surface p-6">
          <div className="font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
            How it will be priced
          </div>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {PRICING_RULES.map((r) => (
              <div key={r.title} className="min-w-0">
                <div className="text-[13.5px] font-semibold tracking-tight text-graphite">
                  {r.title}
                </div>
                <div className="mt-1.5 text-balance text-[13px] leading-relaxed text-slate">
                  {r.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
