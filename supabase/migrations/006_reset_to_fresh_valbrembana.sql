-- Reset to fresh Valbrembana Web deployment
-- Clears all layout, pages, and content while preserving user accounts

-- Delete all layout slots (will cascade to slot_assignments)
DELETE FROM layout_slots;

-- Delete all layout templates
DELETE FROM layout_templates;

-- Delete all site pages
DELETE FROM site_pages;

-- Delete all articles (optional - keep if you want to preserve article data)
-- DELETE FROM articles;

-- Re-enable RLS after deletions
ALTER TABLE layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

-- Verify deletion
SELECT 'Layout templates' as table_name, COUNT(*) as rows FROM layout_templates
UNION ALL
SELECT 'Layout slots', COUNT(*) FROM layout_slots
UNION ALL
SELECT 'Site pages', COUNT(*) FROM site_pages;
