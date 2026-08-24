import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CompetitorsPanel } from '@/components/dashboard/CompetitorsPanel';
import { FREE_PLAN_COMPETITOR_LIMIT } from '@/lib/plan';
import { isAdminEmail } from '@/lib/admin';
import type { Competitor, DigestEvent, ScrapeAttempt, Snapshot } from '@/types/competitor';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: competitorsData }, { data: profile }] = await Promise.all([
    supabase.from('competitors').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('competitor_limit').eq('id', user.id).single(),
  ]);

  const competitors = (competitorsData as Competitor[]) ?? [];
  const competitorIds = competitors.map((c) => c.id);
  const competitorLimit = profile?.competitor_limit ?? FREE_PLAN_COMPETITOR_LIMIT;

  const [digestEventsResult, snapshotsResult, scrapeAttemptsResult] = competitorIds.length
    ? await Promise.all([
        supabase
          .from('digest_events')
          .select('*')
          .in('competitor_id', competitorIds)
          .order('detected_at', { ascending: false }),
        supabase
          .from('snapshots')
          .select('*')
          .in('competitor_id', competitorIds)
          .order('scraped_at', { ascending: false }),
        supabase
          .from('scrape_attempts')
          .select('*')
          .in('competitor_id', competitorIds)
          .order('attempted_at', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const digestEvents = (digestEventsResult.data as DigestEvent[]) ?? [];
  const snapshots = (snapshotsResult.data as Snapshot[]) ?? [];
  const scrapeAttempts = (scrapeAttemptsResult.data as ScrapeAttempt[]) ?? [];

  const planLabel = competitors.length >= competitorLimit ? 'Free plan · over limit' : 'Free plan';

  return (
    <main className="min-h-screen bg-paper font-sans text-graphite">
      <DashboardHeader planLabel={planLabel} isAdmin={isAdminEmail(user.email)} />
      <CompetitorsPanel
        userId={user.id}
        userEmail={user.email ?? ''}
        initialCompetitors={competitors}
        digestEvents={digestEvents}
        snapshots={snapshots}
        scrapeAttempts={scrapeAttempts}
        competitorLimit={competitorLimit}
      />
    </main>
  );
}
