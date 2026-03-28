-- Add credentials fields for dedicated Supabase instances (enterprise tenants)
-- These are used at runtime to connect to the tenant's own database.

ALTER TABLE site_infrastructure
  ADD COLUMN IF NOT EXISTS supabase_service_role_key TEXT,
  ADD COLUMN IF NOT EXISTS supabase_anon_key TEXT;

COMMENT ON COLUMN site_infrastructure.supabase_service_role_key IS
  'Service role key for dedicated Supabase instance. NULL for shared tenants.';
COMMENT ON COLUMN site_infrastructure.supabase_anon_key IS
  'Anon key for dedicated Supabase instance. NULL for shared tenants.';

-- RLS: only service role should read these columns (already bypasses RLS)
-- No additional policy needed since site_infrastructure is accessed via service role client.
