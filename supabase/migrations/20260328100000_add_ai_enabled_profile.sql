-- Add per-user AI enable/disable flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;

-- Index for superadmin queries filtering by ai_enabled
CREATE INDEX IF NOT EXISTS idx_profiles_ai_enabled ON profiles (ai_enabled) WHERE ai_enabled = false;

COMMENT ON COLUMN profiles.ai_enabled IS 'Platform-level AI feature toggle, controlled by superadmin';
