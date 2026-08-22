import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
import { scrapeUrl } from '../lib/scraper';
import { diffSnapshots, formatDiff } from '../lib/diff';
import { summarizeChange } from '../lib/summarize';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.\n' +
      'SUPABASE_SECRET_KEY is the project’s Secret key (Project Settings -> API) — ' +
      'this script needs it to bypass RLS and write snapshots directly.',
  );
  process.exit(1);
}

const competitorId = process.argv[2];
if (!competitorId) {
  console.error('Usage: npm run scrape -- <competitor_id>');
  process.exit(1);
}

// Service-role client: bypasses RLS. Never expose SUPABASE_SECRET_KEY to the
// browser or commit it — it has full read/write access to every table.
const supabase = createClient(SUPABASE_URL, SECRET_KEY);

type ScrapeTarget = { pageType: 'pricing' | 'changelog'; url: string };

async function main() {
  const { data: competitor, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', competitorId)
    .single();

  if (error || !competitor) {
    console.error(`Competitor ${competitorId} not found: ${error?.message ?? 'no matching row'}`);
    process.exit(1);
  }

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

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
