-- ============================================
-- PAGE HIERARCHY & SEO OPTIMIZATION
-- ============================================

-- Add hierarchy and SEO fields to site_pages
ALTER TABLE site_pages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES site_pages(id) ON DELETE CASCADE;
ALTER TABLE site_pages ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE site_pages ADD COLUMN IF NOT EXISTS path TEXT NOT NULL DEFAULT ''; -- cached full path for performance
ALTER TABLE site_pages ADD COLUMN IF NOT EXISTS depth INT NOT NULL DEFAULT 0; -- hierarchy depth (0=root)
ALTER TABLE site_pages ADD COLUMN IF NOT EXISTS breadcrumb JSONB DEFAULT '[]'; -- cached breadcrumb for fast SEO
ALTER TABLE site_pages ADD COLUMN IF NOT EXISTS seo_slug TEXT NOT NULL DEFAULT ''; -- cached SEO-friendly slug

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_pages_parent_id ON site_pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_site_pages_tenant_parent ON site_pages(tenant_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_site_pages_path ON site_pages(tenant_id, path);
CREATE INDEX IF NOT EXISTS idx_site_pages_seo_slug ON site_pages(tenant_id, seo_slug);
CREATE INDEX IF NOT EXISTS idx_site_pages_depth ON site_pages(tenant_id, depth);
CREATE INDEX IF NOT EXISTS idx_site_pages_sort ON site_pages(tenant_id, parent_id, sort_order);

-- Function to recursively update page hierarchy
CREATE OR REPLACE FUNCTION update_page_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_parent_path TEXT;
  v_parent_slug TEXT;
  v_parent_depth INT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    -- Root page
    NEW.depth := 0;
    NEW.path := '/' || NEW.slug;
    NEW.seo_slug := NEW.slug;
  ELSE
    -- Get parent info
    SELECT path, slug, depth INTO v_parent_path, v_parent_slug, v_parent_depth
    FROM site_pages WHERE id = NEW.parent_id;

    IF FOUND THEN
      NEW.depth := v_parent_depth + 1;
      NEW.path := v_parent_path || '/' || NEW.slug;
      NEW.seo_slug := v_parent_slug || '/' || NEW.slug;
    END IF;
  END IF;

  -- Build breadcrumb
  WITH RECURSIVE page_tree AS (
    SELECT id, title, slug, parent_id, 0 as level
    FROM site_pages
    WHERE id = NEW.id

    UNION ALL

    SELECT p.id, p.title, p.slug, p.parent_id, pt.level + 1
    FROM site_pages p
    INNER JOIN page_tree pt ON p.id = pt.parent_id
  )
  SELECT jsonb_agg(
    jsonb_build_object('title', title, 'slug', slug)
    ORDER BY level DESC
  ) INTO NEW.breadcrumb
  FROM page_tree;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update hierarchy
DROP TRIGGER IF EXISTS trg_update_page_hierarchy ON site_pages;
CREATE TRIGGER trg_update_page_hierarchy
BEFORE INSERT OR UPDATE ON site_pages
FOR EACH ROW
EXECUTE FUNCTION update_page_hierarchy();

-- Materialized view for fast page tree queries (refresh every hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS page_hierarchy_view AS
WITH RECURSIVE page_tree AS (
  SELECT
    id,
    tenant_id,
    title,
    slug,
    parent_id,
    path,
    depth,
    sort_order,
    seo_slug,
    breadcrumb,
    0 as level
  FROM site_pages
  WHERE parent_id IS NULL

  UNION ALL

  SELECT
    p.id,
    p.tenant_id,
    p.title,
    p.slug,
    p.parent_id,
    p.path,
    p.depth,
    p.sort_order,
    p.seo_slug,
    p.breadcrumb,
    pt.level + 1
  FROM site_pages p
  INNER JOIN page_tree pt ON p.parent_id = pt.id
)
SELECT
  id,
  tenant_id,
  title,
  slug,
  parent_id,
  path,
  depth,
  sort_order,
  seo_slug,
  breadcrumb,
  level
FROM page_tree
ORDER BY tenant_id, parent_id, sort_order;

CREATE UNIQUE INDEX IF NOT EXISTS idx_page_hierarchy_view ON page_hierarchy_view(id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_page_hierarchy()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY page_hierarchy_view;
END;
$$ LANGUAGE plpgsql;

-- Audit table for page changes
CREATE TABLE IF NOT EXISTS page_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES site_pages(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'move'
  changes JSONB NOT NULL, -- what changed
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_audit_tenant ON page_audit_log(tenant_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_audit_page ON page_audit_log(page_id);

-- Enable RLS for audit table
ALTER TABLE page_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their tenant"
  ON page_audit_log FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));
