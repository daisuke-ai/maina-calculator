#!/usr/bin/env node
// Script to re-sync all RingCentral calls with flexible date ranges
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Date range presets
const PRESETS = {
  'all-time': { days: 3650, label: 'All-Time (10 years)' },
  'last-year': { days: 365, label: 'Last 365 Days' },
  'last-6-months': { days: 180, label: 'Last 6 Months' },
  'last-3-months': { days: 90, label: 'Last 3 Months' },
  'last-month': { days: 30, label: 'Last 30 Days' },
  'last-week': { days: 7, label: 'Last 7 Days' },
};

async function resyncCalls() {
  console.log('='.repeat(80));
  console.log('RE-SYNCING RINGCENTRAL CALLS');
  console.log('='.repeat(80));

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Get date range from command line argument or use default
  const presetArg = process.argv[2] || 'all-time';
  const preset = PRESETS[presetArg];

  if (!preset) {
    console.error(`\n❌ Invalid preset: ${presetArg}`);
    console.log('\nAvailable presets:');
    Object.entries(PRESETS).forEach(([key, value]) => {
      console.log(`  - ${key.padEnd(15)} ${value.label}`);
    });
    console.log('\nUsage: node scripts/resync-ringcentral.mjs [preset]');
    console.log('Example: node scripts/resync-ringcentral.mjs last-3-months\n');
    process.exit(1);
  }

  // Calculate date range
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - preset.days);
  
  console.log(`\nSync Parameters: ${preset.label}`);
  console.log(`  Date From: ${dateFrom.toLocaleDateString()} ${dateFrom.toLocaleTimeString()}`);
  console.log(`  Date To: ${dateTo.toLocaleDateString()} ${dateTo.toLocaleTimeString()}`);
  console.log(`  Days Back: ${preset.days}`);
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
