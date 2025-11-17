import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Valid stage transitions
const VALID_TRANSITIONS: { [key: string]: string[] } = {
  'loi_accepted': ['due_diligence', 'lost'],
  'due_diligence': ['contract', 'lost'],
  'contract': ['closing', 'lost'],
  'closing': ['won', 'lost'],
  'won': [],
  'lost': [],
};

// =====================================================
// POST /api/crm/pipeline/deals/[id]/move
// Move a deal to a new stage with validation
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.new_stage) {
      return NextResponse.json(
        { error: 'Missing required field: new_stage' },
        { status: 400 }
      );
    }

    const newStage = body.new_stage;
    const changedBy = body.changed_by || 'api';
    const notes = body.notes || null;

    // Validate new_stage is a valid stage
    const validStages = ['loi_accepted', 'due_diligence', 'contract', 'closing', 'won', 'lost'];
    if (!validStages.includes(newStage)) {
      return NextResponse.json(
        { error: 'Invalid stage', validStages },
        { status: 400 }
      );
    }

    // Get current deal to check current stage
    const { data: currentDeal, error: fetchError } = await supabase
      .from('pipeline_deals')
      .select('id, stage, status, property_address')
      .eq('id', dealId)
      .single();

    if (fetchError || !currentDeal) {
      return NextResponse.json(
        { error: 'Pipeline deal not found' },
        { status: 404 }
      );
    }

    const currentStage = currentDeal.stage;

    // Check if already in the target stage
    if (currentStage === newStage) {
      return NextResponse.json({
        success: true,
        changed: false,
        message: 'Deal is already in the target stage',
        deal: currentDeal,
      });
    }

    // Allow backward and forward transitions for active deals
    // Only restrict transitions from won/lost states
    if (currentStage === 'won' || currentStage === 'lost') {
      return NextResponse.json(
        {
          error: 'Cannot move deals that are already won or lost',
          currentStage,
          newStage,
        },
        { status: 400 }
      );
    }

    // Don't allow moving to won/lost unless from closing stage (for won) or from active stages (for lost)
    if (newStage === 'won' && currentStage !== 'closing') {
      return NextResponse.json(
        {
          error: 'Can only mark as won from closing stage',
          currentStage,
          newStage,
        },
        { status: 400 }
      );
    }

    // Use the database function to update stage
    const { data, error } = await supabase.rpc('update_deal_stage', {
      p_deal_id: dealId,
      p_new_stage: newStage,
      p_changed_by: changedBy,
      p_notes: notes,
    });

    if (error) {
      console.error('[Pipeline API] Error updating stage:', error);
      return NextResponse.json(
        { error: 'Failed to update deal stage', details: error.message },
        { status: 500 }
      );
    }

    // Fetch updated deal
    const { data: updatedDeal, error: updatedError } = await supabase
      .from('pipeline_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (updatedError) {
      console.error('[Pipeline API] Error fetching updated deal:', updatedError);
      return NextResponse.json(
        { error: 'Stage updated but failed to fetch deal', details: updatedError.message },
        { status: 500 }
      );
    }

    console.log('[Pipeline API] Deal stage updated:', {
      dealId,
      from: currentStage,
      to: newStage,
    });

    return NextResponse.json({
      success: true,
      changed: data, // Boolean from function
      deal: updatedDeal,
      transition: {
        from: currentStage,
        to: newStage,
        changedBy,
        notes,
      },
      message: `Deal moved from ${currentStage} to ${newStage}`,
    });

  } catch (error) {
    console.error('[Pipeline API] Unexpected error moving deal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
