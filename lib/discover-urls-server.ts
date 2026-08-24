import { lookup } from 'node:dns/promises';
import { USER_AGENT } from './discover-urls';

// Server-only half of the shared URL-discovery logic (uses node:dns, so it
// must never be imported from a client component — see discover-urls.ts for
// the pure helpers that are safe there).

const FETCH_TIMEOUT_MS = 6_000;
const MAX_RESPONSE_BYTES = 3_000_000; // 3 MB — plenty for a marketing page, caps abuse
const MIN_BODY_LENGTH = 40; // filters out empty/blank "soft 404" pages that still return 200
const MAX_REDIRECTS = 5;

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
export async function assertPublicHostname(hostname: string): Promise<void> {
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

/**
 * Guarded fetch: SSRF-checks the hostname, then GETs the URL with a timeout
 * and a size cap. Returns the response body text if the request looks like a
 * real page (2xx, non-trivial body), null otherwise — never throws, since
 * every caller here treats "not reachable" as a normal result.
 *
 * Redirects are followed manually (not via `redirect: 'follow'`) so each hop
 * gets its own SSRF check: a public URL that later 302s to a private/
 * metadata address (169.254.169.254, etc.) would otherwise sail through
 * unchecked, since the guard only ever validated the original hostname.
 */
export async function fetchIfReachable(url: string): Promise<string | null> {
  let currentUrl = url;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    let hostname: string;
    try {
      hostname = new URL(currentUrl).hostname;
    } catch {
      return null;
    }

    try {
      await assertPublicHostname(hostname);
    } catch {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
        signal: controller.signal,
        redirect: 'manual',
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return null;
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        return null;
      }
      continue;
    }

    if (!res.ok) return null;

    const contentLength = res.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) return null;

    try {
      const body = await res.text();
      if (body.length > MAX_RESPONSE_BYTES || body.length < MIN_BODY_LENGTH) return null;
      return body;
    } catch {
      return null;
    }
  }

  return null; // too many redirects
}

/** Confirms a domain has a live site at its root, for the "just a domain/name" quick-add case. */
export async function checkDomainReachable(domain: string): Promise<string | null> {
  const url = `https://${domain}`;
  const body = await fetchIfReachable(url);
  return body ? url : null;
}

/** Tries each candidate path against a domain in order, returns the first that's reachable. */
export async function findFirstReachablePath(
  domain: string,
  paths: string[],
): Promise<string | null> {
  for (const path of paths) {
    const url = `https://${domain}${path}`;
    const body = await fetchIfReachable(url);
    if (body) return url;
  }
  return null;
}
