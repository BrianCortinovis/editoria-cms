-- ============================================
-- PLATFORM APP FOUNDATION
-- Safe additive schema for the platform layer.
-- Keeps the current CMS centered on tenant_id while
-- introducing site-centric platform entities.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_membership_role') THEN
    CREATE TYPE platform_membership_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'site_status') THEN
    CREATE TYPE site_status AS ENUM ('provisioning', 'active', 'suspended', 'archived', 'deleted');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'domain_status') THEN
    CREATE TYPE domain_status AS ENUM ('pending', 'verifying', 'active', 'failed', 'removed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'domain_kind') THEN
    CREATE TYPE domain_kind AS ENUM ('platform_subdomain', 'custom', 'redirect');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'domain_verification_method') THEN
    CREATE TYPE domain_verification_method AS ENUM ('txt', 'cname', 'http', 'manual');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'paused');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_severity') THEN
    CREATE TYPE notification_severity AS ENUM ('info', 'warning', 'critical');
  END IF;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'it',
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Rome',
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS security_preferences JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug CITEXT NOT NULL UNIQUE,
  default_subdomain CITEXT NOT NULL UNIQUE,
  cms_base_path TEXT NOT NULL DEFAULT '/dashboard',
  status site_status NOT NULL DEFAULT 'provisioning',
  template_key TEXT,
  language_code TEXT NOT NULL DEFAULT 'it',
  category TEXT,
  onboarding_state JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sites_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT sites_default_subdomain_format CHECK (default_subdomain ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX IF NOT EXISTS idx_sites_owner_user_id ON sites(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_id_tenant_id ON sites(id, tenant_id);

CREATE TABLE IF NOT EXISTS tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role platform_membership_role NOT NULL,
  invited_email CITEXT,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (site_id, user_id),
  CONSTRAINT tenant_memberships_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_id ON tenant_memberships(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_id ON tenant_memberships(tenant_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS site_settings_platform (
  site_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  default_locale TEXT NOT NULL DEFAULT 'it',
  timezone TEXT NOT NULL DEFAULT 'Europe/Rome',
  onboarding_checklist JSONB NOT NULL DEFAULT '{}',
  feature_flags JSONB NOT NULL DEFAULT '{}',
  notification_settings JSONB NOT NULL DEFAULT '{}',
  billing_state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_settings_platform_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS site_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hostname CITEXT NOT NULL,
  kind domain_kind NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status domain_status NOT NULL DEFAULT 'pending',
  verification_method domain_verification_method NOT NULL DEFAULT 'txt',
  verification_token TEXT,
  verification_instructions JSONB NOT NULL DEFAULT '[]',
  dns_records JSONB NOT NULL DEFAULT '[]',
  ssl_status TEXT NOT NULL DEFAULT 'pending',
  redirect_www BOOLEAN NOT NULL DEFAULT TRUE,
  attached_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_domains_hostname_unique UNIQUE (hostname),
  CONSTRAINT site_domains_hostname_format CHECK (hostname !~ '[:/]'),
  CONSTRAINT site_domains_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_site_domains_site_id ON site_domains(site_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_site_domains_tenant_id ON site_domains(tenant_id) WHERE removed_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_domains_primary_per_site
  ON site_domains(site_id)
  WHERE is_primary = TRUE AND removed_at IS NULL;

CREATE TABLE IF NOT EXISTS domain_verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_domain_id UUID NOT NULL REFERENCES site_domains(id) ON DELETE CASCADE,
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  status domain_status NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT domain_verification_events_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_domain_verification_events_domain_id
  ON domain_verification_events(site_domain_id, created_at DESC);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL UNIQUE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'manual',
  plan_code TEXT NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'trialing',
  external_customer_id TEXT,
  external_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  limits JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (site_id, metric_key, window_start, window_end),
  CONSTRAINT usage_metrics_site_fk
    FOREIGN KEY (site_id, tenant_id)
    REFERENCES sites(id, tenant_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_site_window
  ON usage_metrics(site_id, metric_key, window_start DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity notification_severity NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read_at, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_site_created
  ON audit_logs(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created
  ON audit_logs(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id
  ON active_sessions(user_id, revoked_at, expires_at DESC);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings_platform ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_site_member(p_site_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenant_memberships tm
    WHERE tm.site_id = p_site_id
      AND tm.user_id = p_user_id
      AND tm.revoked_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION has_site_role(
  p_site_id UUID,
  p_roles platform_membership_role[],
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenant_memberships tm
    WHERE tm.site_id = p_site_id
      AND tm.user_id = p_user_id
      AND tm.revoked_at IS NULL
      AND tm.role = ANY (p_roles)
  );
$$;

DROP POLICY IF EXISTS "Site members can read sites" ON sites;
CREATE POLICY "Site members can read sites" ON sites
  FOR SELECT
  USING (is_site_member(id));

DROP POLICY IF EXISTS "Site owners and admins can update sites" ON sites;
CREATE POLICY "Site owners and admins can update sites" ON sites
  FOR UPDATE
  USING (has_site_role(id, ARRAY['owner', 'admin']::platform_membership_role[]))
  WITH CHECK (has_site_role(id, ARRAY['owner', 'admin']::platform_membership_role[]));

DROP POLICY IF EXISTS "Site members can read memberships" ON tenant_memberships;
CREATE POLICY "Site members can read memberships" ON tenant_memberships
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR has_site_role(site_id, ARRAY['owner', 'admin']::platform_membership_role[])
  );

DROP POLICY IF EXISTS "Site owners and admins can manage memberships" ON tenant_memberships;
CREATE POLICY "Site owners and admins can manage memberships" ON tenant_memberships
  FOR ALL
  USING (has_site_role(site_id, ARRAY['owner', 'admin']::platform_membership_role[]))
  WITH CHECK (has_site_role(site_id, ARRAY['owner', 'admin']::platform_membership_role[]));

DROP POLICY IF EXISTS "Site members can read platform settings" ON site_settings_platform;
CREATE POLICY "Site members can read platform settings" ON site_settings_platform
  FOR SELECT
  USING (is_site_member(site_id));

DROP POLICY IF EXISTS "Site owners and admins can manage platform settings" ON site_settings_platform;
CREATE POLICY "Site owners and admins can manage platform settings" ON site_settings_platform
  FOR ALL
  USING (has_site_role(site_id, ARRAY['owner', 'admin']::platform_membership_role[]))
  WITH CHECK (has_site_role(site_id, ARRAY['owner', 'admin']::platform_membership_role[]));

DROP POLICY IF EXISTS "Site members can read domains" ON site_domains;
CREATE POLICY "Site members can read domains" ON site_domains
  FOR SELECT
  USING (is_site_member(site_id));

DROP POLICY IF EXISTS "Site owners and admins can manage domains" ON site_domains;
CREATE POLICY "Site owners and admins can manage domains" ON site_domains
  FOR ALL
  USING (has_site_role(site_id, ARRAY['owner', 'admin']::platform_membership_role[]))
  WITH CHECK (has_site_role(site_id, ARRAY['owner', 'admin']::platform_membership_role[]));

DROP POLICY IF EXISTS "Site owners and admins can read domain events" ON domain_verification_events;
CREATE POLICY "Site owners and admins can read domain events" ON domain_verification_events
  FOR SELECT
  USING (has_site_role(site_id, ARRAY['owner', 'admin']::platform_membership_role[]));

DROP POLICY IF EXISTS "Site members can read subscriptions" ON subscriptions;
CREATE POLICY "Site members can read subscriptions" ON subscriptions
  FOR SELECT
  USING (is_site_member(site_id));

DROP POLICY IF EXISTS "Site owners can manage subscriptions" ON subscriptions;
CREATE POLICY "Site owners can manage subscriptions" ON subscriptions
  FOR ALL
  USING (has_site_role(site_id, ARRAY['owner']::platform_membership_role[]))
  WITH CHECK (has_site_role(site_id, ARRAY['owner']::platform_membership_role[]));

DROP POLICY IF EXISTS "Site members can read usage metrics" ON usage_metrics;
CREATE POLICY "Site members can read usage metrics" ON usage_metrics
  FOR SELECT
  USING (is_site_member(site_id));

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Site owners and admins can read audit logs" ON audit_logs;
CREATE POLICY "Site owners and admins can read audit logs" ON audit_logs
  FOR SELECT
  USING (
    site_id IS NOT NULL
    AND has_site_role(site_id, ARRAY['owner', 'admin']::platform_membership_role[])
  );

DROP POLICY IF EXISTS "Users can read own active sessions" ON active_sessions;
CREATE POLICY "Users can read own active sessions" ON active_sessions
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can revoke own active sessions" ON active_sessions;
CREATE POLICY "Users can revoke own active sessions" ON active_sessions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_platform_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sites_updated_at ON sites;
CREATE TRIGGER trg_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_updated_at();

DROP TRIGGER IF EXISTS trg_tenant_memberships_updated_at ON tenant_memberships;
CREATE TRIGGER trg_tenant_memberships_updated_at
  BEFORE UPDATE ON tenant_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_updated_at();

DROP TRIGGER IF EXISTS trg_site_settings_platform_updated_at ON site_settings_platform;
CREATE TRIGGER trg_site_settings_platform_updated_at
  BEFORE UPDATE ON site_settings_platform
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_updated_at();

DROP TRIGGER IF EXISTS trg_site_domains_updated_at ON site_domains;
CREATE TRIGGER trg_site_domains_updated_at
  BEFORE UPDATE ON site_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_updated_at();
