import { extractReadableText } from './scraper';
import { PRICING_PATHS, USER_AGENT, normalizeDomain } from './discover-urls';
import { assertPublicHostname } from './discover-urls-server';

export { normalizeDomain };

const MIN_TEXT_LENGTH = 200;
// Was 600 — enough for a one-tier teaser, but truncated multi-tier pages
// (Free/Pro/Team/Enterprise) mid-way. Every caller now renders this inside
// a scrollable box, so there's no longer a UI reason to cut it short —
// raised to comfortably fit a full tier comparison, still bounded so a
// pathologically large page can't blow up the response/DOM.
const EXCERPT_LENGTH = 6000;
const FETCH_TIMEOUT_MS = 6_000;
const MAX_RESPONSE_BYTES = 3_000_000; // 3 MB — plenty for a marketing page, caps abuse

export type QuickCheckResult =
  | { ok: true; domain: string; url: string; excerpt: string; truncated: boolean }
  | { ok: false; reason: 'invalid' | 'not_found' | 'blocked'; message: string };

async function fetchCandidate(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) return null;

    const contentLength = res.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) return null;

    const html = await res.text();
    if (html.length > MAX_RESPONSE_BYTES) return null;

    return extractReadableText(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * The public, unauthenticated "quick check": guesses a company's pricing
 * page from common URL patterns (shared with the dashboard's competitor
 * auto-discovery — see lib/discover-urls.ts) and returns a short excerpt.
 * Deliberately fetch-only (no Playwright fallback) — this runs against
 * arbitrary visitor input, so it stays fast, cheap, and doesn't spin up a
 * headless browser for anonymous traffic.
 */
export async function quickCheckPricing(rawInput: string): Promise<QuickCheckResult> {
  const domain = normalizeDomain(rawInput);
  if (!domain) {
    return { ok: false, reason: 'invalid', message: 'Enter a company domain, like acme.com.' };
  }

  try {
    await assertPublicHostname(domain);
  } catch {
    return {
      ok: false,
      reason: 'blocked',
      message: `Couldn't reach ${domain}. Double-check the domain and try again.`,
    };
  }

  for (const path of PRICING_PATHS) {
    const url = `https://${domain}${path}`;
    const text = await fetchCandidate(url);
    if (text && text.length >= MIN_TEXT_LENGTH) {
      const truncated = text.length > EXCERPT_LENGTH;
      return {
        ok: true,
        domain,
        url,
        excerpt: truncated ? `${text.slice(0, EXCERPT_LENGTH).trim()}…` : text,
        truncated,
      };
    }
  }

  return {
    ok: false,
    reason: 'not_found',
    message: `Couldn't find a public pricing page for ${domain} at the usual spots.`,
  };
}
