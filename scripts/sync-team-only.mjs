#!/usr/bin/env node
/**
 * Sync ONLY your team's calls (extensions 101-123)
 * This filters out company-wide noise
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function syncTeamOnly() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const daysBack = process.argv[2] ? parseInt(process.argv[2]) : 30;
  const clearFirst = process.argv.includes('--clear');

  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - daysBack);

  console.log('🎯 TEAM-ONLY CALL SYNC');
  console.log('=' .repeat(60));
  console.log('This will sync ONLY calls from your team extensions (101-123)');
  console.log(`📅 Date Range: ${dateFrom.toISOString().split('T')[0]} to ${dateTo.toISOString().split('T')[0]}`);

  if (clearFirst) {
    console.log('🧹 Will clear existing data first');
  }

  console.log('\nTeam Extensions:');
  console.log('101-111, 113-114, 117-123');
  console.log('\nStarting sync...\n');

  try {
    const response = await fetch(`${baseUrl}/api/ringcentral/sync-team-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        clearFirst: clearFirst,
        fetchAllPages: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }

    const result = await response.json();

    console.log('✅ SYNC COMPLETE!');
    console.log('=' .repeat(60));
    console.log(`📊 Results:`);
    console.log(`  • Total fetched from RingCentral: ${result.totalFetched}`);
    console.log(`  • Team calls found: ${result.teamCalls}`);
    console.log(`  • Synced to database: ${result.synced}`);
    console.log(`  • Accuracy: ${result.accuracy}%`);
    console.log('=' .repeat(60));

    console.log('\n💡 What happened:');
    console.log(`  1. Fetched ${result.totalFetched} calls from RingCentral (company-wide)`);
    console.log(`  2. Filtered to ${result.teamCalls} calls from your team extensions`);
    console.log(`  3. Synced ${result.synced} calls with agent mapping`);

    if (result.synced < 100) {
      console.log('\n✨ This looks much more accurate! Likely real call volume.');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

// Show help
if (process.argv.includes('--help')) {
  console.log(`
Team-Only Call Sync

Usage: node scripts/sync-team-only.mjs [days] [--clear]

Arguments:
  days      Number of days to sync (default: 30)
  --clear   Clear existing data first
  --help    Show this help

Examples:
  node scripts/sync-team-only.mjs          # Sync last 30 days
  node scripts/sync-team-only.mjs 7        # Sync last 7 days
  node scripts/sync-team-only.mjs 30 --clear  # Clear and sync 30 days
  `);
  process.exit(0);
}

syncTeamOnly();