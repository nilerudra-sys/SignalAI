import Link from 'next/link';
import type { ReactNode } from 'react';
import { SignalLogo } from '@/components/SignalLogo';

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="bg-radar flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 font-sans text-graphite">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-center text-2xl font-semibold tracking-tight text-graphite"
        >
          <SignalLogo className="h-6 w-6" />
          Signal
        </Link>

        <div className="rounded-xl border border-hairline-card bg-paper-surface p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-graphite">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <p className="mt-6 text-center text-sm text-slate">{footer}</p>}
      </div>
    </main>
  );
}
