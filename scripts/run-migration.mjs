// scripts/run-migration.mjs
// Simple script to display migration instructions

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  📊 Miana CRM - Database Migration');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Migration: 20250115_add_crm_analytics.sql');
console.log('');
console.log('This migration creates:');
console.log('  ✓ 5 Analytics Views (agent_performance_summary, etc.)');
console.log('  ✓ 2 SQL Functions (get_agent_details, get_top_agents)');
console.log('  ✓ 3 Performance Indexes');
console.log('');
console.log('───────────────────────────────────────────────────────────────');
console.log('  📋 MANUAL STEPS REQUIRED:');
console.log('───────────────────────────────────────────────────────────────');
console.log('');
console.log('1. Open Supabase SQL Editor:');
console.log('   👉 https://supabase.com/dashboard/project/qpbjckuphrfjupqrtiai/sql/new');
console.log('');
console.log('2. Copy the migration SQL file contents from:');
console.log('   📄 supabase/migrations/20250115_add_crm_analytics.sql');
console.log('');
console.log('3. Paste into SQL Editor and click "Run"');
console.log('');
console.log('4. Verify success by running this test query:');
console.log('   SELECT * FROM agent_performance_summary LIMIT 5;');
console.log('');
console.log('───────────────────────────────────────────────────────────────');
console.log('  📄 Migration File Preview:');
console.log('───────────────────────────────────────────────────────────────');
console.log('');

try {
  const migrationPath = join(__dirname, '../supabase/migrations/20250115_add_crm_analytics.sql');
  const sql = readFileSync(migrationPath, 'utf8');
  const lines = sql.split('\n').slice(0, 15);
  console.log(lines.join('\n'));
  console.log('... (truncated, see full file)');
  console.log('');
  console.log(`Total lines: ${sql.split('\n').length}`);
  console.log('');
} catch (error) {
  console.error('❌ Could not read migration file:', error.message);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('');
