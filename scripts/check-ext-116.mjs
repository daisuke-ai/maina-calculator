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

const { data } = await supabase
  .from('call_logs')
  .select('extension_number, agent_id, from_number, to_number, direction')
  .eq('extension_number', '116');

console.log('Extension 116 calls in database:');
data?.forEach(call => {
  console.log(`  ${call.direction} | Agent ID: ${call.agent_id || 'NULL'} | ${call.from_number} → ${call.to_number}`);
});

if (data && data.length > 0 && data.every(c => c.agent_id)) {
  console.log('\n✅ All Extension 116 calls are mapped!');
} else {
  console.log('\n❌ Extension 116 calls are NOT mapped. Need to restart server and re-sync.');
}
