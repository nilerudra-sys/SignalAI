import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 sm:px-8">
      <span className="text-[13.5px] font-medium text-graphite">Signal</span>
      <div className="flex flex-wrap items-baseline gap-3.5">
        <a href="/#about" className="text-[12.5px] text-slate">
          About
        </a>
        <a href="/#pricing" className="text-[12.5px] text-slate">
          Pricing
        </a>
        <Link href="/contact" className="text-[12.5px] text-slate">
          Contact
        </Link>
        <span className="text-[12.5px] text-slate-dim">
          Built for founders who&rsquo;d rather ship than snoop.
        </span>
      </div>
    </footer>
  );
}
