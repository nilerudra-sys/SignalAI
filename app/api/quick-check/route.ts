import { NextResponse, type NextRequest } from 'next/server';
import { quickCheckPricing } from '@/lib/quickCheck';

// Simple in-memory per-IP rate limit. Resets on server restart and doesn't
// share state across instances — an intentional lightweight tradeoff for a
// conversion widget, not a hardened public API. Revisit if this ever needs
// to survive multi-instance deployment.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function clientKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { ok: false, reason: 'rate_limited', message: 'Too many checks — try again in a minute.' },
      { status: 429 },
    );
  }

  let input: unknown;
  try {
    const body = await request.json();
    input = body?.input;
  } catch {
    return NextResponse.json(
      { ok: false, reason: 'invalid', message: 'Enter a company domain, like acme.com.' },
      { status: 400 },
    );
  }

  if (typeof input !== 'string' || !input.trim()) {
    return NextResponse.json(
      { ok: false, reason: 'invalid', message: 'Enter a company domain, like acme.com.' },
      { status: 400 },
    );
  }

  const result = await quickCheckPricing(input);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
