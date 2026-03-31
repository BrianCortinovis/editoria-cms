-- Add parent_id to site_pages for hierarchical page structure
ALTER TABLE site_pages ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES site_pages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_site_pages_parent_id ON site_pages(parent_id) WHERE parent_id IS NOT NULL;
