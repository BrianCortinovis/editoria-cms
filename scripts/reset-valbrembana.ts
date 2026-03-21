#!/usr/bin/env node
/**
 * Reset script for Valbrembana Web deployment
 * Clears all layout, pages, and content while preserving accounts
 * Usage: npx ts-node scripts/reset-valbrembana.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetValbrembana() {
  console.log('🔄 Starting Valbrembana Web reset...\n');

  try {
    // Delete all layout slots (cascades to slot_assignments)
    console.log('🗑️  Deleting layout slots...');
    const { error: slotsError } = await supabase
      .from('layout_slots')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (slotsError) throw slotsError;
    console.log('   ✅ Layout slots deleted');

    // Delete all layout templates
    console.log('🗑️  Deleting layout templates...');
    const { error: templatesError } = await supabase
      .from('layout_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (templatesError) throw templatesError;
    console.log('   ✅ Layout templates deleted');

    // Delete all site pages
    console.log('🗑️  Deleting site pages...');
    const { error: pagesError } = await supabase
      .from('site_pages')
      .delete()
      .neq('id', ''); // Delete all (empty string never matches)

    if (pagesError) throw pagesError;
    console.log('   ✅ Site pages deleted');

    // Verify counts
    console.log('\n📊 Verification:\n');

    const { data: templates, count: templatesCount } = await supabase
      .from('layout_templates')
      .select('id', { count: 'exact' });

    const { data: slots, count: slotsCount } = await supabase
      .from('layout_slots')
      .select('id', { count: 'exact' });

    const { data: pages, count: pagesCount } = await supabase
      .from('site_pages')
      .select('id', { count: 'exact' });

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
