// scripts/run-migration.js
// Script to run database migrations on Supabase

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🔗 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250115_add_crm_analytics.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file loaded');
  console.log('🚀 Running migration: 20250115_add_crm_analytics.sql');
  console.log('');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct query approach
      console.log('⚠️  RPC method not available, trying direct execution...');

      // Split SQL into individual statements (basic splitting)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);

          // For views and functions, we need to use the SQL editor or REST API
          // This is a limitation - we'll need to run it manually
          console.log('');
          console.log('⚠️  Cannot execute DDL statements via client library.');
          console.log('');
          console.log('📋 Please run the migration manually:');
          console.log('');
          console.log('1. Go to: https://supabase.com/dashboard/project/qpbjckuphrfjupqrtiai/sql/new');
          console.log('2. Copy and paste the contents of: supabase/migrations/20250115_add_crm_analytics.sql');
          console.log('3. Click "Run" to execute the migration');
          console.log('');
          console.log('Or use the Supabase CLI:');
          console.log('');
          console.log('   npx supabase login');
          console.log('   npx supabase link --project-ref qpbjckuphrfjupqrtiai');
          console.log('   npx supabase db push');
          console.log('');
          break;
        }
      }
    } else {
      console.log('✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.log('');
    console.log('📋 Manual migration required:');
    console.log('');
    console.log('1. Go to: https://supabase.com/dashboard/project/qpbjckuphrfjupqrtiai/sql/new');
    console.log('2. Copy the migration file: supabase/migrations/20250115_add_crm_analytics.sql');
    console.log('3. Paste and run in the SQL Editor');
    console.log('');
    process.exit(1);
  }
}

runMigration();
