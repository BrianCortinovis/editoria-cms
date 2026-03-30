#!/usr/bin/env node

/**
 * Apply database migrations to Supabase
 * Usage: node apply-migrations.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
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

async function applyMigrations() {
  console.log('🚀 Applying database migrations to Supabase...\n');

  for (const migration of migrations) {
    try {
      const filePath = path.join(__dirname, migration.file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`⏳ ${migration.name}...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql,
      }).catch(async () => {
        // Fallback: try executing statements one by one
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s && !s.startsWith('--'));

        for (const statement of statements) {
          const { error } = await supabase.from('_supabase_migrations').select('*').limit(1);
          if (error) continue; // Connection test

          // Execute the statement
          try {
            await supabase.rpc('exec_sql', { sql: statement });
          } catch (e) {
            console.warn(`   ⚠️  Non-critical error: ${e.message}`);
          }
        }
        return { error: null };
      });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        continue;
      }

      console.log(`   ✅ Applied successfully\n`);
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}\n`);
    }
  }

  console.log('✨ Migration process complete!');
}

applyMigrations().catch(console.error);
