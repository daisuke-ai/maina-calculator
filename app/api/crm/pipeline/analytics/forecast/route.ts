import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =====================================================
// GET /api/crm/pipeline/analytics/forecast
// Get pipeline forecast by month
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthsAhead = parseInt(searchParams.get('months_ahead') || '6');

    // Fetch from forecast view
    const { data, error } = await supabase
      .from('pipeline_forecast_view')
      .select('*')
      .order('closing_month', { ascending: true })
      .limit(monthsAhead);

    if (error) {
      console.error('[Pipeline Analytics] Error fetching forecast:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pipeline forecast', details: error.message },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const totalExpectedClosings = data?.reduce((sum, month) => sum + (month.expected_closings || 0), 0) || 0;
    const totalExpectedValue = data?.reduce((sum, month) => sum + (parseFloat(month.expected_value) || 0), 0) || 0;
    const totalWeightedValue = data?.reduce((sum, month) => sum + (parseFloat(month.weighted_expected_value) || 0), 0) || 0;

    return NextResponse.json({
      forecast: data || [],
      summary: {
        months_ahead: monthsAhead,
        total_expected_closings: totalExpectedClosings,
        total_expected_value: totalExpectedValue,
        total_weighted_value: totalWeightedValue,
        avg_probability: totalExpectedValue > 0 ? (totalWeightedValue / totalExpectedValue * 100) : 0,
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
