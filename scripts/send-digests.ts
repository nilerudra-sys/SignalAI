import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

config({ path: '.env.local' });

import { DigestEmail, type DigestEmailCompetitorGroup } from '../emails/DigestEmail';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Signal <onboarding@resend.dev>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.');
  process.exit(1);
}
if (!RESEND_API_KEY) {
  console.error(
    'Missing RESEND_API_KEY in .env.local. Get one at https://resend.com/api-keys (see .env.example).',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY);
const resend = new Resend(RESEND_API_KEY);

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type DigestEventRow = {
  id: string;
  competitor_id: string;
  change_summary: string;
  change_type: 'pricing' | 'feature' | 'hiring' | 'other';
  why_it_matters: string;
  detected_at: string;
  competitor: { id: string; name: string; user_id: string } | null;
};

function weekLabel(): string {
  return `week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

async function main() {
  // Assumes this runs at least weekly, so "unsent" and "from the past week"
  // are effectively the same set — nothing older sits around unsent.
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  const { data, error } = await supabase
    .from('digest_events')
    .select('id, competitor_id, change_summary, change_type, why_it_matters, detected_at, competitor:competitors(id, name, user_id)')
    .is('sent_at', null)
    .gte('detected_at', sevenDaysAgo)
    .order('detected_at', { ascending: false });

  if (error) {
    console.error(`Failed to load unsent digest events: ${error.message}`);
    process.exit(1);
  }

  const events = (data ?? []) as unknown as DigestEventRow[];

  if (events.length === 0) {
    console.log('No unsent digest events from the past week. Nothing to send.');
    return;
  }

  const byUser = new Map<string, DigestEventRow[]>();
  for (const event of events) {
    if (!event.competitor) continue; // orphaned row safety net
    const userId = event.competitor.user_id;
    if (!byUser.has(userId)) byUser.set(userId, []);
    byUser.get(userId)!.push(event);
  }

  console.log(`Found unsent events for ${byUser.size} user(s).`);

  let failures = 0;

  for (const [userId, userEvents] of byUser) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    const email = userData?.user?.email;

    if (userError || !email) {
      console.error(`Could not resolve email for user ${userId}: ${userError?.message ?? 'no email on record'}`);
      failures += 1;
      continue;
    }

    const groupsByCompetitor = new Map<string, DigestEmailCompetitorGroup>();
    for (const event of userEvents) {
      const name = event.competitor!.name;
      if (!groupsByCompetitor.has(name)) groupsByCompetitor.set(name, { name, events: [] });
      groupsByCompetitor.get(name)!.events.push({
        id: event.id,
        change_type: event.change_type,
        change_summary: event.change_summary,
        why_it_matters: event.why_it_matters,
      });
    }
    const competitorGroups = [...groupsByCompetitor.values()];

    const { data: sent, error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your Signal digest — ${competitorGroups.length} competitor${competitorGroups.length === 1 ? '' : 's'}, ${userEvents.length} change${userEvents.length === 1 ? '' : 's'}`,
      react: DigestEmail({
        weekLabel: weekLabel(),
        competitorGroups,
        settingsUrl: `${SITE_URL}/settings`,
      }),
    });

    if (sendError) {
      console.error(`Failed to send to ${email}: ${sendError.message}`);
      failures += 1;
      continue;
    }

    console.log(`Sent digest to ${email} (${userEvents.length} event(s), id: ${sent?.id}).`);

    const eventIds = userEvents.map((e) => e.id);
    const { error: updateError } = await supabase
      .from('digest_events')
      .update({ sent_at: new Date().toISOString() })
      .in('id', eventIds);

    if (updateError) {
      console.error(`Sent the email but failed to mark events as sent: ${updateError.message}`);
      failures += 1;
    } else {
      console.log(`Marked ${eventIds.length} event(s) as sent.`);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} user(s) failed to receive their digest — see errors above.`);
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
