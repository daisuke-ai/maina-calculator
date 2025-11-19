import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Your RingCentral data from latest screenshot (actual all-time data)
const RINGCENTRAL_DATA = {
  '122': { name: 'Mishaal #A', calls: 106, agentName: 'Anna' },
  '104': { name: 'Masoumah #C', calls: 85, agentName: 'Lina' },
  '111': { name: 'Rameen #A', calls: 39, agentName: 'Ayla' },
  '121': { name: 'Talha #C', calls: 34, agentName: 'Tabeeb' },
  '106': { name: 'Fatima #C', calls: 34, agentName: 'Eleena' },
  '113': { name: 'Laiba #A', calls: 31, agentName: 'Eda' },
  '114': { name: 'Eman #A', calls: 30, agentName: 'Elif' },
  '103': { name: 'Awais #B', calls: 27, agentName: 'Ozan' },
  '105': { name: 'Farhat #C', calls: 26, agentName: 'Farhat' },
  '108': { name: 'Faizan #C', calls: 25, agentName: 'Fazil' },
  '120': { name: 'Hannan #A', calls: 25, agentName: 'Hannan' },
  '109': { name: 'Mahrukh #C', calls: 20, agentName: 'Mina' },
  '102': { name: 'Tayyab #C', calls: 18, agentName: 'Burakh' },
  '101': { name: 'Abdullah Abid', calls: 18, agentName: 'Noyaan' },
  '107': { name: 'Emir #B', calls: 15, agentName: 'Emir' },
  '123': { name: 'Ayesha #C', calls: 8, agentName: 'Ada' },
  '119': { name: 'Shahab Javed', calls: 7, agentName: 'Shahab Javed' },
  '118': { name: 'Ifaf Shahab', calls: 5, agentName: 'Ifaf Shahab' },
};

const { data: agents } = await supabase.from('agents').select('id, alias_name');
const agentMap = {};
agents?.forEach(a => { agentMap[a.id] = a.alias_name; });

const { data: allCalls } = await supabase
  .from('call_logs')
  .select('agent_id, extension_number');

const ourCounts = {};
allCalls?.forEach(call => {
  if (call.agent_id) {
    const name = agentMap[call.agent_id];
    if (!ourCounts[name]) ourCounts[name] = 0;
    ourCounts[name]++;
  }
});

console.log('='.repeat(80));
console.log('COMPARISON: RingCentral vs Our Database');
console.log('='.repeat(80));
console.log('\nExt  | RingCentral Name    | RC Calls | Our Name     | Our Calls | Diff');
console.log('-'.repeat(80));

let totalRC = 0;
let totalOurs = 0;

Object.entries(RINGCENTRAL_DATA)
  .sort(([, a], [, b]) => b.calls - a.calls)
  .forEach(([ext, data]) => {
    const ourCount = ourCounts[data.agentName] || 0;
    const diff = ourCount - data.calls;
    const diffStr = diff > 0 ? `+${diff}` : diff.toString();

    console.log(
      ext.padEnd(5) + '| ' +
      data.name.padEnd(20) + '| ' +
      data.calls.toString().padStart(8) + ' | ' +
      data.agentName.padEnd(13) + '| ' +
      ourCount.toString().padStart(9) + ' | ' +
      diffStr.padStart(5)
    );

    totalRC += data.calls;
    totalOurs += ourCount;
  });

console.log('-'.repeat(80));
const totalLine = 'TOTAL' + ' '.repeat(24) + '| ' + totalRC.toString().padStart(8) + ' | ' + ' '.repeat(13) + '| ' + totalOurs.toString().padStart(9) + ' | ' + (totalOurs - totalRC).toString().padStart(5);
console.log(totalLine);

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS:');
console.log('='.repeat(80));
console.log(`RingCentral Total (from screenshot): ${totalRC} calls`);
console.log(`Our Database Total: ${allCalls?.length || 0} calls`);
console.log(`Mapped to agents: ${totalOurs} calls`);
console.log(`Unmapped: ${(allCalls?.length || 0) - totalOurs} calls`);
console.log(`\nNote: Differences may be due to:`);
console.log(`  - Date range mismatch`);
console.log(`  - Phone number mappings (we map by phone when extension missing)`);
console.log(`  - Multiple extensions per agent (e.g., Ayesha has Ext 116 and 123)`);
console.log(`  - RingCentral screenshot might be filtered to a specific date range`);
