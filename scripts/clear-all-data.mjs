#!/usr/bin/env node

/**
 * Clear All Data Script
 *
 * WARNING: This script will DELETE ALL DATA from all database tables!
 * This operation CANNOT be undone!
 *
 * Usage:
 *   node scripts/clear-all-data.mjs
 *
 * To skip confirmation (dangerous):
 *   node scripts/clear-all-data.mjs --force
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

// Check if --force flag is provided
const forceMode = process.argv.includes('--force');

// List of tables to clear (in order to respect foreign key constraints)
const tablesToClear = [
  { name: 'pipeline_activities', description: 'Pipeline activity logs' },
  { name: 'pipeline_stage_history', description: 'Pipeline stage change history' },
  { name: 'email_events', description: 'Email webhook events' },
  { name: 'email_replies', description: 'Realtor email replies' },
  { name: 'loi_email_outbound_replies', description: 'Outbound email replies' },
  { name: 'pipeline_deals', description: 'Pipeline deals' },
  { name: 'loi_emails', description: 'LOI emails sent' },
];

async function confirmDeletion() {
  if (forceMode) {
    console.log('⚠️  Force mode enabled - skipping confirmation\n');
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  Are you sure you want to DELETE ALL DATA? Type "DELETE ALL" to confirm: ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'DELETE ALL');
    });
  });
}

async function getTableCounts() {
  const counts = {};

  for (const table of tablesToClear) {
    const { count, error } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`  ⚠️  Error counting ${table.name}:`, error.message);
      counts[table.name] = 'Error';
    } else {
      counts[table.name] = count || 0;
    }
  }

  return counts;
}

async function clearAllData() {
  console.log('\n🗑️  CLEAR ALL DATA - Database Cleanup Script\n');
  console.log('=' .repeat(60));

  // Step 1: Show current data counts
  console.log('\n📊 Current data in tables:\n');
  const beforeCounts = await getTableCounts();

  let totalRows = 0;
  tablesToClear.forEach(table => {
    const count = beforeCounts[table.name];
    console.log(`  ${table.name.padEnd(30)} ${String(count).padStart(6)} rows - ${table.description}`);
    if (typeof count === 'number') totalRows += count;
  });

  console.log('\n' + '='.repeat(60));
  console.log(`  TOTAL ROWS TO DELETE: ${totalRows}`);
  console.log('=' .repeat(60));

  if (totalRows === 0) {
    console.log('\n✅ All tables are already empty. Nothing to delete.');
    return;
  }

  // Step 2: Confirm deletion
  const confirmed = await confirmDeletion();

  if (!confirmed) {
    console.log('\n❌ Operation cancelled. No data was deleted.');
    process.exit(0);
  }

  // Step 3: Delete data from each table
  console.log('\n🔥 Starting data deletion...\n');

  let deletedCount = 0;
  let errorCount = 0;

  for (const table of tablesToClear) {
    const rowCount = beforeCounts[table.name];
    if (typeof rowCount !== 'number' || rowCount === 0) {
      console.log(`  ⏭️  Skipping ${table.name} (already empty)`);
      continue;
    }

    process.stdout.write(`  🗑️  Deleting from ${table.name}...`);

    try {
      const { error } = await supabase
        .from(table.name)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Match all rows

      if (error) {
        console.log(` ❌ Failed`);
        console.error(`     Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(` ✅ Done (${rowCount} rows)`);
        deletedCount += rowCount;
      }
    } catch (err) {
      console.log(` ❌ Failed`);
      console.error(`     Error: ${err.message}`);
      errorCount++;
    }
  }

  // Step 4: Verify deletion
  console.log('\n📊 Verifying deletion...\n');
  const afterCounts = await getTableCounts();

  let remainingRows = 0;
  tablesToClear.forEach(table => {
    const count = afterCounts[table.name];
    if (typeof count === 'number' && count > 0) {
      console.log(`  ⚠️  ${table.name}: ${count} rows remaining`);
      remainingRows += count;
    }
  });

  // Step 5: Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  console.log('='.repeat(60));
  console.log(`  Rows before: ${totalRows}`);
  console.log(`  Rows deleted: ${deletedCount}`);
  console.log(`  Rows remaining: ${remainingRows}`);
  console.log(`  Tables with errors: ${errorCount}`);
  console.log('='.repeat(60));

  if (remainingRows === 0 && errorCount === 0) {
    console.log('\n✅ SUCCESS! All data has been deleted.\n');
  } else if (errorCount > 0) {
    console.log('\n⚠️  PARTIAL SUCCESS - Some tables had errors.\n');
    console.log('💡 Try running the SQL script manually in Supabase SQL Editor:');
    console.log('   scripts/clear-all-data.sql\n');
  } else {
    console.log('\n⚠️  WARNING - Some data may remain.\n');
  }
}

// Run the script
clearAllData().catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});
