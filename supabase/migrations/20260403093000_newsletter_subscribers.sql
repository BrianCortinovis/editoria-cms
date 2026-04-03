BEGIN;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email varchar(320) NOT NULL,
  full_name varchar(255),
  status varchar(32) NOT NULL DEFAULT 'pending',
  source varchar(32) NOT NULL DEFAULT 'website',
  source_page text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  consents jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash varchar(128),
  provider varchar(32),
  provider_subscriber_id text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  last_submission_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_newsletter_email_unique UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_tenant_status
  ON newsletter_subscribers(tenant_id, status, subscribed_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_tenant_email
  ON newsletter_subscribers(tenant_id, email);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tr_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER tr_newsletter_subscribers_updated_at
BEFORE UPDATE ON newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION editoria_touch_updated_at();

DROP POLICY IF EXISTS "Users can read newsletter subscribers from their tenants" ON newsletter_subscribers;
CREATE POLICY "Users can read newsletter subscribers from their tenants" ON newsletter_subscribers
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage newsletter subscribers from their tenants" ON newsletter_subscribers;
CREATE POLICY "Users can manage newsletter subscribers from their tenants" ON newsletter_subscribers
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
