-- Multilingual support: article translations linking table
-- Links articles in different languages together as translation groups

-- Add language field to articles if not exists
ALTER TABLE articles ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'it';

-- Translation groups: articles that are translations of each other
CREATE TABLE IF NOT EXISTS article_translation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES article_translation_groups(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id),
  UNIQUE(group_id, language)
);

CREATE INDEX idx_article_translations_group ON article_translations(group_id);
CREATE INDEX idx_article_translations_article ON article_translations(article_id);
CREATE INDEX idx_article_translations_tenant_lang ON article_translations(tenant_id, language);

-- Add language to pages too
ALTER TABLE site_pages ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'it';

-- Site supported languages stored in tenant settings
-- tenantSettings.supported_languages = ["it", "en", "de"]
-- tenantSettings.default_language = "it"

COMMENT ON TABLE article_translation_groups IS 'Groups articles that are translations of each other';
COMMENT ON TABLE article_translations IS 'Links individual articles to their translation group with language code';
COMMENT ON COLUMN articles.language IS 'ISO 639-1 language code for this article content';
