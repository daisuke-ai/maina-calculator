#!/usr/bin/env node
/**
 * Diagnose call filtering by calling the API and seeing raw results
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function diagnose() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  console.log('🔍 DIAGNOSING CALL FILTERING\n');
  console.log('=' .repeat(60));

  try {
    // Get last 7 days
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 7);

    console.log(`📅 Fetching last 7 days of calls...\n`);

    // First, let's get the raw sync without team filtering
    const rawResponse = await fetch(`${baseUrl}/api/ringcentral/sync-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        perPage: 1000,
        fetchAllPages: true,
        onlyAccurate: false  // Get ALL calls to see what we're working with
      })
    });

    const rawResult = await rawResponse.json();

    console.log('📊 RAW SYNC RESULTS (ALL CALLS):');
    console.log(`  • Total fetched from RingCentral: ${rawResult.totalRecordsFetched || 0}`);
    console.log(`  • With extension numbers: ${rawResult.withExtensions || 0}`);
    console.log(`  • With agent mapping: ${rawResult.withAgentId || 0}`);
    console.log(`  • Accuracy: ${rawResult.accuracy || 0}%\n`);

    // Now let's try the team filter
    const teamResponse = await fetch(`${baseUrl}/api/ringcentral/sync-team-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        fetchAllPages: true,
        clearFirst: false
      })
    });

    const teamResult = await teamResponse.json();

    console.log('🎯 TEAM-ONLY SYNC RESULTS:');
    console.log(`  • Total fetched from RingCentral: ${teamResult.totalFetched || 0}`);
    console.log(`  • Team calls found: ${teamResult.teamCalls || 0}`);
    console.log(`  • Synced to database: ${teamResult.synced || 0}\n`);

    console.log('=' .repeat(60));
    console.log('\n🔴 THE PROBLEM:');
    console.log(`  • RingCentral has: ${rawResult.totalRecordsFetched || 0} total calls`);
    console.log(`  • With extensions: ${rawResult.withExtensions || 0} calls`);
    console.log(`  • Team filter finds: ${teamResult.teamCalls || 0} calls`);
    console.log(`  • You expect: ~200 calls\n`);

    const filteredOut = rawResult.totalRecordsFetched - teamResult.teamCalls;
    console.log(`  ⚠️  ${filteredOut} calls are being filtered out!\n`);

    if (rawResult.withExtensions < rawResult.totalRecordsFetched * 0.3) {
      console.log('💡 LIKELY CAUSE: Most calls don\'t have extension data in the fields we\'re checking!');
      console.log('   Solution: Need to check different fields or use a different matching strategy\n');
    }

    console.log('📋 NEXT STEPS:');
    console.log('  1. Run find-real-calls.sql in Supabase to see what\'s actually in the data');
    console.log('  2. Check if your team actually uses extensions 101-123');
    console.log('  3. We might need to match by agent phone numbers instead of extensions');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

diagnose();