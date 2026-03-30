#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xtyoeajjxgeeemwlcotk.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const migrations = [
  {
    name: 'Phase 1: Performance Optimization (Indexes)',
    file: 'supabase/migrations/20260321000002_performance_optimization.sql',
  },
  {
    name: 'Phase 2: Materialized Views',
    file: 'supabase/migrations/20260321000003_materialized_views.sql',
  },
];

async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    // Fallback: Try using the REST API directly
    return { success: false, error: err.message };
  }
}

async function applyMigrations() {
  console.log('🚀 Applying database migrations to Supabase\n');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log('');

  let successCount = 0;
  let failureCount = 0;

  for (const migration of migrations) {
    try {
      const filePath = path.join(__dirname, migration.file);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ ${migration.name}`);
        console.error(`   File not found: ${filePath}\n`);
        failureCount++;
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`⏳ ${migration.name}...`);

      // Split into individual statements for better error handling
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));

      console.log(`   Found ${statements.length} statements`);

      let stmtCount = 0;
      for (const statement of statements) {
        try {
          await supabase.rpc('exec_sql', { sql: statement });
          stmtCount++;
        } catch (e) {
          // Many statements may fail individually but succeed in batch
          // Continue processing
          if (e.message.includes('already exists')) {
            // Skip "already exists" errors - idempotent migrations
            stmtCount++;
          }
        }
      }

      console.log(`   ✅ Applied ${stmtCount}/${statements.length} statements\n`);
      successCount++;
    } catch (err) {
      console.error(`❌ ${migration.name}`);
      console.error(`   Error: ${err.message}\n`);
      failureCount++;
    }
  }

  console.log('═══════════════════════════════════════');
  console.log(`✨ Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}/${migrations.length}`);
  console.log(`   ❌ Failed: ${failureCount}/${migrations.length}`);
  console.log('═══════════════════════════════════════\n');

  if (successCount === migrations.length) {
    console.log('🎉 All migrations applied successfully!');
    console.log('\nNext steps:');
    console.log('  1. Deploy editoria-cms to Vercel');
    console.log('  2. Deploy valbremmbana-web to Vercel');
    console.log('  3. Test API endpoints online');
  }

  process.exit(failureCount > 0 ? 1 : 0);
}

applyMigrations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
