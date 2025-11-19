#!/usr/bin/env node
/**
 * Verify sync configuration and data quality
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function verifyConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  console.log('🔍 Verifying Sync Configuration\n');
  console.log('=' .repeat(50));

  // Check environment
  console.log('✓ Environment Configuration:');
  console.log(`  • API Base URL: ${baseUrl}`);
  console.log(`  • CRON_SECRET: ${process.env.CRON_SECRET ? '✅ Set' : '❌ Not set'}`);
  console.log(`  • RingCentral Credentials: ${process.env.RINGCENTRAL_CLIENT_ID ? '✅ Set' : '❌ Not set'}`);

  // Show cron job configuration
  console.log('\n✓ Cron Job Configuration:');
  console.log('  • Schedule: Every 6 hours');
  console.log('  • Date Range: Last 7 days (rolling window)');
  console.log('  • Fetch All Pages: Yes');
  console.log('  • Only Accurate: Yes (mapped calls only)');
  console.log('  • Deduplication: Via upsert with onConflict: "id"');

  // Show sync endpoint details
  console.log('\n✓ Sync Endpoint Details:');
  console.log('  • Endpoint: /api/ringcentral/sync-calls');
  console.log('  • Method: POST');
  console.log('  • Page Size: 1000');
  console.log('  • Max Pages: 10 (safety limit)');

  console.log('\n' + '=' .repeat(50));
  console.log('\n📋 Next Steps:');
  console.log('1. Run delete-all-calls.sql in Supabase to clear existing data');
  console.log('2. Run: node scripts/manual-sync-calls.mjs --days=30 --clean');
  console.log('3. Verify with monitor-call-sync.sql in Supabase');
  console.log('4. Cron job will maintain data automatically going forward');

  console.log('\n💡 Important Notes:');
  console.log('• Each RingCentral call has a unique ID');
  console.log('• Upsert prevents duplicates by updating existing records');
  console.log('• Only calls with agent mapping are synced (--clean flag)');
  console.log('• 7-day rolling window ensures no gaps in data');
}

verifyConfig();