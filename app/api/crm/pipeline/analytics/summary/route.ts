import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =====================================================
// GET /api/crm/pipeline/analytics/summary
// Get overall pipeline summary metrics
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('days_back') || '30');

    // Fetch from summary view (all-time metrics)
    const { data: summaryData, error: summaryError } = await supabase
      .from('pipeline_summary_view')
      .select('*')
      .single();

    if (summaryError) {
      console.error('[Pipeline Analytics] Error fetching summary:', summaryError);
      return NextResponse.json(
        { error: 'Failed to fetch pipeline summary', details: summaryError.message },
        { status: 500 }
      );
    }

    // Fetch time-range metrics using function
    const { data: rangeData, error: rangeError } = await supabase
      .rpc('get_pipeline_metrics_by_range', { days_back: daysBack });

    if (rangeError) {
      console.error('[Pipeline Analytics] Error fetching range metrics:', rangeError);
    }

    const rangeMetrics = rangeData && rangeData.length > 0 ? rangeData[0] : null;

    // Fetch active deals by stage
    const { data: byStageData, error: stageError } = await supabase
      .from('pipeline_by_stage_view')
      .select('*');

    if (stageError) {
      console.error('[Pipeline Analytics] Error fetching by stage:', stageError);
    }

    // Fetch recent activity (last 10 deals updated)
    const { data: recentDeals, error: recentError } = await supabase
      .from('pipeline_deals')
      .select('id, property_address, stage, status, opportunity_value, updated_at, agent_name')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('[Pipeline Analytics] Error fetching recent deals:', recentError);
    }

    return NextResponse.json({
      summary: {
        // All-time metrics
        allTime: {
          total_active_deals: summaryData?.total_active_deals || 0,
          total_won_deals: summaryData?.total_won_deals || 0,
          total_lost_deals: summaryData?.total_lost_deals || 0,
          active_pipeline_value: summaryData?.active_pipeline_value || 0,
          won_deal_value: summaryData?.won_deal_value || 0,
          lost_deal_value: summaryData?.lost_deal_value || 0,
          avg_probability: summaryData?.avg_probability || 0,
          weighted_pipeline_value: summaryData?.weighted_pipeline_value || 0,
          overall_conversion_rate: summaryData?.overall_conversion_rate || 0,
          avg_days_to_close: summaryData?.avg_days_to_close || 0,
        },

        // Time-range metrics (last N days)
        timeRange: {
          days_back: daysBack,
          total_created: rangeMetrics?.total_created || 0,
          total_won: rangeMetrics?.total_won || 0,
          total_lost: rangeMetrics?.total_lost || 0,
          won_value: rangeMetrics?.won_value || 0,
          lost_value: rangeMetrics?.lost_value || 0,
          conversion_rate: rangeMetrics?.conversion_rate || 0,
          avg_days_to_close: rangeMetrics?.avg_days_to_close || 0,
        },

        // Pipeline by stage
        byStage: byStageData || [],

        // Recent activity
        recentDeals: recentDeals || [],
      },
    });

  } catch (error) {
    console.error('[Pipeline Analytics] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
