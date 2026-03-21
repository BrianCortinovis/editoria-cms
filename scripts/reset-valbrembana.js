#!/usr/bin/env node
/**
 * Reset script for Valbrembana Web deployment
 * Clears all layout, pages, and content while preserving accounts
 * Usage: node scripts/reset-valbrembana.js
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE credentials in .env.local');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetValbrembana() {
  console.log('🔄 Starting Valbrembana Web reset...\n');

  try {
    // Delete all layout slots (cascades to slot_assignments)
    console.log('🗑️  Deleting layout slots...');
    const { error: slotsError } = await supabase
      .from('layout_slots')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (slotsError) throw slotsError;
    console.log('   ✅ Layout slots deleted');

    // Delete all layout templates
    console.log('🗑️  Deleting layout templates...');
    const { error: templatesError } = await supabase
      .from('layout_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (templatesError) throw templatesError;
    console.log('   ✅ Layout templates deleted');

    // Delete all site pages
    console.log('🗑️  Deleting site pages...');
    const { error: pagesError } = await supabase
      .from('site_pages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (pagesError) throw pagesError;
    console.log('   ✅ Site pages deleted');

    // Verify counts
    console.log('\n📊 Verification:\n');

    const { data: templates, count: templatesCount, error: templatesCheckError } = await supabase
      .from('layout_templates')
      .select('id', { count: 'exact' });

    if (templatesCheckError) throw templatesCheckError;

    const { data: slots, count: slotsCount, error: slotsCheckError } = await supabase
      .from('layout_slots')
      .select('id', { count: 'exact' });

    if (slotsCheckError) throw slotsCheckError;

    const { data: pages, count: pagesCount, error: pagesCheckError } = await supabase
      .from('site_pages')
      .select('id', { count: 'exact' });

    if (pagesCheckError) throw pagesCheckError;

    console.log(`Layout templates: ${templatesCount} rows`);
    console.log(`Layout slots: ${slotsCount} rows`);
    console.log(`Site pages: ${pagesCount} rows`);

    if (templatesCount === 0 && slotsCount === 0 && pagesCount === 0) {
      console.log('\n✅ SUCCESS! Valbrembana Web is reset and ready for fresh design.\n');
      console.log('Next steps:');
      console.log('1. npm run dev');
      console.log('2. Open http://localhost:3000/dashboard/editor');
      console.log('3. Start designing Valbrembana Web!\n');
    } else {
      console.log('\n⚠️  Some data remains. Check manually.\n');
    }
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

resetValbrembana();
