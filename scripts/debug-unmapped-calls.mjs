// scripts/debug-unmapped-calls.mjs
// Check what extensions are not being mapped
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
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUnmappedCalls() {
  console.log('\\n🔍 Debugging Unmapped Calls (Nov 17, 2025)\\n');

  // Get all calls with no agent_id
  const { data: unmappedCalls, error } = await supabase
    .from('call_logs')
    .select('id, extension_number, from_number, to_number, direction, call_result')
    .is('agent_id', null)
    .gte('started_at', '2025-11-17T00:00:00Z')
    .lt('started_at', '2025-11-18T00:00:00Z')
    .limit(30);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${unmappedCalls.length} unmapped calls\\n`);

  // Group by extension
  const byExtension = {};
  for (const call of unmappedCalls) {
    const ext = call.extension_number || 'NO_EXT';
    if (!byExtension[ext]) {
      byExtension[ext] = [];
    }
    byExtension[ext].push(call);
  }

  console.log('Unmapped calls by extension:\\n');
  for (const [ext, calls] of Object.entries(byExtension)) {
    console.log(`Extension ${ext}: ${calls.length} calls`);
    for (const call of calls.slice(0, 3)) {
      console.log(`  - ${call.direction} | ${call.call_result} | From: ${call.from_number} | To: ${call.to_number}`);
    }
    if (calls.length > 3) {
      console.log(`  ... and ${calls.length - 3} more`);
    }
  }

  // Check specific extensions
  console.log('\\n📋 Checking problematic extensions:\\n');

  for (const ext of ['108', '102']) {
    const { data: extCalls, error: extError } = await supabase
      .from('call_logs')
      .select('agent_id, extension_number, direction')
      .eq('extension_number', ext)
      .gte('started_at', '2025-11-17T00:00:00Z')
      .lt('started_at', '2025-11-18T00:00:00Z')
      .limit(5);

    console.log(`Extension ${ext}:`);
    if (extCalls && extCalls.length > 0) {
      console.log(`  Found ${extCalls.length} calls`);
      for (const call of extCalls) {
        console.log(`  - Agent ID: ${call.agent_id} | Direction: ${call.direction}`);
      }
    } else {
      console.log('  No calls found with this extension');
    }
  }

  // Check all extensions in database
  console.log('\\n📊 All extensions in database (Nov 17):\\n');
  const { data: allExts, error: extError } = await supabase
    .from('call_logs')
    .select('extension_number')
    .gte('started_at', '2025-11-17T00:00:00Z')
    .lt('started_at', '2025-11-18T00:00:00Z');

  const extCounts = {};
  for (const row of allExts || []) {
    const ext = row.extension_number || 'NO_EXT';
    extCounts[ext] = (extCounts[ext] || 0) + 1;
  }

  const sorted = Object.entries(extCounts).sort((a, b) => b[1] - a[1]);
  for (const [ext, count] of sorted.slice(0, 20)) {
    console.log(`  ${ext}: ${count} calls`);
  }
}

debugUnmappedCalls().catch(console.error);