-- Advanced banner settings: rotation, sizing, overlay behavior

-- Rotation mode: how banners are ordered in slideshow
ALTER TABLE banners ADD COLUMN IF NOT EXISTS rotation_mode TEXT NOT NULL DEFAULT 'sequential';
-- sequential = same order every time
-- random = randomized on each page load
-- weighted = higher weight shown first, then rotate

-- Rotation interval in milliseconds (for slideshows)
ALTER TABLE banners ADD COLUMN IF NOT EXISTS rotation_interval_ms INT NOT NULL DEFAULT 5000;

-- Sizing mode: how the banner fills its container
ALTER TABLE banners ADD COLUMN IF NOT EXISTS sizing_mode TEXT NOT NULL DEFAULT 'cover';
-- cover = fills container, may crop edges
-- contain = fits inside container, may have gaps
-- stretch = stretches to fill exactly

-- Overlay settings for hover-to-reveal banners on article cards
ALTER TABLE banners ADD COLUMN IF NOT EXISTS overlay_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS overlay_trigger TEXT NOT NULL DEFAULT 'hover';
-- hover = shows on mouse hover
-- click = shows on click
-- auto = shows automatically after delay

ALTER TABLE banners ADD COLUMN IF NOT EXISTS overlay_delay_ms INT NOT NULL DEFAULT 0;
-- Delay before overlay appears (only for auto trigger)

ALTER TABLE banners ADD COLUMN IF NOT EXISTS overlay_close_required BOOLEAN NOT NULL DEFAULT true;
-- If true, user must close the overlay before accessing the content below

ALTER TABLE banners ADD COLUMN IF NOT EXISTS overlay_target_pages TEXT[] NOT NULL DEFAULT '{}';
-- Pages/sections where overlay appears: homepage, cronaca, sport, etc.
-- Empty = appears everywhere

COMMENT ON COLUMN banners.rotation_mode IS 'Banner rotation: sequential, random, weighted';
COMMENT ON COLUMN banners.rotation_interval_ms IS 'Slideshow rotation interval in milliseconds';
COMMENT ON COLUMN banners.sizing_mode IS 'How banner fills container: cover, contain, stretch';
COMMENT ON COLUMN banners.overlay_enabled IS 'Show as overlay on article cards';
COMMENT ON COLUMN banners.overlay_trigger IS 'Overlay trigger: hover, click, auto';
COMMENT ON COLUMN banners.overlay_delay_ms IS 'Delay before auto overlay appears';
COMMENT ON COLUMN banners.overlay_close_required IS 'Must close overlay to access content';
COMMENT ON COLUMN banners.overlay_target_pages IS 'Pages where overlay appears (empty = all)';
