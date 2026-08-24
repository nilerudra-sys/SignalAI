'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormField } from '@/components/auth/FormField';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    // Ignore the result either way — never reveal whether an account exists
    // for this email. Supabase already avoids erroring on an unknown
    // address; we just make sure our own UI can't leak it either.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm leading-relaxed text-slate">
          If an account exists for <span className="text-graphite">{email}</span>, we&rsquo;ve sent
          a link to reset your password. Click it to choose a new one.
        </p>
        <Link href="/login" className="mt-6 block text-center text-sm font-medium text-cobalt">
          Back to log in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="font-medium text-cobalt">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourstartup.com"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-graphite px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthCard>
  );
}
