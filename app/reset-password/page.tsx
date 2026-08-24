'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormField } from '@/components/auth/FormField';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setSessionReady(Boolean(data.user));
    });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // The recovery link leaves the browser signed in — sign out so the user
    // has to log back in with the new password, then send them to /login.
    await supabase.auth.signOut();
    router.push('/login?reset=success');
    router.refresh();
  }

  if (sessionReady === null) {
    return <AuthCard title="Reset your password">{null}</AuthCard>;
  }

  if (!sessionReady) {
    return (
      <AuthCard title="Link expired">
        <p className="text-sm leading-relaxed text-slate">
          This password reset link is invalid or has expired. Request a new one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 block text-center text-sm font-medium text-cobalt"
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" subtitle="Choose something you haven't used before.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        <FormField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your new password"
        />

        {error && <p className="text-sm text-rose">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-graphite px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthCard>
  );
}
