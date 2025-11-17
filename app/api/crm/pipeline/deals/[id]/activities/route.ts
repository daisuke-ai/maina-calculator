import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =====================================================
// GET /api/crm/pipeline/deals/[id]/activities
// Fetch all activities for a deal
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;

    // Fetch activities
    const { data, error } = await supabase
      .from('pipeline_activities')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Pipeline API] Error fetching activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activities', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      activities: data || [],
      total: data?.length || 0,
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
// POST /api/crm/pipeline/deals/[id]/activities
// Create a new activity for a deal
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.activity_type || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: activity_type, title' },
        { status: 400 }
      );
    }

    // Validate activity_type
    const validTypes = [
      'note', 'call', 'email', 'meeting', 'inspection',
      'offer', 'counter_offer', 'milestone', 'task', 'other'
    ];
    if (!validTypes.includes(body.activity_type)) {
      return NextResponse.json(
        { error: 'Invalid activity_type', validTypes },
        { status: 400 }
      );
    }

    // Validate outcome if provided
    if (body.outcome && !['positive', 'neutral', 'negative'].includes(body.outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome. Must be: positive, neutral, or negative' },
        { status: 400 }
      );
    }

    // Check if deal exists
    const { data: deal, error: dealError } = await supabase
      .from('pipeline_deals')
      .select('id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Pipeline deal not found' },
        { status: 404 }
      );
    }

    // Create activity
    const { data, error } = await supabase
      .from('pipeline_activities')
      .insert({
        deal_id: dealId,
        activity_type: body.activity_type,
        title: body.title,
        description: body.description || null,
        contact_name: body.contact_name || null,
        contact_email: body.contact_email || null,
        contact_phone: body.contact_phone || null,
        outcome: body.outcome || null,
        next_action: body.next_action || null,
        next_action_due_date: body.next_action_due_date || null,
        created_by: body.created_by || 'api',
      })
      .select()
      .single();

    if (error) {
      console.error('[Pipeline API] Error creating activity:', error);
      return NextResponse.json(
        { error: 'Failed to create activity', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Pipeline API] Activity created:', data.id);

    return NextResponse.json({
      success: true,
      activity: data,
      message: 'Activity created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('[Pipeline API] Unexpected error creating activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
