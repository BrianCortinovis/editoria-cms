-- ============================================
-- SUPERADMIN CONTROL PLANE
-- Global infrastructure and publish orchestration
-- above Platform App and Cloud CMS.
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'infrastructure_stack_kind') THEN
    CREATE TYPE infrastructure_stack_kind AS ENUM ('shared', 'dedicated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deployment_target_kind') THEN
    CREATE TYPE deployment_target_kind AS ENUM ('vercel_managed', 'customer_vps', 'static_bundle');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'publish_release_status') THEN
    CREATE TYPE publish_release_status AS ENUM ('draft', 'building', 'ready', 'active', 'failed', 'rolled_back');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'publish_job_status') THEN
    CREATE TYPE publish_job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS site_infrastructure (
  site_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stack_kind infrastructure_stack_kind NOT NULL DEFAULT 'shared',
  supabase_project_ref TEXT,
  supabase_url TEXT,
  deploy_target_kind deployment_target_kind NOT NULL DEFAULT 'vercel_managed',
  deploy_target_label TEXT,
  public_base_url TEXT,
  media_storage_label TEXT,
  publish_strategy TEXT NOT NULL DEFAULT 'published-static-json',
  config JSONB NOT NULL DEFAULT '{}',
  last_publish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_infrastructure_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_site_infrastructure_stack_kind
  ON site_infrastructure(stack_kind, deploy_target_kind);

CREATE TABLE IF NOT EXISTS deploy_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind deployment_target_kind NOT NULL,
  label TEXT NOT NULL,
  hostname TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT deploy_targets_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deploy_targets_site_active
  ON deploy_targets(site_id, is_active, updated_at DESC);

CREATE TABLE IF NOT EXISTS publish_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  status publish_release_status NOT NULL DEFAULT 'draft',
  manifest_path TEXT,
  payload_checksum TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activated_at TIMESTAMPTZ,
  rolled_back_from_release_id UUID REFERENCES publish_releases(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT publish_releases_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_publish_releases_site_version
  ON publish_releases(site_id, version_label);
CREATE INDEX IF NOT EXISTS idx_publish_releases_site_status
  ON publish_releases(site_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  release_id UUID REFERENCES publish_releases(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,
  status publish_job_status NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT publish_jobs_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_site_status
  ON publish_jobs(site_id, status, created_at DESC);

ALTER TABLE site_infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE deploy_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to site infrastructure" ON site_infrastructure;
CREATE POLICY "No direct access to site infrastructure" ON site_infrastructure
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

DROP POLICY IF EXISTS "No direct access to deploy targets" ON deploy_targets;
CREATE POLICY "No direct access to deploy targets" ON deploy_targets
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

DROP POLICY IF EXISTS "No direct access to publish releases" ON publish_releases;
CREATE POLICY "No direct access to publish releases" ON publish_releases
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

DROP POLICY IF EXISTS "No direct access to publish jobs" ON publish_jobs;
CREATE POLICY "No direct access to publish jobs" ON publish_jobs
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

DROP TRIGGER IF EXISTS trg_site_infrastructure_updated_at ON site_infrastructure;
CREATE TRIGGER trg_site_infrastructure_updated_at
  BEFORE UPDATE ON site_infrastructure
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_updated_at();

DROP TRIGGER IF EXISTS trg_deploy_targets_updated_at ON deploy_targets;
CREATE TRIGGER trg_deploy_targets_updated_at
  BEFORE UPDATE ON deploy_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_updated_at();

DROP TRIGGER IF EXISTS trg_publish_releases_updated_at ON publish_releases;
CREATE TRIGGER trg_publish_releases_updated_at
  BEFORE UPDATE ON publish_releases
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_updated_at();
