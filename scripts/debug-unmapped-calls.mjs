#!/usr/bin/env node
// Debug script to find unmapped extensions and phone numbers
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

// Hardcode the mapping to avoid import issues
const RINGCENTRAL_EXTENSION_TO_AGENT = {
  '101': 11, '102': 10, '103': 9, '104': 6, '105': 5, '106': 16, '107': 12,
  '108': 7, '109': 8, '110': 25, '111': 17, '113': 21, '114': 3, '117': 28,
  '118': 26, '119': 27, '120': 19, '121': 15, '122': 20, '123': 2
};

async function debugUnmappedCalls() {
  console.log('='.repeat(80));
  console.log('UNMAPPED EXTENSIONS ANALYSIS');
  console.log('='.repeat(80));

  const { data: allCalls } = await supabase
    .from('call_logs')
    .select('id, extension_number, agent_id, direction, from_number, to_number, started_at');

  const extensionCounts = {};
  const unmappedCalls = [];

  allCalls?.forEach(call => {
    if (call.extension_number) {
      if (!extensionCounts[call.extension_number]) {
        extensionCounts[call.extension_number] = { total: 0, mapped: 0, unmapped: 0 };
      }
      extensionCounts[call.extension_number].total++;

      if (call.agent_id) {
        extensionCounts[call.extension_number].mapped++;
      } else {
        extensionCounts[call.extension_number].unmapped++;
        unmappedCalls.push(call);
      }
    } else if (!call.agent_id) {
      unmappedCalls.push(call);
    }
  });

  console.log('\n1. EXTENSION SUMMARY:');
  console.log(`   Total calls in database: ${allCalls?.length || 0}`);
  console.log(`   Calls with extension_number: ${Object.keys(extensionCounts).length > 0 ? Object.values(extensionCounts).reduce((sum, c) => sum + c.total, 0) : 0}`);
  console.log(`   Calls without agent_id (unmapped): ${unmappedCalls.length}`);

  console.log('\n2. EXTENSION COUNTS (sorted by total calls):');
  const sortedExtensions = Object.entries(extensionCounts)
    .sort(([, a], [, b]) => b.total - a.total);

  sortedExtensions.forEach(([ext, counts]) => {
    const inMapping = RINGCENTRAL_EXTENSION_TO_AGENT[ext] ? '✓' : '✗';
    const status = counts.unmapped > 0 ? `⚠️  ${counts.unmapped} unmapped` : '✓ All mapped';
    console.log(`   Ext ${ext.padEnd(4)} ${inMapping}  ${counts.total.toString().padStart(4)} calls  -  ${status}`);
  });

  console.log('\n3. UNMAPPED EXTENSIONS:');
  const unmappedExtensions = sortedExtensions.filter(([ext]) => !RINGCENTRAL_EXTENSION_TO_AGENT[ext]);

  if (unmappedExtensions.length > 0) {
    unmappedExtensions.forEach(([ext, counts]) => {
      console.log(`   Extension ${ext}: ${counts.total} calls not mapped`);
      const sampleCalls = allCalls?.filter(c => c.extension_number === ext).slice(0, 3);
      sampleCalls?.forEach(call => {
        console.log(`     - ${call.direction}: from ${call.from_number || 'unknown'} to ${call.to_number || 'unknown'}`);
      });
    });
  } else {
    console.log('   ✓ All extensions are mapped!');
  }

  console.log('\n4. TOP 10 AGENTS BY CALL COUNT:');
  const { data: agents } = await supabase
    .from('agents')
    .select('id, alias_name');

  const agentMap = {};
  agents?.forEach(a => { agentMap[a.id] = a.alias_name; });

  const agentCalls = {};
  allCalls?.forEach(call => {
    if (call.agent_id) {
      if (!agentCalls[call.agent_id]) {
        agentCalls[call.agent_id] = { total: 0, inbound: 0, outbound: 0 };
      }
      agentCalls[call.agent_id].total++;
      if (call.direction === 'Inbound') {
        agentCalls[call.agent_id].inbound++;
      } else {
        agentCalls[call.agent_id].outbound++;
      }
    }
  });

  Object.entries(agentCalls)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10)
    .forEach(([agentId, stats]) => {
      const name = agentMap[agentId] || `Agent ${agentId}`;
      console.log(`   ${name.padEnd(15)}: ${stats.total.toString().padStart(3)} calls (${stats.inbound} in / ${stats.outbound} out)`);
    });
}

debugUnmappedCalls().catch(console.error);
