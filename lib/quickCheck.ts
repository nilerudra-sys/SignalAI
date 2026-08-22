import { lookup } from 'node:dns/promises';
import { extractReadableText } from './scraper';

const CANDIDATE_PATHS = ['/pricing', '/price', '/plans'];
const MIN_TEXT_LENGTH = 200;
const EXCERPT_LENGTH = 600;
const FETCH_TIMEOUT_MS = 6_000;
const MAX_RESPONSE_BYTES = 3_000_000; // 3 MB — plenty for a marketing page, caps abuse

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export type QuickCheckResult =
  | { ok: true; domain: string; url: string; excerpt: string; truncated: boolean }
  | { ok: false; reason: 'invalid' | 'not_found' | 'blocked'; message: string };

/**
 * Turns free-text input ("Acme", "acme.com", "https://acme.com/pricing")
 * into a bare domain, or null if it doesn't look like one at all. Doesn't
 * attempt real company-name resolution — this is a lightweight guesser, not
 * a search engine.
 */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;

  value = value.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!value.includes('.')) {
    value = `${value}.com`;
  }

  const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
  return domainPattern.test(value) ? value : null;
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIPv6(address: string): boolean {
  const lower = address.toLowerCase();
  if (lower === '::1') return true;
  if (lower.startsWith('fe80')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local fc00::/7
  return false;
}

/**
 * SSRF guard: resolves the hostname and rejects anything pointing at a
 * private/reserved/loopback address, rather than trusting the hostname
 * string alone (which a malicious DNS record could route anywhere).
 */
async function assertPublicHostname(hostname: string): Promise<void> {
  let resolved: { address: string; family: number };
  try {
    resolved = await lookup(hostname);
  } catch {
    throw new Error('DNS_FAILED');
  }

  const isPrivate =
    resolved.family === 4 ? isPrivateIPv4(resolved.address) : isPrivateIPv6(resolved.address);

  if (isPrivate) {
    throw new Error('PRIVATE_ADDRESS');
  }
}

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
 * page from common URL patterns and returns a short excerpt. Deliberately
 * fetch-only (no Playwright fallback) — this runs against arbitrary visitor
 * input, so it stays fast, cheap, and doesn't spin up a headless browser for
 * anonymous traffic.
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

  for (const path of CANDIDATE_PATHS) {
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
