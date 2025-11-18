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
    // Calculate date range for last 2 days (rolling window)
    // This ensures we catch any missed calls while not accumulating stale data
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 2);

    console.log(`[Cron Sync] Date range: ${dateFrom.toISOString()} to ${dateTo.toISOString()}`);

    // Call the sync API internally with accuracy filtering
    // Only sync calls that have valid agent mappings to maintain data quality
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ringcentral/sync-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        perPage: 500,
        onlyAccurate: true
      })
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Synced ${result.synced || 0} call records at ${result.accuracy || 100}% accuracy (filtered ${result.filtered || 0} unmapped)`,
      synced: result.synced,
      accuracy: result.accuracy,
      filtered: result.filtered,
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