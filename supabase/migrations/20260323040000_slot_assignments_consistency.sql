BEGIN;

ALTER TABLE layout_slots
  ADD COLUMN IF NOT EXISTS assignment_mode TEXT NOT NULL DEFAULT 'auto'
  CHECK (assignment_mode IN ('auto', 'manual', 'mixed'));

CREATE TABLE IF NOT EXISTS slot_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES layout_slots(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pin_order INT NOT NULL DEFAULT 0,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slot_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_slot_assignments_slot
  ON slot_assignments(slot_id, pin_order);

CREATE INDEX IF NOT EXISTS idx_slot_assignments_article
  ON slot_assignments(article_id);

CREATE INDEX IF NOT EXISTS idx_slot_assignments_tenant
  ON slot_assignments(tenant_id);

ALTER TABLE slot_assignments ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tr_slot_assignments_updated_at ON slot_assignments;
CREATE TRIGGER tr_slot_assignments_updated_at
BEFORE UPDATE ON slot_assignments
FOR EACH ROW EXECUTE FUNCTION editoria_touch_updated_at();

DROP POLICY IF EXISTS "Users can read slot assignments from their tenants" ON slot_assignments;
CREATE POLICY "Users can read slot assignments from their tenants" ON slot_assignments
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage slot assignments from their tenants" ON slot_assignments;
CREATE POLICY "Users can manage slot assignments from their tenants" ON slot_assignments
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
