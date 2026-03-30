-- SEO Analysis History table
CREATE TABLE IF NOT EXISTS seo_analysis_history (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  article_count INT DEFAULT 0,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for tenant queries
CREATE INDEX IF NOT EXISTS idx_seo_analysis_tenant ON seo_analysis_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_analysis_date ON seo_analysis_history(analysis_date);

-- Optional: SEO recommendations table for storing actionable insights
CREATE TABLE IF NOT EXISTS seo_recommendations (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  article_id UUID,
  recommendation_type TEXT NOT NULL, -- 'meta_tag', 'keyword', 'readability', 'internal_link', 'schema'
  recommendation_text TEXT NOT NULL,
  priority INT DEFAULT 1, -- 1=high, 2=medium, 3=low
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'ignored'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_seo_recommendations_tenant ON seo_recommendations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_recommendations_article ON seo_recommendations(article_id);
CREATE INDEX IF NOT EXISTS idx_seo_recommendations_status ON seo_recommendations(status);
