import { NextRequest, NextResponse } from 'next/server';

// This endpoint can be called by Vercel Cron Jobs or external schedulers
// Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/sync-calls",
//     "schedule": "0 */6 * * *"  // Every 6 hours
//   }]
// }

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

    // Call the TEAM-ONLY sync API to filter out company-wide noise
    // This only syncs calls from extensions 101-123 (your team)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ringcentral/sync-team-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        fetchAllPages: true,  // Fetch all pages
        clearFirst: false     // Don't clear on cron runs
      })
    });

    const result = await response.json();

    console.log(`[Cron Sync] Completed: ${result.synced || 0} records synced from ${result.totalRecordsFetched || 0} fetched`);
    console.log(`[Cron Sync] Accuracy: ${result.accuracy || 0}% (${result.withAgentId || 0}/${result.total || 0} mapped)`);
    console.log(`[Cron Sync] Pages fetched: ${result.pagesFetched || 1}`);

    return NextResponse.json({
      success: true,
      message: `Synced ${result.synced || 0} call records from ${result.totalRecordsFetched || 0} fetched (${result.pagesFetched || 1} pages) at ${result.accuracy || 100}% accuracy (filtered ${result.filtered || 0} unmapped)`,
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