// Turns the flat, unstructured lines extracted from a competitor's pricing
// page (lib/scraper.ts's extractReadableText — one logical line per block
// element, no structure beyond that) into a lightweight shape a UI can give
// visual hierarchy to. This is a heuristic reading of arbitrary third-party
// markup, not a parser with a real spec — it will misclassify sometimes.
// Never used to save/report data, only to decide how one line should look.

export type ClassifiedLine =
  | { kind: 'intro'; text: string }
  | { kind: 'plan'; name: string | null; price: string }
  | { kind: 'description'; text: string }
  | { kind: 'section'; text: string }
  | { kind: 'feature'; text: string }
  | { kind: 'muted'; text: string };

// Requires an actual "$" — the earlier version also matched a bare
// "per/month"-style fragment with no dollar sign, which meant metered-usage
// line items ("1M / month included", "200k / month included") on
// consumption-pricing pages (Vercel's overage table, etc.) were misread as
// separate plan tiers. A real price always carries a $ amount somewhere.
const PRICE_RE = /\$\s?\d[\d,.]*/;
const SECTION_RE = /^(includes?|features?|what'?s included|plans?)\s*:?\s*$/i;
const CTA_RE =
  /^(sign up|get started|start( your)?( free)?( trial)?|try( it)? free|contact (sales|us)|book a demo|learn more|see (all )?plans|upgrade( now)?|subscribe|choose( this)? plan|select plan|buy now|talk to sales)$/i;
const PLAN_NAME_MAX_LENGTH = 24;
// A real price "tag" (`$0`, `$17`, `$12/user/mo`) is short. A sentence that
// merely mentions a dollar figure in passing (a billing footnote, a
// disclaimer) is not a price line, even though it matches PRICE_RE — cap the
// length so those don't get misclassified and rendered as a giant price.
const PRICE_LINE_MAX_LENGTH = 32;
const MAX_INTRO_LINES = 4;

function isPriceLine(line: string): boolean {
  return line.length <= PRICE_LINE_MAX_LENGTH && PRICE_RE.test(line);
}

function looksLikePlanName(line: string): boolean {
  return line.length <= PLAN_NAME_MAX_LENGTH && !/\d|\$/.test(line);
}

// Words that legitimately start a new "cell" in a glued plan/price/button
// blob (see splitGluedSegments below). Deliberately NOT a blanket
// lowercase→Capital rule — that also fires inside ordinary compound brand
// names with no space in the source ("GitHub", "YouTube"), splitting them
// into nonsense. Restricting to these known boundary words keeps the split
// targeted at the actual glue points without touching prose.
const GLUE_BOUNDARY_WORDS = [
  'Sign up', 'Get started', 'Try it free', 'Try free', 'Try now',
  'Contact sales', 'Contact us', 'Book a demo', 'Learn more', 'See all plans',
  'See plans', 'Upgrade now', 'Upgrade', 'Subscribe', 'Choose this plan',
  'Choose plan', 'Select plan', 'Buy now', 'Talk to sales', 'Start free trial',
  'Start trial', 'Get in touch',
  'Free', 'Plus', 'Pro', 'Business', 'Enterprise', 'Team', 'Starter',
  'Basic', 'Premium', 'Custom', 'Individual',
];
// (?![a-z]) instead of \b at the end: \b doesn't match between two letters
// at all, which is exactly the glued case being targeted ("...monthEnterprise").
// The negative lookahead still blocks matching "Pro" as a false prefix of
// "Professional" (a lowercase letter follows there) while allowing the
// trigger word to be glued directly onto what follows it too.
const GLUE_BOUNDARY_RE = new RegExp(
  `(?<=[a-z0-9])(?=(?:${GLUE_BOUNDARY_WORDS.join('|')})(?![a-z]))`,
  'g',
);

/**
 * Some sites' markup puts a plan name, its price, and its button all in one
 * DOM node with no separating whitespace at all — the extractor then hands
 * us one glued line like "Free$0 per seat/monthSign up" instead of three.
 * Undo the two glue patterns that actually occur (a label butted straight
 * into a "$price", and a word butted straight into the next plan/CTA label)
 * by splitting on them before classification runs.
 */
function splitGluedSegments(line: string): string[] {
  return line
    .replace(/([a-zA-Z])(\$)/g, '$1\n$2')
    .replace(GLUE_BOUNDARY_RE, '\n')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Inserts a space between a number and a trailing word — "$0per month" -> "$0 per month". */
export function formatPrice(price: string): string {
  return price.replace(/(\d)(per\b|\/)/i, '$1 $2');
}

export function classifyPricingLines(rawText: string): ClassifiedLine[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap(splitGluedSegments);

  const result: ClassifiedLine[] = [];
  let i = 0;

  // Leading lines before the first plan/price signal read as one intro paragraph.
  const introLines: string[] = [];
  while (i < lines.length && introLines.length < MAX_INTRO_LINES) {
    const line = lines[i];
    const planNameAhead =
      looksLikePlanName(line) && i + 1 < lines.length && isPriceLine(lines[i + 1]);
    if (isPriceLine(line) || planNameAhead) break;
    introLines.push(line);
    i++;
  }
  if (introLines.length) {
    result.push({ kind: 'intro', text: introLines.join(' ') });
  }

  let justEmittedPlan = false;

  for (; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];

    if (looksLikePlanName(line) && next && isPriceLine(next)) {
      result.push({ kind: 'plan', name: line, price: next });
      i++; // consume the paired price line
      justEmittedPlan = true;
      continue;
    }

    if (isPriceLine(line)) {
      result.push({ kind: 'plan', name: null, price: line });
      justEmittedPlan = true;
      continue;
    }

    if (SECTION_RE.test(line)) {
      result.push({ kind: 'section', text: line });
      justEmittedPlan = false;
      continue;
    }

    if (CTA_RE.test(line)) {
      result.push({ kind: 'muted', text: line });
      continue;
    }

    if (justEmittedPlan) {
      result.push({ kind: 'description', text: line });
      justEmittedPlan = false;
      continue;
    }

    result.push({ kind: 'feature', text: line });
  }

  return result;
}
