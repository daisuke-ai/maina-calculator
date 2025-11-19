import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDuplicates() {
  try {
    // Get total call count
    const { count: totalCalls } = await supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true });

    console.log('\n=== CALL DATA ANALYSIS ===');
    console.log('Total call records in database:', totalCalls);

    // Check for duplicate IDs (should be none since ID is primary key)
    const { data: callsByAgent } = await supabase
      .from('call_logs')
      .select('agent_id')
      .not('agent_id', 'is', null);

    // Count calls by agent
    const agentCounts = {};
    callsByAgent?.forEach(call => {
      agentCounts[call.agent_id] = (agentCounts[call.agent_id] || 0) + 1;
    });

    console.log('\nCalls by Agent:');
    Object.entries(agentCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([agentId, count]) => {
        console.log(`  Agent ${agentId}: ${count} calls`);
      });

    // Check for duplicate session_ids (which might indicate duplicate records)
    const { data: sessions } = await supabase
      .from('call_logs')
      .select('session_id, id, started_at, agent_id');

    const sessionMap = {};
    sessions?.forEach(call => {
      if (!sessionMap[call.session_id]) {
        sessionMap[call.session_id] = [];
      }
      sessionMap[call.session_id].push(call);
    });

    const duplicateSessions = Object.entries(sessionMap)
      .filter(([_, calls]) => calls.length > 1);

    if (duplicateSessions.length > 0) {
      console.log('\n⚠️  Found duplicate session_ids:');
      duplicateSessions.slice(0, 5).forEach(([sessionId, calls]) => {
        console.log(`  Session ${sessionId}: ${calls.length} records`);
        calls.forEach(call => {
          console.log(`    - ID: ${call.id}, Agent: ${call.agent_id}, Time: ${call.started_at}`);
        });
      });
      console.log(`\nTotal sessions with duplicates: ${duplicateSessions.length}`);
    } else {
      console.log('\n✓ No duplicate session_ids found');
    }

    // Check date range of calls
    const { data: dateRange } = await supabase
      .from('call_logs')
      .select('started_at')
      .order('started_at', { ascending: true })
      .limit(1);

    const { data: latestCall } = await supabase
      .from('call_logs')
      .select('started_at')
      .order('started_at', { ascending: false })
      .limit(1);

    if (dateRange && latestCall) {
      console.log('\nDate Range of Calls:');
      console.log(`  Earliest: ${dateRange[0].started_at}`);
      console.log(`  Latest: ${latestCall[0].started_at}`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDuplicates();