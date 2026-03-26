#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BLOCK_ID = 'xJnnp5Szw6qK';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function removeBlock() {
  console.log(`Searching for block: ${BLOCK_ID}`);

  const { data: pages, error: fetchError } = await supabase
    .from('site_pages')
    .select('id, title, blocks');

  if (fetchError) {
    console.error('Error fetching pages:', fetchError);
    process.exit(1);
  }

  let removedCount = 0;
  let pagesModified = 0;

  for (const page of pages) {
    const blocks = Array.isArray(page.blocks) ? page.blocks : [];
    const filteredBlocks = blocks.filter(b => b.id !== BLOCK_ID);

    if (filteredBlocks.length < blocks.length) {
      pagesModified++;
      removedCount += blocks.length - filteredBlocks.length;
      console.log(`Removing block from: "${page.title}"`);

      const { error: updateError } = await supabase
        .from('site_pages')
        .update({ blocks: filteredBlocks })
        .eq('id', page.id);

      if (updateError) {
        console.error(`Error updating page ${page.id}:`, updateError);
      } else {
        console.log(`✓ Removed block from ${page.title}`);
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`- Pages modified: ${pagesModified}`);
  console.log(`- Total blocks removed: ${removedCount}`);
  console.log(`\nBlock ${BLOCK_ID} has been removed!`);
}

removeBlock().catch(console.error);
