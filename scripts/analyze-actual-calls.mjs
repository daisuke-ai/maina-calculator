#!/usr/bin/env node
/**
 * Analyze what calls we actually have in the database
 * to understand why we have 528 calls
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeCallsV2() {
  console.log('🔍 ANALYZING CALL DATA TO FIND THE REAL NUMBERS\n');
  console.log('='.repeat(60));

  try {
    // 1. Get total count
    const { count: totalCalls } = await supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total calls in database: ${totalCalls}`);

    // 2. Check call types and results
    const { data: callTypes } = await supabase
      .from('call_logs')
      .select('call_type, call_result, direction');

    const typeAnalysis = {};
    callTypes?.forEach(call => {
      const key = `${call.direction} - ${call.call_type} - ${call.call_result}`;
      typeAnalysis[key] = (typeAnalysis[key] || 0) + 1;
    });

    console.log('\n📞 Call Types Breakdown:');
    Object.entries(typeAnalysis)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

    // 3. Check call durations
    const { data: durations } = await supabase
      .from('call_logs')
      .select('duration');

    const shortCalls = durations?.filter(d => d.duration < 10).length || 0;
    const mediumCalls = durations?.filter(d => d.duration >= 10 && d.duration < 60).length || 0;
    const longCalls = durations?.filter(d => d.duration >= 60).length || 0;

    console.log('\n⏱️  Duration Analysis:');
    console.log(`  < 10 seconds: ${shortCalls} calls (might be misdials/voicemail)`)
    console.log(`  10-60 seconds: ${mediumCalls} calls`)
    console.log(`  > 60 seconds: ${longCalls} calls (likely real conversations)`);

    // 4. Check date distribution
    const { data: calls } = await supabase
      .from('call_logs')
      .select('started_at')
      .order('started_at', { ascending: false });

    if (calls && calls.length > 0) {
      const dateMap = {};
      calls.forEach(call => {
        const date = new Date(call.started_at).toLocaleDateString();
        dateMap[date] = (dateMap[date] || 0) + 1;
      });

      console.log('\n📅 Daily Distribution (last 10 days):');
      Object.entries(dateMap)
        .slice(0, 10)
        .forEach(([date, count]) => {
          const bar = '█'.repeat(Math.min(count, 50));
          console.log(`  ${date}: ${bar} ${count}`);
        });
    }

    // 5. Check extensions
    const { data: extensions } = await supabase
      .from('call_logs')
      .select('extension_number')
      .not('extension_number', 'is', null);

    const extensionMap = {};
    extensions?.forEach(ext => {
      extensionMap[ext.extension_number] = (extensionMap[ext.extension_number] || 0) + 1;
    });

    console.log('\n📱 Extensions with calls:');
    Object.entries(extensionMap)
      .sort((a, b) => b[1] - a[1])
      .forEach(([ext, count]) => {
        console.log(`  Extension ${ext}: ${count} calls`);
      });

    // 6. Check for specific patterns that might indicate test/system calls
    const { data: sampleCalls } = await supabase
      .from('call_logs')
      .select('from_number, to_number, duration, call_result')
      .limit(20);

    console.log('\n🔎 Sample of calls (to identify patterns):');
    sampleCalls?.slice(0, 5).forEach(call => {
      console.log(`  From: ${call.from_number || 'N/A'} → To: ${call.to_number || 'N/A'} | Duration: ${call.duration}s | Result: ${call.call_result}`);
    });

    // 7. Calculate what REAL calls might be
    const { data: realCalls } = await supabase
      .from('call_logs')
      .select('*')
      .gte('duration', 30)  // At least 30 seconds
      .in('call_result', ['Call connected', 'Accepted', 'Success']); // Successful calls

    console.log('\n✅ LIKELY REAL CALLS:');
    console.log(`  Calls >= 30 seconds with successful result: ${realCalls?.length || 0}`);

    // 8. Check if we're getting calls from multiple accounts/companies
    const { data: phoneNumbers } = await supabase
      .from('call_logs')
      .select('from_number, to_number');

    const uniqueFromNumbers = new Set(phoneNumbers?.map(p => p.from_number).filter(Boolean));
    const uniqueToNumbers = new Set(phoneNumbers?.map(p => p.to_number).filter(Boolean));

    console.log('\n☎️  Phone Number Analysis:');
    console.log(`  Unique FROM numbers: ${uniqueFromNumbers.size}`);
    console.log(`  Unique TO numbers: ${uniqueToNumbers.size}`);

    if (uniqueFromNumbers.size > 50 || uniqueToNumbers.size > 50) {
      console.log('  ⚠️  HIGH NUMBER VARIETY - Might be getting company-wide calls!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 CONCLUSION:');
    console.log(`  Total calls fetched: ${totalCalls}`);
    console.log(`  Likely REAL calls (30s+, successful): ${realCalls?.length || 0}`);
    console.log(`  Possible noise: ${totalCalls - (realCalls?.length || 0)} calls`);
    console.log('\n💡 The issue: We\'re fetching ACCOUNT-WIDE calls, not just your team\'s calls!');
    console.log('   Solution: Filter by specific extension numbers or use extension-specific API');

  } catch (error) {
    console.error('Error analyzing calls:', error);
  }
}

analyzeCallsV2();