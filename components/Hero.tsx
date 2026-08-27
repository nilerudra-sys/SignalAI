import Link from 'next/link';

const PROOF = [
  { value: '2 pages', label: 'watched per competitor' },
  { value: '1 email', label: 'Monday, 07:00 UTC' },
  { value: 'minutes', label: 'to set up, then nothing' },
];

// Illustrative only — this is a fictional scenario using real, recognizable
// company names (matching the ones already used as live examples elsewhere
// on this page) so the mockup reads as concrete rather than generic. The
// specific numbers/changes below are invented, not a real historical price
// change for either company — the disclaimer line under the SAMPLE badge
// says so explicitly, since the badge alone isn't enough on its own to make
// that clear.
const HERO_DIGEST = [
  {
    name: 'Notion',
    tag: 'Pricing',
    tagBg: 'bg-rose-tint',
    tagFg: 'text-rose',
    sign: '→',
    line: 'Business plan  $18 → $22 / user / mo',
    lineBg: 'bg-rose-line',
    mark: 'text-rose',
    why: 'A raise with two weeks’ notice means their mid-market customers are shopping right now.',
  },
  {
    name: 'Linear',
    tag: 'Launch',
    tagBg: 'bg-cobalt-tint',
    tagFg: 'text-cobalt',
    sign: '+',
    line: 'CSV export moved to all paid plans',
    lineBg: 'bg-moss-line',
    mark: 'text-moss',
    why: 'No longer a differentiator for you — lead with scheduled reports instead.',
  },
];

export function Hero() {
  return (
    <section className="border-b border-hairline bg-paper-raised">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-start gap-10 px-7 py-14 sm:py-16 lg:grid-cols-2 lg:gap-14">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-cobalt-tint-border bg-cobalt-tint px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-cobalt">
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-cobalt" />
            Competitor monitoring for teams of one
          </div>

          <h1 className="mt-5 max-w-[17ch] text-balance text-[38px] font-semibold leading-[1.03] tracking-tight text-graphite sm:text-[56px] md:text-[64px]">
            Know what your competitors changed. Without checking.
          </h1>

          <p className="mt-5 max-w-[48ch] text-balance text-[17px] leading-relaxed text-graphite-soft">
            Signal re-reads your competitors&rsquo; pricing pages and changelogs every week —
            and flags hiring signals wherever they turn up. When something actually moves, you
            get one email: the change, and what it means for you.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-graphite px-6 py-3.5 text-[15.5px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get the digest — free
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-lg border border-hairline-input bg-paper-surface px-5 py-3.5 text-[15px] font-medium text-graphite"
            >
              See how it works
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 border-t border-hairline-soft pt-4">
            {PROOF.map((p) => (
              <div key={p.label} className="min-w-0">
                <div className="font-mono text-[15px] font-medium tracking-tight text-graphite">
                  {p.value}
                </div>
                <div className="mt-0.5 text-[12px] text-slate-dim">{p.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
              This is the whole product
            </span>
            <span className="shrink-0 rounded-md border border-hairline bg-paper-surface px-2 py-0.5 font-mono text-[10.5px] text-slate-dim">
              SAMPLE
            </span>
          </div>
          <p className="mb-2.5 text-[12px] leading-relaxed text-slate-dim">
            Illustrative — a fictional scenario, not real pricing history for either company.
          </p>
          <div className="overflow-hidden rounded-2xl border border-hairline-card bg-paper-surface shadow-[0_1px_2px_rgba(20,24,28,0.05),0_24px_60px_-32px_rgba(20,24,28,0.3)]">
            <div className="border-b border-hairline-soft bg-paper-raised px-[18px] py-3.5">
              <div className="text-[14.5px] font-semibold tracking-tight text-graphite">
                Your Signal digest — week of Aug 17
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-slate-dim">
                digests@signal.tools · 3 competitors · 2 changes
              </div>
            </div>
            {HERO_DIGEST.map((d) => (
              <div key={d.name} className="border-b border-hairline-soft px-[18px] py-[15px]">
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="text-[14.5px] font-semibold tracking-tight text-graphite">
                    {d.name}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${d.tagBg} ${d.tagFg}`}
                  >
                    {d.tag}
                  </span>
                </div>
                <div
                  className={`mt-2 flex gap-2 rounded-md px-2.5 py-1.5 font-mono text-[12px] leading-relaxed ${d.lineBg}`}
                >
                  <span className={`shrink-0 ${d.mark}`}>{d.sign}</span>
                  <span className="min-w-0 text-graphite">{d.line}</span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-slate">{d.why}</p>
              </div>
            ))}
            <div className="bg-paper-raised px-[18px] py-3 text-[12.5px] text-slate-dim">
              Nothing else changed. That&rsquo;s the whole email.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
