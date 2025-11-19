#!/usr/bin/env node
// Script to re-sync all RingCentral calls
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function resyncCalls() {
  console.log('='.repeat(80));
  console.log('RE-SYNCING RINGCENTRAL CALLS');
  console.log('='.repeat(80));
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  // Calculate date range - last 365 days (adjust as needed)
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 365);
  
  console.log('\nSync Parameters:');
  console.log(`  Date From: ${dateFrom.toISOString()}`);
  console.log(`  Date To: ${dateTo.toISOString()}`);
  console.log(`  Fetch All Pages: Yes`);
  console.log(`  Only Accurate: No (include unmapped for analysis)`);
  
  console.log('\nStarting sync...\n');
  
  const response = await fetch(`${baseUrl}/api/ringcentral/sync-calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      perPage: 1000,
      page: 1,
      fetchAllPages: true,
      onlyAccurate: false, // Include unmapped calls for debugging
    }),
  });
  
  const result = await response.json();
  
  if (!response.ok || !result.success) {
    console.error('❌ Sync failed:', result.error || 'Unknown error');
    console.error('Details:', result.details);
    process.exit(1);
  }
  
  console.log('✅ Sync completed successfully!\n');
  console.log('Results:');
  console.log(`  Total records fetched: ${result.totalRecordsFetched}`);
  console.log(`  Pages fetched: ${result.pagesFetched}`);
  console.log(`  Records synced: ${result.synced}`);
  console.log(`  With extensions: ${result.withExtensions}`);
  console.log(`  With agent mapping: ${result.withAgentId}`);
  console.log(`  Accuracy: ${result.accuracy}%`);
  if (result.filtered > 0) {
    console.log(`  Filtered (unmapped): ${result.filtered}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('NEXT STEPS:');
  console.log('='.repeat(80));
  console.log('1. Run: node scripts/debug-unmapped-calls.mjs');
  console.log('   To see which extensions need mapping');
  console.log('\n2. Visit your CRM dashboard to see the updated call metrics');
}

resyncCalls().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
