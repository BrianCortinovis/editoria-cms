-- ============================================
-- WORDPRESS COMPATIBILITY FIELDS
-- ============================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS legacy_wp_id BIGINT,
  ADD COLUMN IF NOT EXISTS legacy_permalink TEXT,
  ADD COLUMN IF NOT EXISTS import_source TEXT,
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS import_metadata JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_articles_legacy_wp_id
  ON articles(tenant_id, legacy_wp_id)
  WHERE legacy_wp_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_articles_import_source
  ON articles(tenant_id, import_source)
  WHERE import_source IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_wp_import_unique
  ON articles(tenant_id, import_source, legacy_wp_id)
  WHERE import_source IS NOT NULL AND legacy_wp_id IS NOT NULL;
