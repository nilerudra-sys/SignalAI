'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormField } from '@/components/auth/FormField';
import { GoogleButton } from '@/components/auth/GoogleButton';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation is off for this project — the user is already signed in.
      router.push('/dashboard');
      router.refresh();
      return;
    }

    setCheckEmail(true);
    setLoading(false);
  }

  if (checkEmail) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm leading-relaxed text-muted">
          We sent a confirmation link to <span className="text-foreground">{email}</span>. Click
          it to finish creating your account.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Track your first competitor for free."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-signal">
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
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />

        {error && <p className="text-sm text-diff-remove">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-signal px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-border" />
        <span className="text-xs text-muted-dim">OR</span>
        <div className="h-px flex-1 bg-ink-border" />
      </div>

      <GoogleButton />
    </AuthCard>
  );
}
