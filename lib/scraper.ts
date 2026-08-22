import * as cheerio from 'cheerio';

const MIN_TEXT_LENGTH = 300;
const FETCH_TIMEOUT_MS = 15_000;
const PLAYWRIGHT_TIMEOUT_MS = 30_000;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export type ScrapeResult = {
  url: string;
  text: string;
  renderedWith: 'fetch' | 'playwright';
  fetchedAt: string;
};

// Chrome, tracking, and boilerplate to strip before extracting readable text.
// Attribute selectors use a case-insensitive substring match so both
// "cookie-banner" and "CookieBanner" get caught.
const STRIP_SELECTORS = [
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  'iframe',
  'nav',
  'footer',
  'header',
  '[aria-hidden="true"]',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '[class*="cookie" i]',
  '[id*="cookie" i]',
  '[class*="banner" i]',
  '[class*="advert" i]',
  '[class*="sponsor" i]',
  '[class*="popup" i]',
  '[class*="modal" i]',
  '[class*="newsletter" i]',
  '[class*="social-share" i]',
  '[class*="share-buttons" i]',
];

// Elements whose boundaries should become line breaks in the extracted text.
// Cheerio's .text() otherwise concatenates every text node with no separator
// at all, which would turn an entire page into a single line — useless for
// both reading and line-based diffing.
const BLOCK_SELECTORS =
  'p, li, h1, h2, h3, h4, h5, h6, div, tr, dt, dd, blockquote, section, article';

/**
 * Extracts clean, readable text from a raw HTML document: strips scripts,
 * nav/header/footer chrome, and common ad/cookie-banner/newsletter patterns,
 * inserts line breaks at block-element boundaries, then prefers the page's
 * main content region if one is identifiable.
 */
export function extractReadableText(html: string): string {
  const $ = cheerio.load(html);

  for (const selector of STRIP_SELECTORS) {
    $(selector).remove();
  }
  $('[style*="display:none"], [style*="display: none"], [hidden]').remove();

  const mainSelector = ['main', '[role="main"]', 'article'].find(
    (selector) => $(selector).first().length > 0,
  );
  const root = mainSelector ? $(mainSelector).first() : $('body');

  root.find('br').replaceWith('\n');
  root.find(BLOCK_SELECTORS).append('\n');

  const rawText = root.text();

  return rawText
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Fetch failed with status ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Renders the page in headless Chromium and returns the fully-rendered HTML.
 * Playwright is imported dynamically since it's only needed on this path —
 * the common case (fetchHtml + Cheerio) never pays for it.
 */
async function fetchHtmlWithPlaywright(url: string): Promise<string> {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ userAgent: USER_AGENT });
    await page.goto(url, { waitUntil: 'networkidle', timeout: PLAYWRIGHT_TIMEOUT_MS });
    return await page.content();
  } finally {
    await browser.close();
  }
}

/**
 * Scrapes a URL and returns clean readable text. Tries a plain fetch +
 * Cheerio parse first (fast, no browser). If that fails outright, or the
 * extracted text is too thin to be real content — the common signature of a
 * client-rendered page whose initial HTML is just an empty app shell — it
 * falls back to rendering the page in headless Chromium via Playwright.
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  try {
    const html = await fetchHtml(url);
    const text = extractReadableText(html);
    if (text.length >= MIN_TEXT_LENGTH) {
      return { url, text, renderedWith: 'fetch', fetchedAt: new Date().toISOString() };
    }
  } catch {
    // Plain fetch failed (network error, non-2xx, timeout) — fall through
    // to Playwright rather than surfacing this as a hard failure.
  }

  const html = await fetchHtmlWithPlaywright(url);
  const text = extractReadableText(html);
  return { url, text, renderedWith: 'playwright', fetchedAt: new Date().toISOString() };
}
