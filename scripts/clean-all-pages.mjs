#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanAllPages() {
  console.log('Fetching all pages...');

  const { data: pages, error: fetchError } = await supabase
    .from('site_pages')
    .select('id, title');

  if (fetchError) {
    console.error('Error fetching pages:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${pages.length} pages`);

  for (const page of pages) {
    console.log(`Cleaning page: ${page.title} (${page.id})`);

    const { error: updateError } = await supabase
      .from('site_pages')
      .update({
        blocks: [],
      })
      .eq('id', page.id);

    if (updateError) {
      console.error(`Error cleaning page ${page.id}:`, updateError);
    } else {
      console.log(`✓ Cleaned ${page.title}`);
    }
  }

  console.log('\nAll pages cleaned!');
}

cleanAllPages().catch(console.error);
