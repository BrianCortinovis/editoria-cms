BEGIN;

CREATE OR REPLACE FUNCTION editoria_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tr_article_comments_updated_at ON article_comments;
CREATE TRIGGER tr_article_comments_updated_at
BEFORE UPDATE ON article_comments
FOR EACH ROW EXECUTE FUNCTION editoria_touch_updated_at();

DROP TRIGGER IF EXISTS tr_site_forms_updated_at ON site_forms;
CREATE TRIGGER tr_site_forms_updated_at
BEFORE UPDATE ON site_forms
FOR EACH ROW EXECUTE FUNCTION editoria_touch_updated_at();

DROP TRIGGER IF EXISTS tr_redirects_updated_at ON redirects;
CREATE TRIGGER tr_redirects_updated_at
BEFORE UPDATE ON redirects
FOR EACH ROW EXECUTE FUNCTION editoria_touch_updated_at();

DROP POLICY IF EXISTS "Users can read article categories from their tenants" ON article_categories;
CREATE POLICY "Users can read article categories from their tenants" ON article_categories
FOR SELECT
USING (
  article_id IN (
    SELECT id FROM articles
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can manage article categories from their tenants" ON article_categories;
CREATE POLICY "Users can manage article categories from their tenants" ON article_categories
FOR ALL
USING (
  article_id IN (
    SELECT id FROM articles
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  article_id IN (
    SELECT id FROM articles
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can read article comments from their tenants" ON article_comments;
CREATE POLICY "Users can read article comments from their tenants" ON article_comments
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage article comments from their tenants" ON article_comments;
CREATE POLICY "Users can manage article comments from their tenants" ON article_comments
FOR ALL
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

DROP POLICY IF EXISTS "Users can read article authors from their tenants" ON article_authors;
CREATE POLICY "Users can read article authors from their tenants" ON article_authors
FOR SELECT
USING (
  article_id IN (
    SELECT id FROM articles
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can manage article authors from their tenants" ON article_authors;
CREATE POLICY "Users can manage article authors from their tenants" ON article_authors
FOR ALL
USING (
  article_id IN (
    SELECT id FROM articles
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  article_id IN (
    SELECT id FROM articles
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can read forms from their tenants" ON site_forms;
CREATE POLICY "Users can read forms from their tenants" ON site_forms
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage forms from their tenants" ON site_forms;
CREATE POLICY "Users can manage forms from their tenants" ON site_forms
FOR ALL
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

DROP POLICY IF EXISTS "Users can read form submissions from their tenants" ON form_submissions;
CREATE POLICY "Users can read form submissions from their tenants" ON form_submissions
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage form submissions from their tenants" ON form_submissions;
CREATE POLICY "Users can manage form submissions from their tenants" ON form_submissions
FOR ALL
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

DROP POLICY IF EXISTS "Users can read redirects from their tenants" ON redirects;
CREATE POLICY "Users can read redirects from their tenants" ON redirects
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage redirects from their tenants" ON redirects;
CREATE POLICY "Users can manage redirects from their tenants" ON redirects
FOR ALL
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

COMMIT;
