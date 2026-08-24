import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ADMIN_EMAIL } from '@/lib/admin';
import { createRateLimiter, clientIp } from '@/lib/rateLimit';

const limiter = createRateLimiter(60_000, 3);

const TOPICS = ['Product question', 'Wrong reading', 'Billing & plans', 'Something else'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (limiter.isRateLimited(clientIp(request))) {
    return NextResponse.json(
      { ok: false, message: 'Too many messages — try again in a minute.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Something went wrong. Try again.' }, { status: 400 });
  }

  const { name, email, topic, message } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ ok: false, message: 'Tell us who you are.' }, { status: 400 });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ ok: false, message: 'Enter a valid email address.' }, { status: 400 });
  }
  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ ok: false, message: 'Add a line or two so we can help.' }, { status: 400 });
  }

  const safeTopic = typeof topic === 'string' && TOPICS.includes(topic) ? topic : 'Something else';

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, message: 'The contact form is not set up yet — email nilerudra@gmail.com directly.' },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Signal <onboarding@resend.dev>';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: ADMIN_EMAIL,
    replyTo: email.trim(),
    subject: `Signal contact — ${safeTopic}`,
    text: `From: ${name.trim()} <${email.trim()}>\nTopic: ${safeTopic}\n\n${message.trim()}`,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: "Couldn't send that — try emailing nilerudra@gmail.com directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
