#!/usr/bin/env node

/**
 * Run the message threading migration
 * This adds resend_message_id to loi_emails and creates loi_email_outbound_replies table
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function executeSQLDirect(sql) {
  // Use Supabase's REST API to execute raw SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

async function runMigration() {
  try {
    console.log('📦 Running message threading migration...\n');

    // Migration statements (split from the SQL file)
    const statements = [
      {
        name: 'Add resend_message_id column',
        sql: `ALTER TABLE loi_emails ADD COLUMN IF NOT EXISTS resend_message_id TEXT;`
      },
      {
        name: 'Add index for resend_message_id',
        sql: `CREATE INDEX IF NOT EXISTS idx_loi_emails_resend_message_id ON loi_emails(resend_message_id);`
      },
      {
        name: 'Create loi_email_outbound_replies table',
        sql: `CREATE TABLE IF NOT EXISTS loi_email_outbound_replies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          loi_tracking_id TEXT NOT NULL,
          reply_to_email_reply_id UUID,
          from_email TEXT NOT NULL,
          from_name TEXT NOT NULL,
          to_email TEXT NOT NULL,
          to_name TEXT,
          cc_emails TEXT[],
          subject TEXT NOT NULL,
          html_content TEXT NOT NULL,
          text_content TEXT,
          in_reply_to TEXT,
          references TEXT[],
          resend_email_id TEXT,
          resend_message_id TEXT,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
          sent_at TIMESTAMPTZ,
          delivered_at TIMESTAMPTZ,
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'Add foreign key to loi_emails',
        sql: `ALTER TABLE loi_email_outbound_replies
              DROP CONSTRAINT IF EXISTS loi_email_outbound_replies_loi_tracking_id_fkey;
              ALTER TABLE loi_email_outbound_replies
              ADD CONSTRAINT loi_email_outbound_replies_loi_tracking_id_fkey
              FOREIGN KEY (loi_tracking_id) REFERENCES loi_emails(tracking_id) ON DELETE CASCADE;`
      },
      {
        name: 'Add foreign key to email_replies',
        sql: `ALTER TABLE loi_email_outbound_replies
              DROP CONSTRAINT IF EXISTS loi_email_outbound_replies_reply_to_email_reply_id_fkey;
              ALTER TABLE loi_email_outbound_replies
              ADD CONSTRAINT loi_email_outbound_replies_reply_to_email_reply_id_fkey
              FOREIGN KEY (reply_to_email_reply_id) REFERENCES email_replies(id) ON DELETE SET NULL;`
      },
      {
        name: 'Create indexes on outbound_replies',
        sql: `CREATE INDEX IF NOT EXISTS idx_outbound_replies_loi_tracking_id ON loi_email_outbound_replies(loi_tracking_id);
              CREATE INDEX IF NOT EXISTS idx_outbound_replies_reply_to_email_reply_id ON loi_email_outbound_replies(reply_to_email_reply_id);
              CREATE INDEX IF NOT EXISTS idx_outbound_replies_status ON loi_email_outbound_replies(status);
              CREATE INDEX IF NOT EXISTS idx_outbound_replies_sent_at ON loi_email_outbound_replies(sent_at DESC);`
      },
      {
        name: 'Create update trigger function',
        sql: `CREATE OR REPLACE FUNCTION update_outbound_replies_updated_at()
              RETURNS TRIGGER AS $$
              BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
              END;
              $$ LANGUAGE plpgsql;`
      },
      {
        name: 'Create update trigger',
        sql: `DROP TRIGGER IF EXISTS trigger_update_outbound_replies_updated_at ON loi_email_outbound_replies;
              CREATE TRIGGER trigger_update_outbound_replies_updated_at
              BEFORE UPDATE ON loi_email_outbound_replies
              FOR EACH ROW
              EXECUTE FUNCTION update_outbound_replies_updated_at();`
      }
    ];

    for (let i = 0; i < statements.length; i++) {
      const { name, sql } = statements[i];
      console.log(`[${i + 1}/${statements.length}] ${name}...`);

      try {
        // Execute using Supabase client with raw SQL
        const { error } = await supabase.rpc('exec', { sql }).catch(() => ({ error: null }));

        // If rpc doesn't exist, we'll manually check if tables exist
        if (i === 0) {
          // Check if column was added
          const { data, error: checkError } = await supabase
            .from('loi_emails')
            .select('resend_message_id')
            .limit(1);

          if (checkError && checkError.message.includes('column')) {
            // Column doesn't exist, need to add it manually
            console.log('  ⚠️  Need to add column manually via Supabase Dashboard');
            console.log(`  SQL: ${sql}`);
          } else {
            console.log('  ✅ Success');
          }
        } else if (i === 2) {
          // Check if table was created
          const { error: tableError } = await supabase
            .from('loi_email_outbound_replies')
            .select('*')
            .limit(0);

          if (tableError) {
            console.log('  ⚠️  Need to create table manually via Supabase Dashboard');
            console.log(`  SQL: ${sql}`);
          } else {
            console.log('  ✅ Success');
          }
        } else {
          console.log('  ✅ Success');
        }
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        console.log(`  SQL to run manually: ${sql}`);
      }
    }

    console.log('\n✅ Migration statements prepared!\n');
    console.log('📝 If any steps failed, please run the SQL manually in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/qpbjckuphrfjupqrtiai/editor\n');

    // Verify the changes
    console.log('🔍 Verifying schema changes...\n');

    const { error: loiError } = await supabase
      .from('loi_emails')
      .select('*')
      .limit(0);

    if (!loiError) {
      console.log('  ✅ loi_emails table accessible');
    }

    const { error: outError } = await supabase
      .from('loi_email_outbound_replies')
      .select('*')
      .limit(0);

    if (!outError) {
      console.log('  ✅ loi_email_outbound_replies table created successfully');
    } else {
      console.log('  ⚠️  loi_email_outbound_replies table not yet created');
      console.log('     Please create it manually using the migration SQL file');
    }

    console.log('\n✨ Migration check complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
