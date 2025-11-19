#!/usr/bin/env node
/**
 * Manual script to sync RingCentral calls with proper deduplication
 * Run with: node scripts/manual-sync-calls.mjs [--days=30] [--clean]
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const args = process.argv.slice(2);
const daysArg = args.find(arg => arg.startsWith('--days='));
const days = daysArg ? parseInt(daysArg.split('=')[1]) : 7;
const shouldClean = args.includes('--clean');

async function manualSync() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!baseUrl) {
    console.error('❌ NEXT_PUBLIC_BASE_URL not set in environment');
    process.exit(1);
  }

  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  console.log('🔄 Starting Manual Call Sync');
  console.log(`📅 Date Range: ${dateFrom.toISOString().split('T')[0]} to ${dateTo.toISOString().split('T')[0]} (${days} days)`);
  console.log(`🔗 API URL: ${baseUrl}/api/ringcentral/sync-calls`);

  if (shouldClean) {
    console.log('🧹 Clean mode: Will only sync mapped calls (with agent_id)');
  }

  try {
    const startTime = Date.now();

    const response = await fetch(`${baseUrl}/api/ringcentral/sync-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        perPage: 1000,
        fetchAllPages: true,
        onlyAccurate: shouldClean // Only sync mapped calls if --clean flag is set
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API returned ${response.status}: ${error}`);
    }

    const result = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n✅ Sync Completed Successfully!');
    console.log('━'.repeat(50));
    console.log(`📊 Summary:`);
    console.log(`  • Total Fetched from RingCentral: ${result.totalRecordsFetched || 0}`);
    console.log(`  • Records Synced to Database: ${result.synced || 0}`);
    console.log(`  • Pages Fetched: ${result.pagesFetched || 1}`);
    console.log(`  • With Extension Numbers: ${result.withExtensions || 0}`);
    console.log(`  • With Agent Mapping: ${result.withAgentId || 0}`);
    console.log(`  • Accuracy Rate: ${result.accuracy || 0}%`);

    if (result.filtered > 0) {
      console.log(`  • Filtered (Unmapped): ${result.filtered}`);
    }

    console.log(`  • Time Elapsed: ${elapsed}s`);
    console.log('━'.repeat(50));

    // Provide recommendations
    if (result.accuracy < 80) {
      console.log('\n⚠️  Warning: Low accuracy rate detected');
      console.log('   Consider updating the agent mapping configuration');
    }

    if (result.totalRecordsFetched > result.synced + (result.filtered || 0)) {
      console.log('\n⚠️  Some records were not synced');
      console.log('   This usually means they were duplicates (already in database)');
    }

    console.log('\n💡 Next Steps:');
    console.log('  1. Run monitor-call-sync.sql in Supabase to verify data');
    console.log('  2. If duplicates exist, run cleanup-duplicate-calls.sql');
    console.log('  3. Check CRM dashboard to verify agent call counts');

  } catch (error) {
    console.error('\n❌ Sync Failed:', error.message);
    process.exit(1);
  }
}

// Show help if requested
if (args.includes('--help')) {
  console.log(`
Manual Call Sync Script

Usage: node scripts/manual-sync-calls.mjs [options]

Options:
  --days=N     Number of days to sync (default: 7)
  --clean      Only sync calls with agent mapping
  --help       Show this help message

Examples:
  node scripts/manual-sync-calls.mjs                    # Sync last 7 days
  node scripts/manual-sync-calls.mjs --days=30          # Sync last 30 days
  node scripts/manual-sync-calls.mjs --days=1 --clean   # Sync last day, mapped calls only
  `);
  process.exit(0);
}

// Run the sync
manualSync();