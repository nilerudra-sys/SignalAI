import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_EMAIL } from '@/lib/admin';
import { createRateLimiter, clientIp } from '@/lib/rateLimit';

const limiter = createRateLimiter(60_000, 10);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (limiter.isRateLimited(clientIp(request))) {
    return NextResponse.json({ ok: false, message: 'Too many requests — try again in a minute.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Something went wrong. Try again.' }, { status: 400 });
  }

  const { email, source } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ ok: false, message: 'Enter a valid email address.' }, { status: 400 });
  }

  const cleanEmail = email.trim();
  const cleanSource = typeof source === 'string' ? source.trim().slice(0, 40) : null;

  const admin = createAdminClient();
  const { error } = await admin
    .from('waitlist_signups')
    .insert({ email: cleanEmail, source: cleanSource });

  // A duplicate email (already on the list) isn't a failure from the
  // visitor's point of view — just don't send a second notification for it.
  const isDuplicate = error?.code === '23505';

  if (error && !isDuplicate) {
    return NextResponse.json({ ok: false, message: 'Something went wrong. Try again.' }, { status: 500 });
  }

  if (!isDuplicate) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Signal <onboarding@resend.dev>';
      try {
        await resend.emails.send({
          from: fromEmail,
          to: ADMIN_EMAIL,
          subject: `Signal waitlist — ${cleanEmail}`,
          text: `New waitlist signup: ${cleanEmail}\nSource: ${cleanSource ?? 'unknown'}`,
        });
      } catch (sendError) {
        // The signup itself is already saved — a failed notification email
        // shouldn't make the visitor think joining the waitlist failed.
        console.error('Failed to send waitlist notification email:', sendError);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
