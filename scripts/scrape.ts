import { config } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
import { scrapeUrl } from '../lib/scraper';
import { diffSnapshots, formatDiff } from '../lib/diff';
import { summarizeChange } from '../lib/summarize';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.\n' +
      'SUPABASE_SECRET_KEY is the project’s Secret key (Project Settings -> API) — ' +
      'this script needs it to bypass RLS and write snapshots directly.',
  );
  process.exit(1);
}

// Service-role client: bypasses RLS. Never expose SUPABASE_SECRET_KEY to the
// browser or commit it — it has full read/write access to every table.
const supabase = createClient(SUPABASE_URL, SECRET_KEY);

type Competitor = {
  id: string;
  name: string;
  pricing_page_url: string;
  changelog_url: string | null;
};

type ScrapeTarget = { pageType: 'pricing' | 'changelog'; url: string };

async function scrapeCompetitor(supabase: SupabaseClient, competitor: Competitor) {
  console.log(`\nScraping "${competitor.name}"`);

  const targets: ScrapeTarget[] = [{ pageType: 'pricing', url: competitor.pricing_page_url }];
  if (competitor.changelog_url) {
    targets.push({ pageType: 'changelog', url: competitor.changelog_url });
  } else {
    console.log('(no changelog_url set — skipping)');
  }

  for (const target of targets) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${target.pageType.toUpperCase()}: ${target.url}`);
    console.log('='.repeat(70));

    try {
      const result = await scrapeUrl(target.url);
      console.log(`Rendered with: ${result.renderedWith}`);
      console.log(`Extracted length: ${result.text.length} characters\n`);
      console.log(result.text);

      const { error: insertError } = await supabase.from('snapshots').insert({
        competitor_id: competitor.id,
        page_type: target.pageType,
        raw_text: result.text,
        scraped_at: result.fetchedAt,
      });

      if (insertError) {
        console.error(`\nFailed to save snapshot: ${insertError.message}`);
        continue;
      }

      console.log(`\nSaved snapshot (${target.pageType}).`);

      const { data: recent, error: recentError } = await supabase
        .from('snapshots')
        .select('raw_text, scraped_at')
        .eq('competitor_id', competitor.id)
        .eq('page_type', target.pageType)
        .order('scraped_at', { ascending: false })
        .limit(2);

      if (recentError) {
        console.error(`Could not check for changes: ${recentError.message}`);
      } else if (!recent || recent.length < 2) {
        console.log('First snapshot for this page — nothing to compare yet.');
      } else {
        const [current, previous] = recent;
        const diffResult = diffSnapshots(previous.raw_text, current.raw_text);

        if (diffResult.hasMeaningfulChange) {
          const n = diffResult.lines.length;
          console.log(`\nChange detected since ${previous.scraped_at} (${n} line${n === 1 ? '' : 's'}):`);
          console.log(formatDiff(diffResult));

          try {
            const summary = await summarizeChange({
              competitorName: competitor.name,
              pageType: target.pageType,
              diffText: formatDiff(diffResult),
            });

            console.log(`\nSummary [${summary.change_type}]: ${summary.headline}`);
            console.log(`Why it matters: ${summary.why_it_matters}`);

            const { error: eventError } = await supabase.from('digest_events').insert({
              competitor_id: competitor.id,
              change_summary: summary.headline,
              why_it_matters: summary.why_it_matters,
              change_type: summary.change_type,
              source_url: target.url,
              detected_at: result.fetchedAt,
            });

            if (eventError) {
              console.error(`Failed to save digest event: ${eventError.message}`);
            } else {
              console.log('Saved digest event.');
            }
          } catch (summarizeErr) {
            console.error(
              `Failed to summarize change: ${summarizeErr instanceof Error ? summarizeErr.message : summarizeErr}`,
            );
          }
        } else {
          console.log(`No meaningful change since ${previous.scraped_at}.`);
        }
      }
    } catch (err) {
      console.error(`Failed to scrape ${target.url}: ${err instanceof Error ? err.message : err}`);
    }
  }
}

async function main() {
  const competitorId = process.argv[2];

  if (competitorId) {
    const { data: competitor, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', competitorId)
      .single();

    if (error || !competitor) {
      console.error(`Competitor ${competitorId} not found: ${error?.message ?? 'no matching row'}`);
      process.exit(1);
    }

    await scrapeCompetitor(supabase, competitor);
    return;
  }

  // No competitor_id given — scrape every tracked competitor. This is the
  // mode the weekly GitHub Actions job runs (see .github/workflows).
  const { data: competitors, error } = await supabase.from('competitors').select('*');

  if (error) {
    console.error(`Failed to list competitors: ${error.message}`);
    process.exit(1);
  }

  if (!competitors || competitors.length === 0) {
    console.log('No tracked competitors. Nothing to scrape.');
    return;
  }

  console.log(`Scraping ${competitors.length} competitor(s)...`);

  let failures = 0;
  for (const competitor of competitors) {
    try {
      await scrapeCompetitor(supabase, competitor);
    } catch (err) {
      failures += 1;
      console.error(
        `\nUnhandled error scraping "${competitor.name}": ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Done. ${competitors.length - failures}/${competitors.length} competitors scraped without a fatal error.`);

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
