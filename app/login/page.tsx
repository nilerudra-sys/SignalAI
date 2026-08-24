'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { safeRedirectPath } from '@/lib/safeRedirect';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormField } from '@/components/auth/FormField';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom');
  const oauthError = searchParams.get('error');
  const resetSuccess = searchParams.get('reset') === 'success';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError ? 'Something went wrong signing you in. Please try again.' : null,
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(safeRedirectPath(redirectedFrom));
    router.refresh();
  }

  return (
    <AuthCard
      title="Log in"
      subtitle="Welcome back."
      footer={
        <>
          Don&rsquo;t have an account?{' '}
          <Link href="/signup" className="font-medium text-cobalt">
            Sign up
          </Link>
        </>
      }
    >
      {resetSuccess && (
        <p className="mb-4 rounded-md border border-moss-line bg-moss-tint px-3 py-2.5 text-sm text-moss">
          Password updated. Log in with your new password.
        </p>
      )}

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
        <div className="flex flex-col gap-1.5">
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Link href="/forgot-password" className="self-end text-xs font-medium text-cobalt">
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-rose">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-cobalt px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
