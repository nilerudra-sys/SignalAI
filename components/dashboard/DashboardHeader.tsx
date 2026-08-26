'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { SignalLogo } from '@/components/SignalLogo';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`hidden border-b-2 py-1 text-[13px] transition-colors sm:inline ${
        active
          ? 'border-graphite font-semibold text-graphite'
          : 'border-transparent font-medium text-graphite-soft hover:text-graphite'
      }`}
    >
      {children}
    </Link>
  );
}

export function DashboardHeader({
  planLabel,
  isAdmin,
}: {
  planLabel?: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

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
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/dashboard/prices">Check prices</NavLink>
          {isAdmin && (
            <Link
              href="/admin"
              aria-current={pathname === '/admin' ? 'page' : undefined}
              className={`rounded-lg border bg-paper-surface px-3 py-1.5 text-[13px] transition-colors ${
                pathname === '/admin'
                  ? 'border-graphite font-semibold text-graphite'
                  : 'border-hairline-input font-medium text-graphite-soft hover:border-slate'
              }`}
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
