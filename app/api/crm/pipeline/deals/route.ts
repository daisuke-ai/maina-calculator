import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =====================================================
// GET /api/crm/pipeline/deals
// Fetch all pipeline deals with optional filtering
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const status = searchParams.get('status'); // 'active', 'won', 'lost', 'all'
    const stage = searchParams.get('stage'); // 'loi_accepted', 'due_diligence', etc.
    const agentId = searchParams.get('agent_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build query
    let query = supabase
      .from('pipeline_deals')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (stage) {
      query = query.eq('stage', stage);
    }

    if (agentId) {
      query = query.eq('agent_id', parseInt(agentId));
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('[Pipeline API] Error fetching deals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pipeline deals', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deals: data || [],
      total: count || 0,
      limit,
      offset,
      hasMore: count ? offset + limit < count : false,
    });

  } catch (error) {
    console.error('[Pipeline API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/crm/pipeline/deals
// Create a new pipeline deal
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['property_address', 'opportunity_value', 'agent_id', 'agent_name', 'agent_email'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', fields: missingFields },
        { status: 400 }
      );
    }

    // Validate opportunity_value is positive
    if (body.opportunity_value <= 0) {
      return NextResponse.json(
        { error: 'Opportunity value must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate agent_id is between 1-24
    if (body.agent_id < 1 || body.agent_id > 24) {
      return NextResponse.json(
        { error: 'Agent ID must be between 1 and 24' },
        { status: 400 }
      );
    }

    // Validate pipeline_type if provided
    const pipelineType = body.pipeline_type || 'acquisition';
    if (!['acquisition', 'escrow'].includes(pipelineType)) {
      return NextResponse.json(
        { error: 'Invalid pipeline_type. Must be "acquisition" or "escrow"' },
        { status: 400 }
      );
    }

    // Use the database function to create deal with history
    const { data, error } = await supabase.rpc('create_pipeline_deal', {
      p_property_address: body.property_address,
      p_opportunity_value: body.opportunity_value,
      p_agent_id: body.agent_id,
      p_agent_name: body.agent_name,
      p_agent_email: body.agent_email,
      p_offer_price: body.offer_price || null,
      p_down_payment: body.down_payment || null,
      p_monthly_payment: body.monthly_payment || null,
      p_loi_tracking_id: body.loi_tracking_id || null,
      p_expected_closing_date: body.expected_closing_date || null,
      p_created_by: body.created_by || 'api',
      p_pipeline_type: pipelineType,
    });

    if (error) {
      console.error('[Pipeline API] Error creating deal:', error);
      return NextResponse.json(
        { error: 'Failed to create pipeline deal', details: error.message },
        { status: 500 }
      );
    }

    // Fetch the created deal
    const dealId = data; // The function returns the UUID
    const { data: createdDeal, error: fetchError } = await supabase
      .from('pipeline_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (fetchError) {
      console.error('[Pipeline API] Error fetching created deal:', fetchError);
      return NextResponse.json(
        { error: 'Deal created but failed to fetch', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log('[Pipeline API] Deal created successfully:', dealId);

    return NextResponse.json({
      success: true,
      deal: createdDeal,
      message: 'Pipeline deal created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('[Pipeline API] Unexpected error creating deal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
