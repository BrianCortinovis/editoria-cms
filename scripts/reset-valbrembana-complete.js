#!/usr/bin/env node
/**
 * Complete reset script for Valbrembana Web
 * Deletes ALL content tables except auth, profiles, user_tenants, tenants
 * Keeps user access intact
 */

const { createClient } = require('@supabase/supabase-js');

// Load from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetValbrembanaComplete() {
  console.log('🔄 Starting complete Valbrembana Web reset (keeping user access)...\n');

  const tablesToDelete = [
    // Site Builder
    'layout_slots',
    'layout_templates',
    'site_pages',
    'site_page_versions',

    // CMS Content
    'articles',
    'article_revisions',
    'article_comments',
    'article_views',
    'comments',
    'comment_replies',

    // Advertising
    'banners',
    'banner_placements',
    'ad_networks',

    // Media
    'media_assets',
    'media_folders',

    // Other content
    'categories',
    'tags',
    'article_tags',
    'newsletters',
    'newsletter_subscribers',
    'notifications',
  ];

  try {
    for (const table of tablesToDelete) {
      console.log(`🗑️  Deleting ${table}...`);

      // Try to delete, ignore if table doesn't exist
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        // Ignore "schema not found" errors (table doesn't exist)
        if (!error.message.includes('schema')) {
          console.error(`   ❌ Error deleting ${table}:`, error.message);
        } else {
          console.log(`   ⏭️  Table not found (skipped)`);
        }
      } else {
        console.log(`   ✅ ${table} deleted`);
      }
    }

    console.log('\n📊 Verification - checking content tables are empty:\n');

    const contentTables = [
      'site_pages',
      'layout_templates',
      'articles',
      'categories',
      'banners',
      'media_assets',
    ];

    let allEmpty = true;
    for (const table of contentTables) {
      const { count, error } = await supabase
        .from(table)
        .select('id', { count: 'exact' });

      if (!error && count !== null) {
        console.log(`${table}: ${count} rows`);
        if (count > 0) allEmpty = false;
      }
    }

    // Verify user access tables are still intact
    console.log('\n✅ User access verification:\n');

    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' });

    const { count: tenantsCount } = await supabase
      .from('tenants')
      .select('id', { count: 'exact' });

    const { count: userTenantsCount } = await supabase
      .from('user_tenants')
      .select('id', { count: 'exact' });

    console.log(`Profiles: ${profilesCount} rows`);
    console.log(`Tenants: ${tenantsCount} rows`);
    console.log(`User-Tenant mappings: ${userTenantsCount} rows`);

    if (allEmpty && profilesCount > 0 && tenantsCount > 0) {
      console.log('\n✅ SUCCESS! Valbrembana Web is completely reset.');
      console.log('   - All content deleted');
      console.log('   - User access preserved\n');
    } else {
      console.log('\n⚠️  Warning: Some data may remain. Check manually.\n');
    }
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

resetValbrembanaComplete();
