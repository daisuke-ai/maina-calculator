// app/api/test-migration/route.ts
// Test endpoint to verify CRM migration

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const tests = [
    {
      name: 'agent_performance_summary',
      test: async () => supabase.from('agent_performance_summary').select('*').limit(1),
    },
    {
      name: 'agent_activity_30d',
      test: async () => supabase.from('agent_activity_30d').select('*').limit(1),
    },
    {
      name: 'agent_property_analytics',
      test: async () => supabase.from('agent_property_analytics').select('*').limit(1),
    },
    {
      name: 'offer_type_analytics',
      test: async () => supabase.from('offer_type_analytics').select('*').limit(1),
    },
    {
      name: 'daily_email_volume',
      test: async () => supabase.from('daily_email_volume').select('*').limit(1),
    },
    {
      name: 'get_agent_details(1)',
      test: async () => supabase.rpc('get_agent_details', { p_agent_id: 1 }),
    },
    {
      name: 'get_top_agents(5)',
      test: async () => supabase.rpc('get_top_agents', { limit_count: 5 }),
    },
  ];

  const results = [];
  let allPassed = true;

  for (const test of tests) {
    const result = await test.test();
    const passed = !result.error;

    results.push({
      name: test.name,
      passed,
      error: result.error?.message || null,
      errorCode: result.error?.code || null,
      recordCount: result.data?.length || 0,
    });

    if (!passed) {
      allPassed = false;
    }
  }

  return NextResponse.json({
    success: allPassed,
    message: allPassed
      ? '✅ All migration tests passed!'
      : '❌ Some migration tests failed. Please run the migration.',
    migrationUrl: 'https://supabase.com/dashboard/project/qpbjckuphrfjupqrtiai/sql/new',
    migrationFile: 'supabase/migrations/20250115_add_crm_analytics.sql',
    results,
  });
}
