// scripts/verify-migration.mjs
// Verify that CRM analytics migration was successful

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🔍 Verifying CRM Analytics Migration');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const tests = [
    {
      name: 'agent_performance_summary view',
      test: async () => {
        const { data, error } = await supabase
          .from('agent_performance_summary')
          .select('*')
          .limit(1);
        return { success: !error, data, error };
      },
    },
    {
      name: 'agent_activity_30d view',
      test: async () => {
        const { data, error } = await supabase
          .from('agent_activity_30d')
          .select('*')
          .limit(1);
        return { success: !error, data, error };
      },
    },
    {
      name: 'agent_property_analytics view',
      test: async () => {
        const { data, error } = await supabase
          .from('agent_property_analytics')
          .select('*')
          .limit(1);
        return { success: !error, data, error };
      },
    },
    {
      name: 'offer_type_analytics view',
      test: async () => {
        const { data, error } = await supabase
          .from('offer_type_analytics')
          .select('*')
          .limit(1);
        return { success: !error, data, error };
      },
    },
    {
      name: 'daily_email_volume view',
      test: async () => {
        const { data, error } = await supabase
          .from('daily_email_volume')
          .select('*')
          .limit(1);
        return { success: !error, data, error };
      },
    },
    {
      name: 'get_agent_details() function',
      test: async () => {
        const { data, error } = await supabase.rpc('get_agent_details', {
          p_agent_id: 1,
        });
        return { success: !error, data, error };
      },
    },
    {
      name: 'get_top_agents() function',
      test: async () => {
        const { data, error } = await supabase.rpc('get_top_agents', {
          limit_count: 5,
        });
        return { success: !error, data, error };
      },
    },
  ];

  let allPassed = true;

  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `);

    try {
      const result = await test.test();

      if (result.success) {
        console.log('✅ PASS');
        if (result.data && result.data.length > 0) {
          console.log(`   Found ${result.data.length} record(s)`);
        }
      } else {
        console.log('❌ FAIL');
        if (result.error) {
          console.log(`   Error: ${result.error.message}`);
          if (result.error.code === '42P01') {
            console.log('   → View/table does not exist. Migration may not have run.');
          } else if (result.error.code === '42883') {
            console.log('   → Function does not exist. Migration may not have run.');
          }
        }
        allPassed = false;
      }
    } catch (error) {
      console.log('❌ ERROR');
      console.log(`   ${error.message}`);
      allPassed = false;
    }

    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');

  if (allPassed) {
    console.log('  ✅ All tests passed! Migration successful.');
  } else {
    console.log('  ❌ Some tests failed. Please run the migration:');
    console.log('     https://supabase.com/dashboard/project/qpbjckuphrfjupqrtiai/sql/new');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  process.exit(allPassed ? 0 : 1);
}

verifyMigration();
