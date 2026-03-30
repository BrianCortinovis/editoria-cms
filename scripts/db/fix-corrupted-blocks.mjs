#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixCorruptedBlocks() {
  console.log('Fetching all pages...');

  const { data: pages, error: fetchError } = await supabase
    .from('site_pages')
    .select('id, title, blocks');

  if (fetchError) {
    console.error('Error fetching pages:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${pages.length} pages`);

  let fixedCount = 0;
  let pagesWithCorruptedBlocks = 0;

  for (const page of pages) {
    const blocks = Array.isArray(page.blocks) ? page.blocks : [];
    let hasCorrupted = false;

    // Check and fix blocks with missing style.layout
    const fixedBlocks = blocks.map((block) => {
      if (!block.style || !block.style.layout) {
        console.log(`  - Found corrupted block in "${page.title}": ${block.id}`);
        hasCorrupted = true;
        fixedCount++;

        // Return block with fixed style
        return {
          ...block,
          style: {
            layout: {
              display: 'block',
              padding: { top: '0', right: '0', bottom: '0', left: '0' },
              margin: { top: '0', right: '0', bottom: '0', left: '0' },
              width: '100%',
              maxWidth: '100%',
            },
            background: { type: 'none', value: '' },
            typography: {},
            border: {},
            ...(block.style || {}),
          },
        };
      }
      return block;
    });

    if (hasCorrupted) {
      pagesWithCorruptedBlocks++;
      console.log(`Fixing page: "${page.title}"`);

      const { error: updateError } = await supabase
        .from('site_pages')
        .update({ blocks: fixedBlocks })
        .eq('id', page.id);

      if (updateError) {
        console.error(`Error fixing page ${page.id}:`, updateError);
      } else {
        console.log(`✓ Fixed ${page.title}`);
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`- Pages with corrupted blocks: ${pagesWithCorruptedBlocks}`);
  console.log(`- Total corrupted blocks fixed: ${fixedCount}`);
}

fixCorruptedBlocks().catch(console.error);
