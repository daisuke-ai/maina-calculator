import { NextRequest, NextResponse } from 'next/server';
import { syncCallLogs } from '@/lib/ringcentral/sync';

// This endpoint is called by Vercel Cron Jobs
// Configured in vercel.json to run daily at 2:00 AM UTC

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Calculate date range for last 7 days (wider window to ensure no missed calls)
    // The upsert operation will prevent duplicates
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 7);

    console.log(`[Cron Sync] Starting sync for date range: ${dateFrom.toISOString()} to ${dateTo.toISOString()}`);

    // Call sync logic directly (no HTTP request needed)
    const result = await syncCallLogs({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      perPage: 1000,
      fetchAllPages: true,
      onlyAccurate: true, // Only sync calls with agent mapping
    });

    if (!result.success) {
      console.error('[Cron Sync] Failed:', result.error, result.details);
      return NextResponse.json(
        { error: 'Sync failed', details: result.details },
        { status: 500 }
      );
    }

    console.log(`[Cron Sync] Completed: ${result.synced} records synced from ${result.totalRecordsFetched || 0} fetched`);
    console.log(`[Cron Sync] Accuracy: ${result.accuracy || 0}% (${result.withAgentId || 0}/${result.total || 0} mapped)`);
    console.log(`[Cron Sync] Pages fetched: ${result.pagesFetched || 1}`);

    return NextResponse.json({
      success: true,
      message: `Synced ${result.synced} call records from ${result.totalRecordsFetched || 0} fetched (${result.pagesFetched || 1} pages) at ${result.accuracy || 100}% accuracy (filtered ${result.filtered || 0} unmapped)`,
      synced: result.synced,
      totalFetched: result.totalRecordsFetched,
      accuracy: result.accuracy,
      filtered: result.filtered,
      pagesFetched: result.pagesFetched,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
