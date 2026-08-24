import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PriceSearch } from '@/components/dashboard/PriceSearch';
import { PriceReadout } from '@/components/PriceReadout';
import { isAdminEmail } from '@/lib/admin';
import { hostnameOf } from '@/lib/hostname';
import { relativeTime } from '@/lib/relativeTime';
import type { Competitor, Snapshot } from '@/types/competitor';

export default async function PricesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: competitorsData } = await supabase
    .from('competitors')
    .select('*')
    .order('name', { ascending: true });

  const competitors = (competitorsData as Competitor[]) ?? [];
  const competitorIds = competitors.map((c) => c.id);

  const { data: snapshotsData } = competitorIds.length
    ? await supabase
        .from('snapshots')
        .select('*')
        .in('competitor_id', competitorIds)
        .eq('page_type', 'pricing')
        .order('scraped_at', { ascending: false })
    : { data: [] };

  const snapshots = (snapshotsData as Snapshot[]) ?? [];
  const latestPricingByCompetitor = new Map<string, Snapshot>();
  for (const snap of snapshots) {
    if (!latestPricingByCompetitor.has(snap.competitor_id)) {
      latestPricingByCompetitor.set(snap.competitor_id, snap);
    }
  }

  const trackedHostnames = new Set(competitors.map((c) => hostnameOf(c.website_url)));

  return (
    <main className="min-h-screen bg-paper font-sans text-graphite">
      <DashboardHeader isAdmin={isAdminEmail(user.email)} />

      <div className="mx-auto max-w-[1080px] px-6 pb-14 pt-6 sm:px-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-graphite">Current prices</h1>
        <p className="mt-1.5 text-[13.5px] text-slate">
          Search any competitor, or see what we last found for the ones you already track.
        </p>

        <div className="mt-4">
          <PriceSearch userId={user.id} trackedHostnames={trackedHostnames} />
        </div>

        <div className="mt-8 border-t border-hairline pt-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-graphite">
            Your tracked competitors
          </h2>

          {competitors.length === 0 ? (
            <p className="mt-2.5 rounded-[10px] border border-hairline bg-paper-surface px-4 py-4 text-[13.5px] text-slate">
              Nothing tracked yet. Search above, or add one from your{' '}
              <a href="/dashboard" className="font-medium text-cobalt">
                dashboard
              </a>
              .
            </p>
          ) : (
            <div className="mt-2.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {competitors.map((competitor) => {
                const snap = latestPricingByCompetitor.get(competitor.id);
                return (
                  <div
                    key={competitor.id}
                    className="overflow-hidden rounded-xl border border-hairline-card bg-paper-surface"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-hairline-soft bg-paper-raised px-3.5 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold text-graphite">
                          {competitor.name}
                        </div>
                        <div className="truncate font-mono text-[11px] text-slate-dim">
                          {hostnameOf(competitor.pricing_page_url)}
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-slate-dim">
                        {snap ? relativeTime(snap.scraped_at) : 'not checked yet'}
                      </span>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto px-3.5 py-3.5">
                      {snap ? (
                        <PriceReadout key={snap.id} excerpt={snap.raw_text} />
                      ) : (
                        <p className="text-[13px] leading-relaxed text-slate-dim">
                          No pricing snapshot yet — this fills in after the next scrape.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
