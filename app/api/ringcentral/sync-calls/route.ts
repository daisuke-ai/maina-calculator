// app/api/ringcentral/sync-calls/route.ts
// API endpoint for manually syncing call logs from RingCentral

import { NextRequest, NextResponse } from 'next/server';
import { syncCallLogs } from '@/lib/ringcentral/sync';

/**
 * POST /api/ringcentral/sync-calls
 * Fetch call logs from RingCentral and sync to database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dateFrom,
      dateTo,
      direction,
      perPage = 1000,
      page = 1,
      fetchAllPages = false,
      onlyAccurate = false,
    } = body;

    const result = await syncCallLogs({
      dateFrom,
      dateTo,
      direction: direction as 'Inbound' | 'Outbound' | undefined,
      perPage,
      page,
      fetchAllPages,
      onlyAccurate,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to sync call logs',
          details: result.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Sync Calls] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync call logs',
      },
      { status: 500 }
    );
  }
}
