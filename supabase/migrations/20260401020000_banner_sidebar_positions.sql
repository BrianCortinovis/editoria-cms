-- Extend banner positions to support separate sidebar columns
-- Drop the constraint if it exists, then recreate with new values
DO $$ BEGIN
  -- Check if there's a CHECK constraint on position column
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name LIKE '%banner%position%'
  ) THEN
    ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_position_check;
  END IF;
END $$;

-- Allow any text value for position (managed by application)
-- Valid values: header, sidebar, sidebar-left, sidebar-right, in_article, footer, interstitial
COMMENT ON COLUMN banners.position IS 'Banner position: header, sidebar, sidebar-left, sidebar-right, in_article, footer, interstitial';
