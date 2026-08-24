import { NextResponse, type NextRequest } from 'next/server';
import { quickCheckPricing } from '@/lib/quickCheck';
import { createRateLimiter, clientIp } from '@/lib/rateLimit';

const limiter = createRateLimiter(60_000, 5);

export async function POST(request: NextRequest) {
  if (limiter.isRateLimited(clientIp(request))) {
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
