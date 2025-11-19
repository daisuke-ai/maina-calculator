// app/api/ringcentral/sync-calls-incremental/route.ts
// Scalable incremental sync for high-volume call centers
import { NextRequest, NextResponse } from 'next/server';
import { getCallLog } from '@/lib/ringcentral/client';
import { createClient } from '@supabase/supabase-js';
import type { RingCentralCallRecord } from '@/lib/ringcentral/types';
import { getAgentIdFromCallRecord } from '@/config/ringcentral-mapping';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Constants for scalability
const BATCH_SIZE = 500; // Process in smaller batches
const MAX_PAGES_PER_RUN = 50; // Allow more pages for high volume
const MAX_RECORDS_PER_SYNC = 50000; // Safety limit

/**
 * Extract extension number from call record
 */
function extractExtensionNumber(record: RingCentralCallRecord): string | null {
  if (record.from?.extensionNumber) return record.from.extensionNumber;
  if (record.to?.extensionNumber) return record.to.extensionNumber;

  if (record.legs && record.legs.length > 0) {
    for (const leg of record.legs) {
      if (leg.from?.extensionNumber) return leg.from.extensionNumber;
      if (leg.to?.extensionNumber) return leg.to.extensionNumber;
    }
  }

  return null;
}

/**
 * Transform RingCentral call record to database format
 */
function transformCallRecord(record: RingCentralCallRecord) {
  const extensionNumber = extractExtensionNumber(record);

  let agentId: number | null = null;

  if (record.direction === 'Outbound') {
    let outboundExt = extensionNumber;

    if (record.legs && record.legs.length > 0) {
      for (const leg of record.legs) {
        if (leg.legType === 'PstnToSip' || leg.action === 'VoIP Call') {
          if (leg.to?.extensionNumber) {
            outboundExt = leg.to.extensionNumber;
            break;
          }
        }
      }
    }

    agentId = getAgentIdFromCallRecord(
      outboundExt,
      record.from?.phoneNumber
    );
  } else {
    let inboundExt = extensionNumber;

    if (record.legs && record.legs.length > 0) {
      for (const leg of record.legs) {
        if (leg.result === 'Accepted' && leg.to?.extensionId) {
          for (const otherLeg of record.legs) {
            if (otherLeg.from?.extensionId === leg.to.extensionId && otherLeg.from?.extensionNumber) {
              inboundExt = otherLeg.from.extensionNumber;
              break;
            }
            if (otherLeg.to?.extensionNumber && otherLeg.extension?.id === leg.to.extensionId) {
              inboundExt = otherLeg.to.extensionNumber;
              break;
            }
          }
        }
      }
    }

    agentId = getAgentIdFromCallRecord(
      inboundExt,
      record.to?.phoneNumber
    );
  }

  const startedAt = new Date(record.startTime);
  const endedAt = new Date(startedAt.getTime() + (record.duration * 1000));

  return {
    id: record.id,
    session_id: record.sessionId,
    agent_id: agentId,
    extension_id: record.extension?.id || null,
    extension_number: extensionNumber,

    direction: record.direction,
    call_type: record.type,
    call_result: record.result,
    call_action: record.action,

    from_number: record.from?.phoneNumber || null,
    to_number: record.to?.phoneNumber || null,
    from_name: record.from?.name || null,
    to_name: record.to?.name || null,
    from_location: record.from?.location || null,
    to_location: record.to?.location || null,

    duration: record.duration,
    started_at: record.startTime,
    ended_at: endedAt.toISOString(),

    recording_id: record.recording?.id || null,
    recording_uri: record.recording?.uri || null,
    recording_type: record.recording?.type || null,
    recording_content_uri: record.recording?.contentUri || null,

    transport: record.transport || null,
    reason: record.reason || null,
    reason_description: record.reasonDescription || null,

    synced_at: new Date().toISOString(),
    last_modified_time: record.lastModifiedTime || null,
  };
}

/**
 * Get the last sync timestamp from database
 */
async function getLastSyncTime(): Promise<Date | null> {
  const { data, error } = await supabase
    .from('call_logs')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return new Date(data[0].synced_at);
}

/**
 * Process records in batches to avoid memory issues
 */
async function processBatch(records: any[], onlyAccurate: boolean): Promise<{
  synced: number;
  filtered: number;
  withAgentId: number;
}> {
  const transformed = records.map(transformCallRecord);
  const withAgentId = transformed.filter(r => r.agent_id !== null).length;

  const recordsToSync = onlyAccurate
    ? transformed.filter(r => r.agent_id !== null)
    : transformed;

  if (recordsToSync.length === 0) {
    return {
      synced: 0,
      filtered: transformed.length,
      withAgentId: 0
    };
  }

  const { error } = await supabase
    .from('call_logs')
    .upsert(recordsToSync, {
      onConflict: 'id',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('[Incremental Sync] Batch upsert error:', error);
    throw error;
  }

  return {
    synced: recordsToSync.length,
    filtered: transformed.length - recordsToSync.length,
    withAgentId: withAgentId
  };
}

/**
 * POST /api/ringcentral/sync-calls-incremental
 * Incremental sync optimized for high-volume call centers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mode = 'incremental', // 'incremental' or 'full'
      onlyAccurate = true,
      hoursBack = 1, // For incremental mode
      daysBack = 7, // For full mode
    } = body;

    console.log('[Incremental Sync] Starting sync...', {
      mode,
      onlyAccurate,
      hoursBack,
      daysBack,
    });

    // Determine date range based on mode
    let dateFrom: Date;
    let dateTo = new Date();

    if (mode === 'incremental') {
      // For high-frequency syncs (every hour)
      const lastSync = await getLastSyncTime();
      if (lastSync) {
        // Add 1 minute buffer to avoid gaps
        dateFrom = new Date(lastSync.getTime() - 60000);
        console.log(`[Incremental Sync] Last sync: ${lastSync.toISOString()}`);
      } else {
        // Fallback to hoursBack if no last sync
        dateFrom = new Date();
        dateFrom.setHours(dateFrom.getHours() - hoursBack);
      }
    } else {
      // Full sync mode
      dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - daysBack);
    }

    console.log(`[Incremental Sync] Date range: ${dateFrom.toISOString()} to ${dateTo.toISOString()}`);

    // Statistics
    let totalFetched = 0;
    let totalSynced = 0;
    let totalFiltered = 0;
    let totalWithAgentId = 0;
    let currentPage = 1;
    let hasMorePages = true;

    // Fetch and process in batches
    while (hasMorePages && currentPage <= MAX_PAGES_PER_RUN && totalFetched < MAX_RECORDS_PER_SYNC) {
      console.log(`[Incremental Sync] Fetching page ${currentPage}...`);

      // Fetch page from RingCentral
      const callLogResponse = await getCallLog({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        perPage: BATCH_SIZE,
        page: currentPage,
        view: 'Detailed',
      });

      const records = callLogResponse.records || [];
      totalFetched += records.length;

      if (records.length > 0) {
        // Process this batch
        const batchResult = await processBatch(records, onlyAccurate);
        totalSynced += batchResult.synced;
        totalFiltered += batchResult.filtered;
        totalWithAgentId += batchResult.withAgentId;

        console.log(`[Incremental Sync] Page ${currentPage}: Processed ${records.length} records (${batchResult.synced} synced)`);
      }

      // Check if more pages exist
      if (callLogResponse.paging) {
        const paging = callLogResponse.paging;
        const totalPages = Math.ceil(paging.totalElements / paging.perPage);
        hasMorePages = currentPage < totalPages;
        currentPage++;

        // Small delay to avoid rate limiting
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } else {
        hasMorePages = false;
      }
    }

    const accuracy = totalFetched > 0
      ? ((totalWithAgentId / totalFetched) * 100).toFixed(1)
      : '0.0';

    console.log(`[Incremental Sync] Completed: ${totalSynced} synced from ${totalFetched} fetched (${accuracy}% accuracy)`);

    // Store sync metadata for monitoring
    await supabase
      .from('sync_metadata')
      .upsert({
        id: 'last_sync',
        timestamp: new Date().toISOString(),
        records_fetched: totalFetched,
        records_synced: totalSynced,
        accuracy: parseFloat(accuracy),
        mode: mode,
      });

    return NextResponse.json({
      success: true,
      message: `Incremental sync complete: ${totalSynced} records synced`,
      stats: {
        totalFetched,
        totalSynced,
        totalFiltered,
        accuracy: parseFloat(accuracy),
        pagesProcessed: currentPage - 1,
        mode,
        dateRange: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString()
        }
      }
    });

  } catch (error: any) {
    console.error('[Incremental Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Incremental sync failed',
      },
      { status: 500 }
    );
  }
}