// app/api/cron/sync-calls-hourly/route.ts
// High-frequency cron job for high-volume call centers
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cron/sync-calls-hourly
 * Runs every hour for high-volume incremental syncing
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-calls-hourly",
 *     "schedule": "0 * * * *"  // Every hour
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    console.log(`[Hourly Cron] Starting incremental sync at ${new Date().toISOString()}`);

    // Call the incremental sync API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ringcentral/sync-calls-incremental`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'incremental',
        onlyAccurate: true,
        hoursBack: 2, // 2-hour buffer for safety
      })
    });

    const result = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      throw new Error(result.error || 'Sync failed');
    }

    console.log(`[Hourly Cron] Completed in ${elapsed}s: ${result.stats?.totalSynced || 0} records synced`);

    // Alert if sync took too long (potential scaling issue)
    if (parseFloat(elapsed) > 30) {
      console.warn(`[Hourly Cron] ⚠️ Slow sync detected: ${elapsed}s`);
    }

    // Alert if too many records (potential data explosion)
    if (result.stats?.totalFetched > 5000) {
      console.warn(`[Hourly Cron] ⚠️ High volume detected: ${result.stats.totalFetched} records in one hour`);
    }

    return NextResponse.json({
      success: true,
      message: `Hourly sync completed: ${result.stats?.totalSynced || 0} records`,
      elapsed: parseFloat(elapsed),
      timestamp: new Date().toISOString(),
      stats: result.stats
    });

  } catch (error) {
    console.error('[Hourly Cron] Failed:', error);
    return NextResponse.json(
      {
        error: 'Hourly sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}