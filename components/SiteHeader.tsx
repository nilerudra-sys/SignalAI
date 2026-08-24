import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SignalLogo } from '@/components/SignalLogo';

export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="sticky top-0 z-40 border-b border-hairline bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5 sm:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <SignalLogo className="h-[21px] w-[21px]" />
          <Link href="/" className="text-base font-semibold tracking-tight text-graphite">
            Signal
          </Link>
          <span className="hidden whitespace-nowrap border-l border-hairline pl-2.5 font-mono text-[11px] text-slate-dim sm:inline">
            competitor digests
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/#about"
            className="hidden px-3 py-1.5 text-[13.5px] font-medium text-graphite-soft sm:inline"
          >
            About
          </a>
          <Link
            href="/contact"
            className="hidden px-3 py-1.5 text-[13.5px] font-medium text-graphite-soft sm:inline"
          >
            Contact
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-cobalt px-3.5 py-2 text-[13.5px] font-medium text-white"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 text-[13.5px] font-medium text-graphite">
                Log in
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg bg-cobalt px-3.5 py-2 text-[13.5px] font-medium text-white"
              >
                Access dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
