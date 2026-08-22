import { GoogleGenAI, Type } from '@google/genai';

export type ChangeType = 'pricing' | 'feature' | 'hiring' | 'other';

export type ChangeSummary = {
  change_type: ChangeType;
  headline: string;
  why_it_matters: string;
};

export type SummarizeInput = {
  competitorName: string;
  pageType: 'pricing' | 'changelog';
  diffText: string;
};

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const VALID_CHANGE_TYPES: ChangeType[] = ['pricing', 'feature', 'hiring', 'other'];

const SYSTEM_INSTRUCTION = `You analyze diffs of a competitor's webpage for a solo SaaS founder's
competitive-intelligence tool.

You will receive the competitor's name, which page was scraped ("pricing" or
"changelog"), and a diff showing exactly what changed: lines starting with
"+" were added, lines starting with "-" were removed.

Ground rules — follow these exactly:
- Base your summary ONLY on what is explicitly shown in the diff lines. Do
  not invent, infer, or add any number, date, feature name, plan name, or
  detail that is not literally present in the diff.
- If a specific value (a price, a plan name, a feature name) appears in the
  diff, use that exact value in your headline verbatim. Do not round,
  estimate, or paraphrase numbers.
- If the diff is ambiguous, fragmentary, or you genuinely cannot tell what it
  means, write a headline and why_it_matters that honestly reflect that
  uncertainty rather than guessing at a plausible-sounding change.

Classify change_type as exactly one of:
- "pricing": a price, plan, tier, discount, or billing change
- "feature": a product feature, capability, or integration that was added,
  changed, or removed
- "hiring": a new job posting or open role
- "other": anything that doesn't clearly fit the above

Then write:
- headline: one factual sentence stating what changed, in plain English,
  using the actual values/names from the diff
- why_it_matters: 1-2 sentences in plain English explaining why a solo SaaS
  founder competing with this company should care — grounded only in what
  the diff shows, not speculation about the competitor's broader strategy
  unless the diff itself supports it

Return only the JSON object described by the response schema — no markdown,
no commentary, no text outside the JSON.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    change_type: { type: Type.STRING, enum: VALID_CHANGE_TYPES },
    headline: { type: Type.STRING },
    why_it_matters: { type: Type.STRING },
  },
  required: ['change_type', 'headline', 'why_it_matters'],
};

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set (see .env.example).');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function parseAndValidate(raw: string): ChangeSummary {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Gemini did not return valid JSON: ${raw.slice(0, 200)}`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Gemini response was not a JSON object.');
  }

  const value = parsed as Record<string, unknown>;

  if (
    typeof value.change_type !== 'string' ||
    !VALID_CHANGE_TYPES.includes(value.change_type as ChangeType)
  ) {
    throw new Error(`Gemini returned an invalid change_type: ${String(value.change_type)}`);
  }
  if (typeof value.headline !== 'string' || !value.headline.trim()) {
    throw new Error('Gemini response is missing a headline.');
  }
  if (typeof value.why_it_matters !== 'string' || !value.why_it_matters.trim()) {
    throw new Error('Gemini response is missing why_it_matters.');
  }

  return {
    change_type: value.change_type as ChangeType,
    headline: value.headline.trim(),
    why_it_matters: value.why_it_matters.trim(),
  };
}

/**
 * Summarizes a plain-text diff (from lib/diff.ts) into a structured,
 * founder-readable change summary using Gemini. Uses JSON-schema-constrained
 * output plus low temperature to keep the model grounded in the diff rather
 * than inventing plausible-sounding details.
 */
export async function summarizeChange(input: SummarizeInput): Promise<ChangeSummary> {
  const ai = getClient();

  const prompt = [
    `Competitor: ${input.competitorName}`,
    `Page type: ${input.pageType}`,
    '',
    'Diff:',
    input.diffText,
  ].join('\n');

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return parseAndValidate(text);
}
