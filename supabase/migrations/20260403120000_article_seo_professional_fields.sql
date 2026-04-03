BEGIN;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS robots_index BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS robots_follow BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_schema_type TEXT NOT NULL DEFAULT 'NewsArticle',
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_alt TEXT;

COMMENT ON COLUMN articles.canonical_url IS 'Canonical URL override for the public article page';
COMMENT ON COLUMN articles.robots_index IS 'Whether search engines should index the article';
COMMENT ON COLUMN articles.robots_follow IS 'Whether search engines should follow article links';
COMMENT ON COLUMN articles.og_title IS 'Open Graph title override';
COMMENT ON COLUMN articles.og_description IS 'Open Graph description override';
COMMENT ON COLUMN articles.seo_schema_type IS 'Schema.org type used for structured data';
COMMENT ON COLUMN articles.focus_keyword IS 'Primary SEO keyword for editorial workflow';
COMMENT ON COLUMN articles.cover_image_alt IS 'Alt text override for the article cover image';

COMMIT;
