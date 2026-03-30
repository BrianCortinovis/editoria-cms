-- Content Zones: gestione zone slideshow, carousel, banner, video del sito
-- Le zone vengono mostrate nel CMS solo se il sito linkato le dichiara

CREATE TABLE IF NOT EXISTS content_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  zone_key TEXT NOT NULL,
  label TEXT NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'slideshow',  -- slideshow | banner | video | ticker | carousel
  description TEXT DEFAULT '',
  source_mode TEXT NOT NULL DEFAULT 'auto',      -- auto | manual | category | featured
  source_config JSONB NOT NULL DEFAULT '{}',     -- { category_slug, limit, featured_only, etc. }
  items JSONB NOT NULL DEFAULT '[]',             -- manual items: [{ title, image_url, link_url, ... }]
  max_items INT NOT NULL DEFAULT 8,
  auto_interval_ms INT NOT NULL DEFAULT 5000,    -- rotazione automatica in ms
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, zone_key)
);

ALTER TABLE content_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read content_zones for their tenants" ON content_zones
FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
);

CREATE POLICY "Editors can manage content_zones for their tenants" ON content_zones
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'chief_editor', 'editor')
  )
);
