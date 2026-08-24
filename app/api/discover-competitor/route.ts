import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CHANGELOG_PATHS, PRICING_PATHS, normalizeDomain } from '@/lib/discover-urls';
import { checkDomainReachable, findFirstReachablePath } from '@/lib/discover-urls-server';

function guessName(domain: string): string {
  return domain
    .split('.')[0]
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Authenticated "quick add" for the dashboard: given a company name or
 * domain, tries to find their site, pricing page, and changelog by checking
 * common URL patterns (shared with the public quick-check widget — see
 * lib/discover-urls.ts). Never saves anything — the client pre-fills the
 * add-competitor form with whatever's found so the user can review/edit
 * before confirming.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }

  let input: unknown;
  try {
    const body = await request.json();
    input = body?.input;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Enter a company name or domain.' },
      { status: 400 },
    );
  }

  if (typeof input !== 'string' || !input.trim()) {
    return NextResponse.json(
      { ok: false, message: 'Enter a company name or domain.' },
      { status: 400 },
    );
  }

  const domain = normalizeDomain(input);
  if (!domain) {
    return NextResponse.json(
      { ok: false, message: `Couldn't make sense of "${input.trim()}" — try entering their domain directly.` },
      { status: 422 },
    );
  }

  const websiteUrl = await checkDomainReachable(domain);
  if (!websiteUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: `Couldn't find a live site at ${domain} — double-check the domain and try again, or fill in the fields manually.`,
      },
      { status: 422 },
    );
  }

  const [pricingUrl, changelogUrl] = await Promise.all([
    findFirstReachablePath(domain, PRICING_PATHS),
    findFirstReachablePath(domain, CHANGELOG_PATHS),
  ]);

  return NextResponse.json({
    ok: true,
    name: guessName(domain),
    websiteUrl,
    pricingUrl,
    changelogUrl,
  });
}
