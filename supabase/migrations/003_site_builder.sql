-- ============================================
-- EDITORIA CMS - Site Builder & Headless SDK
-- ============================================

-- Enum per tipo pagina
CREATE TYPE page_type AS ENUM (
  'homepage', 'article', 'category', 'tag', 'author',
  'search', 'contact', 'about', 'events', 'custom'
);

-- ============================================
-- SITE_CONFIG (Configurazione sito per tenant)
-- ============================================
CREATE TABLE site_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  theme JSONB NOT NULL DEFAULT '{
    "colors": {
      "primary": "#8B0000",
      "secondary": "#1a1a2e",
      "accent": "#d4a574",
      "background": "#ffffff",
      "surface": "#f8f9fa",
      "text": "#1a1a2e",
      "textSecondary": "#6c757d",
      "border": "#dee2e6"
    },
    "fonts": {
      "heading": "Playfair Display, serif",
      "body": "Inter, sans-serif",
      "mono": "JetBrains Mono, monospace"
    },
    "spacing": {
      "unit": 4,
      "containerMax": "1200px",
      "sectionGap": "48px"
    },
    "borderRadius": "8px"
  }',
  navigation JSONB NOT NULL DEFAULT '[]',
  footer JSONB NOT NULL DEFAULT '{"columns": [], "copyright": "", "links": []}',
  global_css TEXT,
  global_head TEXT,
  favicon_url TEXT,
  og_defaults JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_site_config_updated_at BEFORE UPDATE ON site_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SITE_PAGES (Pagine costruite col builder)
-- ============================================
CREATE TABLE site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  page_type page_type NOT NULL DEFAULT 'custom',
  meta JSONB NOT NULL DEFAULT '{}',
  blocks JSONB NOT NULL DEFAULT '[]',
  custom_css TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_site_pages_tenant ON site_pages(tenant_id, is_published);
CREATE INDEX idx_site_pages_slug ON site_pages(tenant_id, slug) WHERE is_published = true;
CREATE INDEX idx_site_pages_type ON site_pages(tenant_id, page_type);

CREATE TRIGGER tr_site_pages_updated_at BEFORE UPDATE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SITE_PAGE_REVISIONS (Storico versioni pagine)
-- ============================================
CREATE TABLE site_page_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES site_pages(id) ON DELETE CASCADE,
  blocks JSONB NOT NULL,
  meta JSONB,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_revisions_page ON site_page_revisions(page_id, created_at DESC);

-- ============================================
-- API_KEYS (Chiavi SDK per accesso headless)
-- ============================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{read}',
  rate_limit INT NOT NULL DEFAULT 100,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id) WHERE is_active = true;
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- ============================================
-- LAYOUT_TEMPLATES (Già usati nel codice, ora ufficiali)
-- ============================================
CREATE TABLE IF NOT EXISTS layout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, page_type)
);

CREATE TRIGGER tr_layout_templates_updated_at BEFORE UPDATE ON layout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- LAYOUT_SLOTS (Già usati nel codice, ora ufficiali)
-- ============================================
CREATE TABLE IF NOT EXISTS layout_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES layout_templates(id) ON DELETE CASCADE,
  slot_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'articles',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  max_items INT NOT NULL DEFAULT 10,
  sort_by TEXT NOT NULL DEFAULT 'published_at',
  sort_order TEXT NOT NULL DEFAULT 'desc',
  sort_index INT NOT NULL DEFAULT 0,
  layout_width TEXT NOT NULL DEFAULT 'full',
  layout_height TEXT NOT NULL DEFAULT 'auto',
  layout_grid_cols INT NOT NULL DEFAULT 1,
  layout_display TEXT NOT NULL DEFAULT 'grid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_layout_slots_template ON layout_slots(template_id, sort_index);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_slots ENABLE ROW LEVEL SECURITY;

-- SITE_CONFIG: visible to tenant members, editable by admins
CREATE POLICY "Site config visible to tenant members" ON site_config
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Admins can manage site config" ON site_config
  FOR ALL USING (get_user_role(tenant_id) IN ('super_admin', 'chief_editor'));

-- SITE_PAGES: visible to tenant members, editable by editors+
CREATE POLICY "Site pages visible to tenant members" ON site_pages
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Editors+ can manage site pages" ON site_pages
  FOR ALL USING (get_user_role(tenant_id) IN ('super_admin', 'chief_editor', 'editor'));

-- SITE_PAGE_REVISIONS: visible to tenant members, insertable by editors
CREATE POLICY "Page revisions visible to tenant members" ON site_page_revisions
  FOR SELECT USING (
    page_id IN (SELECT id FROM site_pages WHERE tenant_id IN (SELECT get_user_tenant_ids()))
  );

CREATE POLICY "Editors can create page revisions" ON site_page_revisions
  FOR INSERT WITH CHECK (changed_by = auth.uid());

-- API_KEYS: visible and manageable by super_admins only
CREATE POLICY "API keys visible to super admins" ON api_keys
  FOR SELECT USING (get_user_role(tenant_id) = 'super_admin');

CREATE POLICY "Super admins can manage API keys" ON api_keys
  FOR ALL USING (get_user_role(tenant_id) = 'super_admin');

-- LAYOUT_TEMPLATES
CREATE POLICY "Layout templates visible to tenant members" ON layout_templates
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Editors+ can manage layout templates" ON layout_templates
  FOR ALL USING (get_user_role(tenant_id) IN ('super_admin', 'chief_editor', 'editor'));

-- LAYOUT_SLOTS
CREATE POLICY "Layout slots visible to tenant members" ON layout_slots
  FOR SELECT USING (
    template_id IN (SELECT id FROM layout_templates WHERE tenant_id IN (SELECT get_user_tenant_ids()))
  );

CREATE POLICY "Editors+ can manage layout slots" ON layout_slots
  FOR ALL USING (
    template_id IN (SELECT id FROM layout_templates WHERE tenant_id IN (SELECT get_user_tenant_ids()))
  );
