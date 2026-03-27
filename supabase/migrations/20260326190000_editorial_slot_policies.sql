BEGIN;

ALTER TABLE layout_slots
  ADD COLUMN IF NOT EXISTS placement_duration_hours INT
  CHECK (placement_duration_hours IS NULL OR placement_duration_hours > 0);

ALTER TABLE slot_assignments
  ADD COLUMN IF NOT EXISTS display_mode TEXT NOT NULL DEFAULT 'duplicate'
  CHECK (display_mode IN ('duplicate', 'exclusive'));

ALTER TABLE slot_assignments
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_slot_assignments_slot_active_window
  ON slot_assignments(slot_id, expires_at, pin_order);

CREATE INDEX IF NOT EXISTS idx_slot_assignments_tenant_display_mode
  ON slot_assignments(tenant_id, display_mode, expires_at);

COMMIT;
