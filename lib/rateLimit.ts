// Simple in-memory per-key rate limit. Resets on server restart and doesn't
// share state across instances — fine for a single-process public form/
// widget, not a hardened API. Shared by any public route that needs basic
// abuse protection (currently /api/quick-check and /api/contact).

export function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, number[]>();

  return {
    isRateLimited(key: string): boolean {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      recent.push(now);
      hits.set(key, recent);
      return recent.length > max;
    },
  };
}

export function clientIp(request: Request): string {
  // Take the LAST entry, not the first. Behind a reverse proxy (Vercel),
  // each hop appends its observed peer to the end of x-forwarded-for — the
  // true client IP is whatever Vercel's edge appended, which the client
  // cannot control. Any earlier entries (including the whole header) can be
  // set by the client itself; keying on the first entry let anyone bypass
  // the rate limit by sending a fresh fake value per request.
  const forwarded = request.headers.get('x-forwarded-for');
  if (!forwarded) return 'unknown';
  const hops = forwarded.split(',').map((ip) => ip.trim()).filter(Boolean);
  return hops[hops.length - 1] ?? 'unknown';
}
