BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_storage_provider_kind') THEN
    CREATE TYPE media_storage_provider_kind AS ENUM ('supabase', 'cloudflare_r2', 'customer_vps_local');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS site_storage_quotas (
  site_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  media_provider media_storage_provider_kind NOT NULL DEFAULT 'supabase',
  published_media_provider media_storage_provider_kind NOT NULL DEFAULT 'supabase',
  soft_limit_bytes BIGINT NOT NULL DEFAULT 1073741824,
  hard_limit_bytes BIGINT NOT NULL DEFAULT 1610612736,
  monthly_egress_limit_bytes BIGINT,
  upload_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  publish_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_storage_quotas_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_site_storage_quotas_provider
  ON site_storage_quotas(media_provider, published_media_provider);

CREATE TABLE IF NOT EXISTS site_usage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'manual_recalc',
  media_library_bytes BIGINT NOT NULL DEFAULT 0,
  media_object_count INTEGER NOT NULL DEFAULT 0,
  published_media_bytes BIGINT NOT NULL DEFAULT 0,
  published_object_count INTEGER NOT NULL DEFAULT 0,
  estimated_monthly_egress_bytes BIGINT NOT NULL DEFAULT 0,
  article_count INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  form_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_usage_snapshots_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_site_usage_snapshots_site_measured
  ON site_usage_snapshots(site_id, measured_at DESC);

ALTER TABLE site_storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_usage_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to site storage quotas" ON site_storage_quotas;
CREATE POLICY "No direct access to site storage quotas" ON site_storage_quotas
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

DROP POLICY IF EXISTS "No direct access to site usage snapshots" ON site_usage_snapshots;
CREATE POLICY "No direct access to site usage snapshots" ON site_usage_snapshots
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

DROP TRIGGER IF EXISTS trg_site_storage_quotas_updated_at ON site_storage_quotas;
CREATE TRIGGER trg_site_storage_quotas_updated_at
  BEFORE UPDATE ON site_storage_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_updated_at();

COMMIT;
