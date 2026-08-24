export type Competitor = {
  id: string;
  user_id: string;
  name: string;
  website_url: string;
  pricing_page_url: string;
  changelog_url: string | null;
  created_at: string;
};

export type Snapshot = {
  id: string;
  competitor_id: string;
  page_type: 'pricing' | 'changelog';
  raw_text: string;
  scraped_at: string;
};

export type DigestEvent = {
  id: string;
  competitor_id: string;
  change_summary: string;
  change_type: 'pricing' | 'feature' | 'hiring' | 'other';
  source_url: string | null;
  detected_at: string;
  sent_at: string | null;
};

export type ScrapeAttempt = {
  id: string;
  competitor_id: string;
  page_type: 'pricing' | 'changelog';
  status: 'success' | 'error';
  error_message: string | null;
  attempted_at: string;
};
