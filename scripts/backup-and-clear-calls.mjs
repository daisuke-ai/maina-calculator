// scripts/backup-and-clear-calls.mjs
// Backup current call data and clear the table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backupAndClear() {
  console.log('\n📦 Backing Up and Clearing Call Data\n');

  try {
    // Step 1: Export current data
    console.log('Step 1: Exporting current call_logs data...');
    const { data: allCalls, error: fetchError } = await supabase
      .from('call_logs')
      .select('*')
      .order('started_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching data:', fetchError);
      return;
    }

    console.log(`✅ Fetched ${allCalls.length} call records\n`);

    // Step 2: Save backup
    console.log('Step 2: Saving backup to file...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(__dirname, '..', `call-logs-backup-${timestamp}.json`);

    fs.writeFileSync(backupFile, JSON.stringify({
      exportDate: new Date().toISOString(),
      totalRecords: allCalls.length,
      dateRange: {
        oldest: allCalls.length > 0 ? allCalls[allCalls.length - 1].started_at : null,
        newest: allCalls.length > 0 ? allCalls[0].started_at : null,
      },
      data: allCalls,
    }, null, 2));

    console.log(`✅ Backup saved to: ${backupFile}\n`);

    // Step 3: Clear table
    console.log('Step 3: Clearing call_logs table...');
    const { error: deleteError } = await supabase
      .from('call_logs')
      .delete()
      .neq('id', '');  // Delete all records

    if (deleteError) {
      console.error('Error deleting data:', deleteError);
      return;
    }

    console.log('✅ call_logs table cleared\n');

    // Step 4: Verify
    console.log('Step 4: Verifying table is empty...');
    const { data: remainingCalls, error: verifyError } = await supabase
      .from('call_logs')
      .select('id');

    console.log(`✅ Remaining records: ${remainingCalls.length}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Backup and Clear Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nNext steps:');
    console.log('1. Go to CRM dashboard');
    console.log('2. Click "Sync Calls" button');
    console.log('3. Or run the resync script');
    console.log(`\nBackup location: ${backupFile}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

backupAndClear();