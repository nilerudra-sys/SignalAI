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
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-7 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <SignalLogo className="h-5 w-5" />
          <Link href="/" className="text-base font-semibold tracking-tight text-graphite">
            Signal
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <a
            href="/#how"
            className="hidden rounded-md px-2.5 py-1.5 text-[13.5px] font-medium text-slate transition-colors hover:text-graphite sm:inline"
          >
            How it works
          </a>
          <a
            href="/#sample"
            className="hidden rounded-md px-2.5 py-1.5 text-[13.5px] font-medium text-slate transition-colors hover:text-graphite sm:inline"
          >
            Sample digest
          </a>
          <a
            href="/#pricing"
            className="hidden rounded-md px-2.5 py-1.5 text-[13.5px] font-medium text-slate transition-colors hover:text-graphite sm:inline"
          >
            Pricing
          </a>
          {user ? (
            <Link
              href="/dashboard"
              className="ml-2 rounded-lg border border-graphite px-4 py-2 text-[13.5px] font-medium text-graphite"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden px-2.5 py-1.5 text-[13.5px] font-medium text-slate transition-colors hover:text-graphite sm:inline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="ml-2 rounded-lg border border-graphite px-4 py-2 text-[13.5px] font-medium text-graphite"
              >
                Get the digest
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
