#!/usr/bin/env node
// Analyze calls without agent_id to see if they can be mapped via phone numbers
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Phone number to agent mapping (from ringcentral-mapping.ts)
const PHONE_NUMBER_TO_AGENT = {
  '6615962945': 5, '4062299305': 5,  // Farhat
  '6615962746': 6, '4062299306': 6,  // Maasomah/Lina
  '6616050324': 7, '4062299307': 7,  // Faizan/Fazil
  '6616050328': 8, '4062299308': 8,  // Mahrukh/Mina
  '6615962522': 9, '4062299309': 9,  // Awais/Ozan
  '6615962409': 10, '4062299310': 10, // Tayyab/Burakh
  '6615962010': 11, '4062299311': 11, // Abdullah/Noyaan
  '6616050319': 12, '4062299312': 12, // Amir/Emir
  '5593176681': 15, '4062299315': 15, // Talha/Tabeeb
  '6615962959': 16, '4062299316': 16, // Fatima/Eleena
  '5592185757': 17, '4062299317': 17, // Rameen/Ayla
  '5592860509': 19, '4062299319': 19, // Hannan
  '5597775856': 20, '4062299320': 20, // Mishaal/Anna
  '5592185524': 21, '4062299321': 21, // Laiba/Eda
  '5597775113': 2, '4062299302': 2,   // Ayesha/Ada
  '5592860470': 3, '4062299303': 3,   // Eman/Elif
  '6616050329': 25, // Mian
  '5594212021': 26, // Ifaf
  '5595700778': 27, // Shahab
  '5592067202': 28, // Support/English Issue
};

function getAgentIdFromPhone(phoneNumber) {
  if (!phoneNumber) return null;

  const cleaned = phoneNumber.replace(/\D/g, '');

  if (PHONE_NUMBER_TO_AGENT[cleaned]) return PHONE_NUMBER_TO_AGENT[cleaned];

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const withoutCountry = cleaned.substring(1);
    if (PHONE_NUMBER_TO_AGENT[withoutCountry]) return PHONE_NUMBER_TO_AGENT[withoutCountry];
  }

  if (cleaned.length > 10) {
    const last10 = cleaned.slice(-10);
    if (PHONE_NUMBER_TO_AGENT[last10]) return PHONE_NUMBER_TO_AGENT[last10];
  }

  const last4 = cleaned.slice(-4);
  for (const [fullNumber, agentId] of Object.entries(PHONE_NUMBER_TO_AGENT)) {
    if (fullNumber.endsWith(last4)) return agentId;
  }

  return null;
}

async function analyzeUnmappedCalls() {
  console.log('='.repeat(80));
  console.log('ANALYZING UNMAPPED CALLS (No Agent ID)');
  console.log('='.repeat(80));

  // Get all calls without agent_id
  const { data: unmappedCalls } = await supabase
    .from('call_logs')
    .select('*')
    .is('agent_id', null)
    .order('started_at', { ascending: false });

  console.log(`\nTotal unmapped calls: ${unmappedCalls?.length || 0}\n`);

  if (!unmappedCalls || unmappedCalls.length === 0) {
    console.log('✓ All calls are mapped!');
    return;
  }

  // Categorize unmapped calls
  const withoutExtension = unmappedCalls.filter(c => !c.extension_number);
  const withExtension = unmappedCalls.filter(c => c.extension_number);

  console.log('BREAKDOWN:');
  console.log(`  • Calls without extension_number: ${withoutExtension.length}`);
  console.log(`  • Calls with extension but not mapped: ${withExtension.length}\n`);

  // Initialize phone number analysis object
  const phoneNumberAttempts = {
    canMapByFrom: [],
    canMapByTo: [],
    cannotMap: []
  };

  // Analyze calls without extension numbers
  if (withoutExtension.length > 0) {
    console.log('='.repeat(80));
    console.log('CALLS WITHOUT EXTENSION NUMBERS');
    console.log('='.repeat(80));

    withoutExtension.forEach(call => {
      const fromAgent = getAgentIdFromPhone(call.from_number);
      const toAgent = getAgentIdFromPhone(call.to_number);

      if (fromAgent) {
        phoneNumberAttempts.canMapByFrom.push({ ...call, suggestedAgent: fromAgent });
      } else if (toAgent) {
        phoneNumberAttempts.canMapByTo.push({ ...call, suggestedAgent: toAgent });
      } else {
        phoneNumberAttempts.cannotMap.push(call);
      }
    });

    console.log(`\n📊 Phone Number Mapping Analysis:`);
    console.log(`  ✓ Can map by FROM number: ${phoneNumberAttempts.canMapByFrom.length}`);
    console.log(`  ✓ Can map by TO number: ${phoneNumberAttempts.canMapByTo.length}`);
    console.log(`  ✗ Cannot map: ${phoneNumberAttempts.cannotMap.length}\n`);

    // Show potentially mappable calls
    if (phoneNumberAttempts.canMapByFrom.length > 0) {
      console.log('POTENTIALLY MAPPABLE (By FROM number):');
      phoneNumberAttempts.canMapByFrom.slice(0, 10).forEach(call => {
        console.log(`  📞 ${call.direction}: ${call.from_number} → ${call.to_number}`);
        console.log(`     Agent: ${call.suggestedAgent}, Duration: ${call.duration}s, Date: ${call.started_at.split('T')[0]}`);
      });
      if (phoneNumberAttempts.canMapByFrom.length > 10) {
        console.log(`     ... and ${phoneNumberAttempts.canMapByFrom.length - 10} more\n`);
      }
    }

    if (phoneNumberAttempts.canMapByTo.length > 0) {
      console.log('\nPOTENTIALLY MAPPABLE (By TO number):');
      phoneNumberAttempts.canMapByTo.slice(0, 10).forEach(call => {
        console.log(`  📞 ${call.direction}: ${call.from_number} → ${call.to_number}`);
        console.log(`     Agent: ${call.suggestedAgent}, Duration: ${call.duration}s, Date: ${call.started_at.split('T')[0]}`);
      });
      if (phoneNumberAttempts.canMapByTo.length > 10) {
        console.log(`     ... and ${phoneNumberAttempts.canMapByTo.length - 10} more\n`);
      }
    }

    // Show calls that cannot be mapped
    if (phoneNumberAttempts.cannotMap.length > 0) {
      console.log('\n❌ CANNOT MAP (Unknown phone numbers):');

      // Group by phone number patterns
      const fromNumbers = {};
      const toNumbers = {};

      phoneNumberAttempts.cannotMap.forEach(call => {
        const from = call.from_number || 'unknown';
        const to = call.to_number || 'unknown';
        fromNumbers[from] = (fromNumbers[from] || 0) + 1;
        toNumbers[to] = (toNumbers[to] || 0) + 1;
      });

      console.log('\n  Most common FROM numbers:');
      Object.entries(fromNumbers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([num, count]) => {
          console.log(`    ${num}: ${count} calls`);
        });

      console.log('\n  Most common TO numbers:');
      Object.entries(toNumbers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([num, count]) => {
          console.log(`    ${num}: ${count} calls`);
        });

      // Show sample unmappable calls
      console.log('\n  Sample calls:');
      phoneNumberAttempts.cannotMap.slice(0, 5).forEach(call => {
        console.log(`    ${call.direction}: ${call.from_number} → ${call.to_number}`);
        console.log(`      Type: ${call.call_type}, Result: ${call.call_result}, Duration: ${call.duration}s`);
      });
    }
  }

  // Analyze calls with extension but not mapped
  if (withExtension.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('CALLS WITH EXTENSION BUT NOT MAPPED (Should not happen!)');
    console.log('='.repeat(80));

    withExtension.forEach(call => {
      console.log(`  Extension ${call.extension_number}: ${call.direction} call`);
      console.log(`    From: ${call.from_number}, To: ${call.to_number}`);
      console.log(`    Date: ${call.started_at}, Duration: ${call.duration}s\n`);
    });
  }

  // Summary and recommendations
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80));

  const totalMappable = phoneNumberAttempts.canMapByFrom.length + phoneNumberAttempts.canMapByTo.length;

  if (totalMappable > 0) {
    console.log(`\n✓ ${totalMappable} calls can potentially be mapped using phone numbers`);
    console.log('  Action: Update the sync logic to use phone number fallback mapping');
  }

  if (phoneNumberAttempts.cannotMap.length > 0) {
    console.log(`\n⚠️  ${phoneNumberAttempts.cannotMap.length} calls cannot be mapped`);
    console.log('  These calls involve unknown phone numbers not in the mapping config');
    console.log('  Action: Review if these numbers belong to agents and add to PHONE_NUMBER_TO_AGENT');
  }

  console.log('\n');
}

analyzeUnmappedCalls().catch(console.error);
