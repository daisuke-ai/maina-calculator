// app/api/crm/analytics/route.ts
// API endpoint for global analytics and insights

import { NextRequest, NextResponse } from 'next/server';
import {
  getOfferTypeAnalytics,
  getDailyEmailVolume,
  getTopAgents,
  getAnalyticsByRange,
  TIME_RANGES,
} from '@/lib/supabase/crm-analytics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range');

    // Determine days back based on range parameter
    let daysBack = TIME_RANGES.ALL_TIME;
    if (range) {
      const rangeUpper = range.toUpperCase() as keyof typeof TIME_RANGES;
      if (rangeUpper in TIME_RANGES) {
        daysBack = TIME_RANGES[rangeUpper];
      } else {
        // Try parsing as number
        const parsedDays = parseInt(range);
        if (!isNaN(parsedDays) && parsedDays > 0) {
          daysBack = parsedDays;
        }
      }
    }

    // Use time-range functions if specific range is requested
    let analytics;
    if (daysBack === TIME_RANGES.ALL_TIME) {
      // Use the original views for all-time data (more efficient)
      const [offerTypes, dailyVolume, topAgents] = await Promise.all([
        getOfferTypeAnalytics(),
        getDailyEmailVolume(),
        getTopAgents(10),
      ]);
      analytics = { offerTypes, dailyVolume, topAgents };
    } else {
      // Use time-range functions
      analytics = await getAnalyticsByRange(daysBack);
    }

    return NextResponse.json({
      success: true,
      analytics,
      range: range || 'all',
      daysBack,
    });
  } catch (error: any) {
    console.error('[GET /api/crm/analytics Error]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
