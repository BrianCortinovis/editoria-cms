-- ============================================
-- SLOT_ASSIGNMENTS: Article-to-slot pinning
-- ============================================

-- Add assignment_mode column to layout_slots
ALTER TABLE layout_slots
  ADD COLUMN IF NOT EXISTS assignment_mode TEXT NOT NULL DEFAULT 'auto'
  CHECK (assignment_mode IN ('auto', 'manual', 'mixed'));

-- auto   = solo categoria+sort (comportamento attuale)
-- manual = solo articoli pinnati
-- mixed  = pinnati prima, poi auto-fill

-- ============================================
-- SLOT_ASSIGNMENTS table
-- ============================================
CREATE TABLE IF NOT EXISTS slot_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id       UUID NOT NULL REFERENCES layout_slots(id) ON DELETE CASCADE,
  article_id    UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pin_order     INT NOT NULL DEFAULT 0,
  assigned_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slot_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_slot_assignments_slot
  ON slot_assignments(slot_id, pin_order);
CREATE INDEX IF NOT EXISTS idx_slot_assignments_article
  ON slot_assignments(article_id);
CREATE INDEX IF NOT EXISTS idx_slot_assignments_tenant
  ON slot_assignments(tenant_id);

-- ============================================
-- RLS Policies for slot_assignments
-- ============================================
ALTER TABLE slot_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Slot assignments visible to tenant members"
  ON slot_assignments
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY IF NOT EXISTS "Editors+ can manage slot assignments"
  ON slot_assignments
  FOR ALL USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'));

-- ============================================
-- Trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_slot_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS tr_slot_assignments_updated_at
  BEFORE UPDATE ON slot_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_slot_assignments_updated_at();
