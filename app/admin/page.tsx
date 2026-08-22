import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/admin';
import { updateCompetitorLimit } from './actions';

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    redirect('/');
  }

  const admin = createAdminClient();

  const [{ data: userList }, { data: profiles }, { data: competitors }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from('profiles').select('id, competitor_limit'),
    admin.from('competitors').select('user_id'),
  ]);

  const competitorCountByUser = new Map<string, number>();
  for (const c of competitors ?? []) {
    competitorCountByUser.set(c.user_id, (competitorCountByUser.get(c.user_id) ?? 0) + 1);
  }
  const limitByUser = new Map((profiles ?? []).map((p) => [p.id, p.competitor_limit]));

  const rows = (userList?.users ?? [])
    .map((u) => ({
      id: u.id,
      email: u.email ?? '(no email)',
      createdAt: u.created_at,
      competitorLimit: limitByUser.get(u.id) ?? 1,
      competitorCount: competitorCountByUser.get(u.id) ?? 0,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <main className="min-h-screen bg-paper px-6 py-10 font-sans text-graphite sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cobalt">Admin</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Users</h1>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-cobalt hover:text-cobalt-hover">
            &larr; Dashboard
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-paper-surface">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-hairline-soft bg-paper-raised text-xs uppercase tracking-wide text-slate-dim">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Signed up</th>
                <th className="px-4 py-3 font-medium">Competitors</th>
                <th className="px-4 py-3 font-medium">Limit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-hairline-soft last:border-b-0">
                  <td className="px-4 py-3 text-graphite">{row.email}</td>
                  <td className="px-4 py-3 text-slate">
                    {new Date(row.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate">{row.competitorCount}</td>
                  <td className="px-4 py-3">
                    <form action={updateCompetitorLimit} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={row.id} />
                      <input
                        type="number"
                        name="limit"
                        min={0}
                        defaultValue={row.competitorLimit}
                        className="w-16 rounded-md border border-hairline-input bg-paper-surface px-2 py-1 text-sm text-graphite outline-none focus:border-cobalt"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-cobalt px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate">
                    No signed-up users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
