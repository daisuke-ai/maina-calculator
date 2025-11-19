#!/usr/bin/env node
// Debug script to investigate call count discrepancies
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

async function debugCallCounts() {
  console.log('='.repeat(80));
  console.log('CALL COUNT DEBUGGING');
  console.log('='.repeat(80));

  // 1. Check total call records in database
  const { count: totalRecords, error: countError } = await supabase
    .from('call_logs')
    .select('*', { count: 'exact', head: true });

  console.log(`\n1. Total call_logs records: ${totalRecords}`);

  // 2. Count unique sessions
  const { data: sessionData, error: sessionError } = await supabase
    .from('call_logs')
    .select('session_id');

  const uniqueSessions = new Set(sessionData?.map(r => r.session_id) || []).size;
  console.log(`2. Unique session_ids: ${uniqueSessions}`);
  console.log(`   Difference: ${totalRecords - uniqueSessions} duplicate sessions`);

  // 3. Check for duplicate call IDs
  const { data: allIds } = await supabase
    .from('call_logs')
    .select('id');

  const idCounts = {};
  allIds?.forEach(record => {
    idCounts[record.id] = (idCounts[record.id] || 0) + 1;
  });

  const duplicateIdCount = Object.values(idCounts).filter(count => count > 1).length;
  const totalDuplicateRecords = Object.values(idCounts).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0);
  console.log(`3. Duplicate call IDs: ${duplicateIdCount} (${totalDuplicateRecords} extra records)`);

  // 4. Sample some records to see structure
  console.log('\n4. Sample records with same session_id:');
  const { data: sampleRecords } = await supabase
    .from('call_logs')
    .select('id, session_id, direction, call_result, duration, agent_id, extension_number')
    .limit(100);

  // Group by session_id
  const sessionGroups = {};
  sampleRecords?.forEach(record => {
    if (!sessionGroups[record.session_id]) {
      sessionGroups[record.session_id] = [];
    }
    sessionGroups[record.session_id].push(record);
  });

  // Find sessions with multiple records
  const multiRecordSessions = Object.entries(sessionGroups)
    .filter(([_, records]) => records.length > 1)
    .slice(0, 3); // Show first 3

  multiRecordSessions.forEach(([sessionId, records]) => {
    console.log(`\n   Session: ${sessionId} (${records.length} records)`);
    records.forEach(r => {
      console.log(`     - ID: ${r.id.substring(0, 30)}... | ${r.direction} | ${r.call_result} | Duration: ${r.duration}s | Agent: ${r.agent_id} | Ext: ${r.extension_number}`);
    });
  });

  // 5. Count by agent using current view logic
  console.log('\n5. Call counts per agent (current view logic):');
  const { data: agentCounts } = await supabase
    .from('agent_call_performance')
    .select('agent_name, total_calls, inbound_calls, outbound_calls')
    .order('total_calls', { ascending: false })
    .limit(10);

  agentCounts?.forEach(agent => {
    console.log(`   ${agent.agent_name}: ${agent.total_calls} calls (${agent.inbound_calls} in / ${agent.outbound_calls} out)`);
  });

  // 6. Count unique sessions per agent
  console.log('\n6. Unique SESSION counts per agent (correct count):');
  const { data: allCalls } = await supabase
    .from('call_logs')
    .select('agent_id, session_id, direction');

  const agentSessionCounts = {};
  allCalls?.forEach(call => {
    if (call.agent_id) {
      if (!agentSessionCounts[call.agent_id]) {
        agentSessionCounts[call.agent_id] = {
          sessions: new Set(),
          inbound: new Set(),
          outbound: new Set(),
        };
      }
      agentSessionCounts[call.agent_id].sessions.add(call.session_id);
      if (call.direction === 'Inbound') {
        agentSessionCounts[call.agent_id].inbound.add(call.session_id);
      } else {
        agentSessionCounts[call.agent_id].outbound.add(call.session_id);
      }
    }
  });

  // Get agent names
  const { data: agents } = await supabase
    .from('agents')
    .select('id, alias_name');

  const agentMap = {};
  agents?.forEach(a => {
    agentMap[a.id] = a.alias_name;
  });

  Object.entries(agentSessionCounts)
    .sort(([, a], [, b]) => b.sessions.size - a.sessions.size)
    .slice(0, 10)
    .forEach(([agentId, counts]) => {
      const name = agentMap[agentId] || `Agent ${agentId}`;
      console.log(`   ${name}: ${counts.sessions.size} calls (${counts.inbound.size} in / ${counts.outbound.size} out)`);
    });

  // 7. Compare the two methods
  console.log('\n7. DISCREPANCY ANALYSIS:');
  console.log(`   Total records: ${totalRecords}`);
  console.log(`   Unique sessions: ${uniqueSessions}`);
  console.log(`   Records per session (avg): ${(totalRecords / uniqueSessions).toFixed(2)}`);
  console.log('\n   This suggests we should count UNIQUE session_ids, not individual records!');
}

debugCallCounts().catch(console.error);
