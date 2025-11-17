import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =====================================================
// GET /api/crm/pipeline/deals/[id]
// Fetch a single pipeline deal with related data
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;

    // Fetch deal
    const { data: deal, error: dealError } = await supabase
      .from('pipeline_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.error('[Pipeline API] Deal not found:', dealId);
      return NextResponse.json(
        { error: 'Pipeline deal not found' },
        { status: 404 }
      );
    }

    // Fetch stage history
    const { data: stageHistory, error: historyError } = await supabase
      .from('pipeline_stage_history')
      .select('*')
      .eq('deal_id', dealId)
      .order('transitioned_at', { ascending: false });

    if (historyError) {
      console.error('[Pipeline API] Error fetching stage history:', historyError);
    }

    // Fetch activities
    const { data: activities, error: activitiesError } = await supabase
      .from('pipeline_activities')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (activitiesError) {
      console.error('[Pipeline API] Error fetching activities:', activitiesError);
    }

    return NextResponse.json({
      deal,
      stageHistory: stageHistory || [],
      activities: activities || [],
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
// PATCH /api/crm/pipeline/deals/[id]
// Update a pipeline deal
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const body = await request.json();

    // Fields that can be updated
    const allowedFields = [
      'property_address',
      'property_city',
      'property_state',
      'property_zip',
      'deal_name',
      'property_type',
      'opportunity_value',
      'listed_price',
      'offer_price',
      'down_payment',
      'monthly_payment',
      'balloon_period',
      'estimated_rehab_cost',
      'total_deal_value',
      'realtor_name',
      'realtor_email',
      'realtor_phone',
      'seller_name',
      'seller_email',
      'seller_phone',
      'status',
      'expected_closing_date',
      'loi_tracking_id',
      'notes',
      'priority',
      'tags',
      'probability_to_close',
      'confidence_level',
      'lost_reason',
      'cancellation_reason',
    ];

    // Filter out fields that aren't allowed
    const updates: any = {};
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = body[key];
      }
    });

    // Validate opportunity_value if being updated
    if (updates.opportunity_value !== undefined && updates.opportunity_value <= 0) {
      return NextResponse.json(
        { error: 'Opportunity value must be greater than 0' },
        { status: 400 }
      );
    }

    // Add metadata
    updates.updated_at = new Date().toISOString();
    updates.last_updated_by = body.updated_by || 'api';

    // Update the deal
    const { data, error } = await supabase
      .from('pipeline_deals')
      .update(updates)
      .eq('id', dealId)
      .select()
      .single();

    if (error) {
      console.error('[Pipeline API] Error updating deal:', error);
      return NextResponse.json(
        { error: 'Failed to update pipeline deal', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Pipeline deal not found' },
        { status: 404 }
      );
    }

    console.log('[Pipeline API] Deal updated successfully:', dealId);

    return NextResponse.json({
      success: true,
      deal: data,
      message: 'Pipeline deal updated successfully',
    });

  } catch (error) {
    console.error('[Pipeline API] Unexpected error updating deal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/crm/pipeline/deals/[id]
// Delete a pipeline deal
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;

    // Check if deal exists
    const { data: existingDeal, error: checkError } = await supabase
      .from('pipeline_deals')
      .select('id, property_address, status')
      .eq('id', dealId)
      .single();

    if (checkError || !existingDeal) {
      return NextResponse.json(
        { error: 'Pipeline deal not found' },
        { status: 404 }
      );
    }

    // Delete the deal (cascade will delete history and activities)
    const { error: deleteError } = await supabase
      .from('pipeline_deals')
      .delete()
      .eq('id', dealId);

    if (deleteError) {
      console.error('[Pipeline API] Error deleting deal:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete pipeline deal', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('[Pipeline API] Deal deleted successfully:', dealId);

    return NextResponse.json({
      success: true,
      message: 'Pipeline deal deleted successfully',
      deletedDeal: {
        id: dealId,
        property_address: existingDeal.property_address,
      },
    });

  } catch (error) {
    console.error('[Pipeline API] Unexpected error deleting deal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
