import Link from 'next/link';

type DigestLine = { sign: '+' | '−'; text: string; strike?: boolean };

type DigestEntry = {
  name: string;
  domain: string;
  tag: string;
  tagBg: string;
  tagFg: string;
  lines: DigestLine[];
  why: string;
};

const DIGEST: DigestEntry[] = [
  {
    name: 'Acme Analytics',
    domain: 'acmeanalytics.com',
    tag: 'Pricing',
    tagBg: 'bg-rose-tint',
    tagFg: 'text-rose',
    lines: [
      { sign: '−', text: 'Pro plan — $49/mo', strike: true },
      { sign: '+', text: 'Pro plan — $59/mo (+20%, effective Sept 1)' },
    ],
    why: 'A 20% increase with two weeks’ notice means their existing customers are shopping right now. Worth a targeted outbound push and a side-by-side price page this month.',
  },
  {
    name: 'Chartline',
    domain: 'chartline.io',
    tag: 'Launch',
    tagBg: 'bg-cobalt-tint',
    tagFg: 'text-cobalt',
    lines: [{ sign: '+', text: 'CSV export shipped on all plans (was Enterprise-only)' }],
    why: 'CSV export is no longer a differentiator for you on its own. Move it out of your feature comparison and lead with scheduled reports instead.',
  },
  {
    name: 'Northstar Metrics',
    domain: 'northstarmetrics.com',
    tag: 'Hiring',
    tagBg: 'bg-moss-tint',
    tagFg: 'text-moss',
    lines: [
      { sign: '+', text: '3 roles posted: Senior Growth Marketer, Partnerships Lead, DevRel Engineer' },
    ],
    why: 'Two of three hires are distribution, not product. They’re building a partner channel — a co-marketing conversation is cheaper before they announce it.',
  },
];

function DigestRow({ sign, text, strike }: DigestLine) {
  const isAdd = sign === '+';
  return (
    <div
      className={`flex gap-2.5 rounded-md px-2.5 py-1.5 font-mono text-[12.5px] leading-relaxed ${
        isAdd ? 'bg-moss-line' : 'bg-rose-line'
      }`}
    >
      <span className={isAdd ? 'text-moss' : 'text-rose'}>{sign}</span>
      <span className={isAdd ? 'text-graphite' : `text-slate-dim ${strike ? 'line-through' : ''}`}>
        {text}
      </span>
    </div>
  );
}

export function SampleDigest() {
  return (
    <section id="sample" className="scroll-mt-16 border-b border-hairline bg-paper">
      <div className="mx-auto max-w-[1000px] px-7 py-14 sm:py-16">
        <div className="border-b border-hairline pb-2.5 font-mono text-[11px] uppercase tracking-wide text-slate-dim">
          03 — What lands in your inbox
        </div>

        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h2 className="max-w-[20ch] text-balance text-[24px] font-semibold leading-[1.1] tracking-tight text-graphite sm:text-[32px]">
              One entry per change. Nothing else.
            </h2>
            <p className="mt-2.5 max-w-[54ch] text-balance text-[15.5px] leading-relaxed text-slate">
              The diff we detected, then what it means for you. A full sample — illustrative,
              not a real customer.
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-hairline bg-paper-raised px-2.5 py-1 font-mono text-[11.5px] text-slate-dim">
            SAMPLE
          </span>
        </div>

        <div className="mt-7 overflow-hidden rounded-xl border border-hairline-card bg-paper-surface shadow-[0_1px_2px_rgba(20,24,28,0.04),0_16px_40px_-28px_rgba(20,24,28,0.25)]">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline-soft bg-paper-raised px-[18px] py-4">
            <div className="min-w-0">
              <div className="text-[15px] font-semibold tracking-tight text-graphite">
                Your Signal digest — week of Aug 17
              </div>
              <div className="mt-0.5 font-mono text-[11.5px] text-slate-dim">
                digests@signal.tools &rarr; you@yourstartup.com
              </div>
            </div>
            <div className="font-mono text-[11.5px] text-slate-dim">3 competitors &middot; 4 changes</div>
          </div>

          {DIGEST.map((entry) => (
            <div key={entry.name} className="border-b border-hairline-soft p-[18px]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex min-w-0 items-baseline gap-2.5">
                  <span className="text-[15.5px] font-semibold tracking-tight text-graphite">
                    {entry.name}
                  </span>
                  <span className="font-mono text-[11.5px] text-slate-dim">{entry.domain}</span>
                </div>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${entry.tagBg} ${entry.tagFg}`}
                >
                  {entry.tag}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-0.5">
                {entry.lines.map((line) => (
                  <DigestRow key={line.text} {...line} />
                ))}
              </div>

              <div className="mt-3 grid grid-cols-[auto_1fr] items-start gap-3">
                <span className="pt-0.5 font-mono text-[10.5px] uppercase tracking-wide text-slate-dim">
                  Why it matters
                </span>
                <p className="text-balance text-[14.5px] leading-relaxed text-graphite-soft">
                  {entry.why}
                </p>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-paper-raised px-[18px] py-3.5">
            <span className="text-[13px] text-slate">
              Nothing else changed. That&rsquo;s the whole email.
            </span>
            <Link href="/signup" className="text-[13px] font-medium text-cobalt hover:text-cobalt-hover">
              Get this weekly &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
