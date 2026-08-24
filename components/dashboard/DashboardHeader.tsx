import Link from 'next/link';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { SignalLogo } from '@/components/SignalLogo';

export function DashboardHeader({
  planLabel,
  isAdmin,
}: {
  planLabel?: string;
  isAdmin: boolean;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-hairline bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-6 py-3.5 sm:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <SignalLogo className="h-[19px] w-[19px]" />
          <Link href="/" className="text-[15.5px] font-semibold tracking-tight text-graphite">
            Signal
          </Link>
          {planLabel && (
            <span className="whitespace-nowrap border-l border-hairline pl-2.5 font-mono text-[11px] text-slate-dim">
              {planLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className="hidden text-[13px] font-medium text-graphite-soft transition-colors hover:text-graphite sm:inline"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/prices"
            className="hidden text-[13px] font-medium text-graphite-soft transition-colors hover:text-graphite sm:inline"
          >
            Check prices
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-lg border border-hairline-input bg-paper-surface px-3 py-1.5 text-[13px] font-medium text-graphite-soft transition-colors hover:border-slate"
            >
              Admin
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
