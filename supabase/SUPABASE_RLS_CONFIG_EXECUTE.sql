-- Enable RLS on all critical tables
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analysis_history ENABLE ROW LEVEL SECURITY;

-- user_tenants: Users can read their own tenant associations
CREATE POLICY "Users can read own tenant associations" ON user_tenants
FOR SELECT
USING (auth.uid() = user_id);

-- site_pages: Users can read pages from their tenants
CREATE POLICY "Users can read pages from their tenants" ON site_pages
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- site_pages: Users can insert pages to their tenants
CREATE POLICY "Users can create pages in their tenants" ON site_pages
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- site_pages: Users can update pages in their tenants
CREATE POLICY "Users can update pages in their tenants" ON site_pages
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- site_pages: Users can delete pages in their tenants
CREATE POLICY "Users can delete pages in their tenants" ON site_pages
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- blocks: Users can read blocks from their pages
CREATE POLICY "Users can read blocks from their pages" ON blocks
FOR SELECT
USING (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- blocks: Users can insert blocks to their pages
CREATE POLICY "Users can create blocks in their pages" ON blocks
FOR INSERT
WITH CHECK (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- blocks: Users can update blocks in their pages
CREATE POLICY "Users can update blocks in their pages" ON blocks
FOR UPDATE
USING (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- blocks: Users can delete blocks in their pages
CREATE POLICY "Users can delete blocks in their pages" ON blocks
FOR DELETE
USING (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- articles: Users can read articles from their tenants
CREATE POLICY "Users can read articles from their tenants" ON articles
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- articles: Users can insert articles to their tenants
CREATE POLICY "Users can create articles in their tenants" ON articles
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- articles: Users can update articles in their tenants
CREATE POLICY "Users can update articles in their tenants" ON articles
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- articles: Users can delete articles in their tenants
CREATE POLICY "Users can delete articles in their tenants" ON articles
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- content_slots: Users can read content slots from their pages
CREATE POLICY "Users can read content slots from their pages" ON content_slots
FOR SELECT
USING (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- content_slots: Users can insert content slots to their pages
CREATE POLICY "Users can create content slots in their pages" ON content_slots
FOR INSERT
WITH CHECK (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- content_slots: Users can update content slots in their pages
CREATE POLICY "Users can update content slots in their pages" ON content_slots
FOR UPDATE
USING (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- content_slots: Users can delete content slots in their pages
CREATE POLICY "Users can delete content slots in their pages" ON content_slots
FOR DELETE
USING (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- seo_analysis_history: Users can read SEO analysis from their tenants
CREATE POLICY "Users can read SEO analysis from their tenants" ON seo_analysis_history
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);
