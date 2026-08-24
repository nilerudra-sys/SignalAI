// Pure, isomorphic URL helpers — safe to import from client components.
// Server-only discovery logic (DNS/SSRF guard, fetching) lives in
// lib/discover-urls-server.ts, which imports the constants below.

export const PRICING_PATHS = ['/pricing', '/price', '/plans'];
export const CHANGELOG_PATHS = ['/changelog', '/blog', '/updates', '/whats-new', '/release-notes'];

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Turns free-text input ("Acme", "acme.com", "https://acme.com/pricing")
 * into a bare domain, or null if it doesn't look like one at all. Doesn't
 * attempt real company-name resolution — this is a lightweight guesser, not
 * a search engine: a plain name with no dot gets a ".com" guess, which is
 * right often enough to be useful and wrong often enough that callers should
 * always let the result be reachability-checked (or edited) before trusting it.
 */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;

  value = value
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, ''); // matches lib/hostname.ts's stripping, so a
  // search for "www.acme.com" correctly matches an already-tracked "acme.com"
  if (!value.includes('.')) {
    value = `${value}.com`;
  }

  const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
  return domainPattern.test(value) ? value : null;
}

/**
 * Normalizes a full URL field (website / pricing page / changelog): accepts
 * input with or without a scheme, prepends https:// when missing, and
 * validates the result has a well-formed, domain-shaped host — not a live
 * reachability check, just "is this shaped like a real URL."
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const hostnamePattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
  if (!hostnamePattern.test(url.hostname)) return null;

  return url.toString();
}
