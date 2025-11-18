// scripts/verify-call-sync.mjs
// Verify that call syncing is working correctly
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expected data from RingCentral report (Nov 17, 2025)
const expectedCallCounts = {
  20: { name: 'Mishaal (Anna)', ext: '122', expected: 37 },
  6: { name: 'Maasomah (Lina)', ext: '104', expected: 21 },
  7: { name: 'Faizan (Fazil)', ext: '108', expected: 17 },
  15: { name: 'Talha (Tabeeb)', ext: '121', expected: 17 },
  11: { name: 'Abdullah (Noyaan)', ext: '101', expected: 15 },
  17: { name: 'Rameen (Ayla)', ext: '111', expected: 11 },
  8: { name: 'Mahrukh (Mina)', ext: '109', expected: 8 },
  5: { name: 'Farhat', ext: '105', expected: 6 },
  12: { name: 'Amir (Emir)', ext: '107', expected: 6 },
  2: { name: 'Ayesha (Ada)', ext: '123', expected: 5 },
  9: { name: 'Awais (Ozan)', ext: '103', expected: 4 },
  10: { name: 'Tayyab (Burakh)', ext: '102', expected: 2 },
};

async function verifyCallSync() {
  console.log('\\n📞 Verifying Call Sync Data\\n');
  console.log('Checking Nov 17, 2025 data against RingCentral report...\\n');

  // Get call counts by agent for Nov 17
  const { data: callCounts, error } = await supabase
    .from('call_logs')
    .select('agent_id, extension_number')
    .gte('started_at', '2025-11-17T00:00:00Z')
    .lt('started_at', '2025-11-18T00:00:00Z');

  if (error) {
    console.error('Error fetching call data:', error);
    return;
  }

  // Count calls per agent
  const agentCallCounts = {};
  const extensionCounts = {};

  for (const call of callCounts) {
    const agentId = call.agent_id;
    const ext = call.extension_number;

    if (agentId) {
      agentCallCounts[agentId] = (agentCallCounts[agentId] || 0) + 1;
    }
    if (ext) {
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    }
  }

  console.log('📊 Results Comparison:\\n');
  console.log('Agent ID | Name            | Ext  | Expected | Actual | Status');
  console.log('---------|-----------------|------|----------|--------|--------');

  let totalExpected = 0;
  let totalActual = 0;
  let correctMappings = 0;
  let incorrectMappings = 0;

  for (const [agentId, data] of Object.entries(expectedCallCounts)) {
    const actual = agentCallCounts[agentId] || 0;
    const expected = data.expected;
    const status = actual === expected ? '✅' : actual > 0 ? '⚠️' : '❌';

    totalExpected += expected;
    totalActual += actual;

    if (actual === expected) {
      correctMappings++;
    } else {
      incorrectMappings++;
    }

    console.log(
      `${agentId.padStart(8)} | ${data.name.padEnd(15)} | ${data.ext.padEnd(4)} | ${expected
        .toString()
        .padStart(8)} | ${actual.toString().padStart(6)} | ${status}`
    );
  }

  console.log('\\n📈 Summary:');
  console.log(`Total Expected Calls: ${totalExpected}`);
  console.log(`Total Synced Calls: ${totalActual}`);
  console.log(`Correct Mappings: ${correctMappings}/${Object.keys(expectedCallCounts).length}`);
  console.log(`Sync Accuracy: ${((totalActual / totalExpected) * 100).toFixed(1)}%`);

  // Show unmapped extensions
  console.log('\\n🔍 Extensions in Database:');
  for (const [ext, count] of Object.entries(extensionCounts).sort((a, b) => b[1] - a[1])) {
    if (count > 0) {
      console.log(`Extension ${ext}: ${count} calls`);
    }
  }

  // Check for calls without agent mapping
  const { data: unmappedCalls, error: unmappedError } = await supabase
    .from('call_logs')
    .select('extension_number')
    .is('agent_id', null)
    .gte('started_at', '2025-11-17T00:00:00Z')
    .lt('started_at', '2025-11-18T00:00:00Z');

  if (unmappedCalls && unmappedCalls.length > 0) {
    console.log(`\\n⚠️ Found ${unmappedCalls.length} calls without agent mapping`);
    const unmappedExts = [...new Set(unmappedCalls.map(c => c.extension_number))].filter(Boolean);
    console.log('Unmapped extensions:', unmappedExts.join(', '));
  }

  console.log('\\n✅ Verification complete!\\n');

  // Suggest re-sync if accuracy is low
  if (totalActual < totalExpected * 0.9) {
    console.log('💡 Tip: Sync accuracy is low. Try re-syncing with:');
    console.log('curl -X POST http://localhost:3000/api/ringcentral/sync-calls \\\\');
    console.log('  -H "Content-Type: application/json" \\\\');
    console.log('  -d \'{"dateFrom":"2025-11-17T00:00:00Z","dateTo":"2025-11-17T23:59:59Z","perPage":500}\'');
  }
}

// Run verification
verifyCallSync().catch(console.error);