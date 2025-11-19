#!/usr/bin/env node
/**
 * Diagnose why we're only finding 53 calls when there should be 200+
 * This will show us what's in the raw data
 */

import { getCallLog } from '../lib/ringcentral/client.js';
import dotenv from 'dotenv';

dotenv.config();

async function diagnoseFiltering() {
  console.log('🔍 DIAGNOSING CALL FILTERING ISSUE\n');
  console.log('=' .repeat(60));

  try {
    // Get last 7 days of calls
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 7);

    console.log(`📅 Fetching last 7 days: ${dateFrom.toISOString().split('T')[0]} to ${dateTo.toISOString().split('T')[0]}\n`);

    const response = await getCallLog({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      perPage: 1000,
      view: 'Detailed',
    });

    const calls = response.records || [];
    console.log(`📊 Total calls fetched: ${calls.length}\n`);

    // Analyze extension presence
    let hasFromExtension = 0;
    let hasToExtension = 0;
    let hasLegExtension = 0;
    let hasExtensionField = 0;
    let hasNoExtension = 0;

    const extensionSources = {};
    const allExtensions = new Set();
    const teamExtensions = ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '113', '114', '117', '118', '119', '120', '121', '122', '123'];
    let teamCallsFound = 0;

    // Sample calls for detailed analysis
    const sampleCalls = [];

    calls.forEach((call, index) => {
      let foundExtension = false;
      let extensionLocation = [];

      // Check from.extensionNumber
      if (call.from?.extensionNumber) {
        hasFromExtension++;
        foundExtension = true;
        extensionLocation.push(`from: ${call.from.extensionNumber}`);
        allExtensions.add(call.from.extensionNumber);
        if (teamExtensions.includes(call.from.extensionNumber)) {
          teamCallsFound++;
        }
      }

      // Check to.extensionNumber
      if (call.to?.extensionNumber) {
        hasToExtension++;
        foundExtension = true;
        extensionLocation.push(`to: ${call.to.extensionNumber}`);
        allExtensions.add(call.to.extensionNumber);
        if (teamExtensions.includes(call.to.extensionNumber)) {
          teamCallsFound++;
        }
      }

      // Check legs
      if (call.legs && call.legs.length > 0) {
        call.legs.forEach(leg => {
          if (leg.from?.extensionNumber) {
            hasLegExtension++;
            foundExtension = true;
            extensionLocation.push(`leg.from: ${leg.from.extensionNumber}`);
            allExtensions.add(leg.from.extensionNumber);
          }
          if (leg.to?.extensionNumber) {
            hasLegExtension++;
            foundExtension = true;
            extensionLocation.push(`leg.to: ${leg.to.extensionNumber}`);
            allExtensions.add(leg.to.extensionNumber);
          }
        });
      }

      // Check extension field
      if (call.extension?.extensionNumber) {
        hasExtensionField++;
        foundExtension = true;
        extensionLocation.push(`extension: ${call.extension.extensionNumber}`);
        allExtensions.add(call.extension.extensionNumber);
      }

      if (!foundExtension) {
        hasNoExtension++;
      }

      // Collect samples for analysis
      if (index < 10 || !foundExtension) {
        sampleCalls.push({
          id: call.id,
          direction: call.direction,
          type: call.type,
          result: call.result,
          duration: call.duration,
          from: call.from?.name || call.from?.phoneNumber || 'N/A',
          to: call.to?.name || call.to?.phoneNumber || 'N/A',
          extensionLocations: extensionLocation,
          hasExtension: foundExtension,
        });
      }

      // Track where extensions are found
      const key = extensionLocation.length > 0 ? extensionLocation.join(', ') : 'no extension';
      extensionSources[key] = (extensionSources[key] || 0) + 1;
    });

    console.log('📍 WHERE EXTENSIONS ARE FOUND:');
    console.log(`  • from.extensionNumber: ${hasFromExtension} calls`);
    console.log(`  • to.extensionNumber: ${hasToExtension} calls`);
    console.log(`  • in legs: ${hasLegExtension} calls`);
    console.log(`  • extension field: ${hasExtensionField} calls`);
    console.log(`  • NO EXTENSION FOUND: ${hasNoExtension} calls ⚠️\n`);

    console.log('📱 ALL UNIQUE EXTENSIONS FOUND:');
    const sortedExtensions = Array.from(allExtensions).sort();
    console.log(sortedExtensions.join(', ') || 'None');

    console.log('\n🎯 TEAM EXTENSIONS DETECTED:');
    const teamExtensionsFound = sortedExtensions.filter(ext => teamExtensions.includes(ext));
    console.log(`Found ${teamExtensionsFound.length} of your team extensions: ${teamExtensionsFound.join(', ')}`);
    console.log(`Calls with team extensions: ${teamCallsFound}\n`);

    console.log('📋 SAMPLE CALLS (first 10 + those without extensions):');
    console.log('-'.repeat(60));
    sampleCalls.slice(0, 20).forEach(call => {
      console.log(`\nCall ID: ${call.id}`);
      console.log(`  Direction: ${call.direction} | Type: ${call.type} | Result: ${call.result}`);
      console.log(`  Duration: ${call.duration}s`);
      console.log(`  From: ${call.from}`);
      console.log(`  To: ${call.to}`);
      console.log(`  Extensions: ${call.extensionLocations.length > 0 ? call.extensionLocations.join(', ') : '❌ NONE FOUND'}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n🔴 DIAGNOSIS:');

    if (hasNoExtension > calls.length * 0.5) {
      console.log('  ⚠️  PROBLEM: Most calls have NO extension data!');
      console.log('  This might be because:');
      console.log('  1. Calls are from/to external numbers only');
      console.log('  2. Extension data is in a different field');
      console.log('  3. Need to use a different API endpoint');
    }

    if (teamCallsFound < 50) {
      console.log('  ⚠️  Very few team extension calls found');
      console.log('  Your team might be using different extensions than expected');
    }

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('  1. Check if your team uses the extensions 101-123');
    console.log('  2. We might need to sync ALL calls (not filter by extension)');
    console.log('  3. Then identify team calls by agent name or phone number instead');

  } catch (error) {
    console.error('Error:', error);
  }
}

diagnoseFiltering();