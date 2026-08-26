import Link from 'next/link';

const PILLARS = [
  { key: 'PRICING', text: 'Tier and price changes, caught the day they ship' },
  { key: 'LAUNCHES', text: 'Changelog and release notes, deduped' },
  { key: 'HIRING', text: 'New roles that telegraph their roadmap' },
];

export function Hero() {
  return (
    <section className="border-b border-hairline bg-paper-raised">
      <div className="mx-auto max-w-[1000px] px-6 py-14 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-graphite pb-2.5 font-mono text-[11.5px] uppercase tracking-wide text-slate-dim">
          <span>Issue 14 &middot; Week of Aug 17</span>
          <span>Delivered Monday 7:00 local</span>
        </div>

        <h1 className="mt-6 max-w-[18ch] text-balance text-[36px] font-semibold leading-[1.02] tracking-tight text-graphite sm:text-[56px] md:text-[68px]">
          Your competitors moved this week. Here&rsquo;s the one-page version.
        </h1>

        <p className="mt-4 max-w-[54ch] text-balance text-[17px] leading-relaxed text-graphite-soft sm:text-[19px]">
          Signal watches your competitors&rsquo; pricing pages, changelogs, and job boards — then
          emails you a plain-English summary of what changed, every Monday.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 border-t border-hairline-soft pt-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2.5">
            {PILLARS.map((p) => (
              <div
                key={p.key}
                className="flex gap-2.5 border-b border-hairline-soft pb-2.5 text-sm text-graphite-soft"
              >
                <span className="shrink-0 font-mono text-[11px] text-cobalt">{p.key}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>

          <div className="flex w-full flex-col gap-2.5">
            <div className="flex gap-2.5 border-b border-hairline-soft pb-2.5 text-sm text-graphite-soft">
              <span className="shrink-0 font-mono text-[11px] text-cobalt">CADENCE</span>
              <span>One digest every Monday, 07:00 UTC — nothing in between.</span>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-graphite px-6 py-3.5 text-[15.5px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start tracking free
            </Link>
            <p className="text-[12.5px] text-slate-dim">
              Free for 2 competitors. No card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
