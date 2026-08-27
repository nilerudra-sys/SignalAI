import Link from 'next/link';
import { SignalLogo } from '@/components/SignalLogo';

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-7 py-6">
      <span className="flex items-center gap-2 text-[13.5px] font-medium text-graphite">
        <SignalLogo className="h-[17px] w-[17px]" />
        Signal
      </span>
      <div className="flex flex-wrap items-baseline gap-4">
        <a href="/#how" className="text-[12.5px] text-slate">
          How it works
        </a>
        <a href="/#about" className="text-[12.5px] text-slate">
          About
        </a>
        <a href="/#pricing" className="text-[12.5px] text-slate">
          Pricing
        </a>
        <Link href="/contact" className="text-[12.5px] text-slate">
          Contact
        </Link>
      </div>
    </footer>
  );
}
