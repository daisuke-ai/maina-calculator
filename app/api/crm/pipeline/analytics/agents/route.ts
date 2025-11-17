import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =====================================================
// GET /api/crm/pipeline/analytics/agents
// Get agent pipeline performance metrics
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const sortBy = searchParams.get('sort_by') || 'total_won_value';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Fetch from agent performance view
    let query = supabase
      .from('agent_pipeline_performance_view')
      .select('*');

    // Filter by specific agent if requested
    if (agentId) {
      query = query.eq('agent_id', parseInt(agentId));
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('[Pipeline Analytics] Error fetching agent performance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agent performance', details: error.message },
        { status: 500 }
      );
    }

    // If specific agent requested, also fetch their active deals
    let agentDeals = null;
    if (agentId) {
      const { data: dealsData, error: dealsError } = await supabase
        .from('pipeline_deals')
        .select('*')
        .eq('agent_id', parseInt(agentId))
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!dealsError) {
        agentDeals = dealsData;
      }
    }

    return NextResponse.json({
      agents: data || [],
      agentDeals: agentDeals,
      total: data?.length || 0,
    });

  } catch (error) {
    console.error('[Pipeline Analytics] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
