'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-hairline-input bg-paper-surface px-3 py-1.5 text-[13px] font-medium text-graphite-soft transition-colors hover:border-slate disabled:opacity-60"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
