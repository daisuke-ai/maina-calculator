// lib/ringcentral/sync.ts
// Shared sync logic for RingCentral call logs - used by both cron job and API endpoint

import { getCallLog } from '@/lib/ringcentral/client';
import { createClient } from '@supabase/supabase-js';
import type { RingCentralCallRecord } from '@/lib/ringcentral/types';
import { getAgentIdFromCallRecord } from '@/config/ringcentral-mapping';
import { getExtensionNumberById } from '@/config/extension-id-mapping';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface SyncCallsOptions {
  dateFrom: string;
  dateTo: string;
  direction?: 'Inbound' | 'Outbound';
  perPage?: number;
  page?: number;
  fetchAllPages?: boolean;
  onlyAccurate?: boolean;
}

export interface SyncCallsResult {
  success: boolean;
  message: string;
  synced: number;
  total: number;
  withExtensions?: number;
  withAgentId?: number;
  accuracy?: number;
  filtered?: number;
  pagesFetched?: number;
  totalRecordsFetched?: number;
  error?: string;
  details?: string;
}

/**
 * Extract extension number from call record
 * Uses extension ID mapping to get accurate extension numbers
 */
function extractExtensionNumber(record: RingCentralCallRecord): string | null {
  // Try root level first (rarely present)
  if (record.from?.extensionNumber) return record.from.extensionNumber;
  if (record.to?.extensionNumber) return record.to.extensionNumber;

  // Check legs array for extension numbers (also rarely present)
  if (record.legs && record.legs.length > 0) {
    for (const leg of record.legs) {
      if (leg.from?.extensionNumber) {
        return leg.from.extensionNumber;
      }
      if (leg.to?.extensionNumber) {
        return leg.to.extensionNumber;
      }
    }

    // Check for extension IDs and convert to numbers using our mapping
    for (const leg of record.legs) {
      // Check leg.extension.id
      if (leg.extension?.id) {
        const extensionNumber = getExtensionNumberById(leg.extension.id);
        if (extensionNumber) {
          return extensionNumber;
        }
      }

      // Check leg.to.extensionId
      if (leg.to?.extensionId) {
        const extensionNumber = getExtensionNumberById(leg.to.extensionId);
        if (extensionNumber) {
          return extensionNumber;
        }
      }

      // Check leg.from.extensionId
      if (leg.from?.extensionId) {
        const extensionNumber = getExtensionNumberById(leg.from.extensionId);
        if (extensionNumber) {
          return extensionNumber;
        }
      }
    }
  }

  return null;
}

/**
 * Transform RingCentral call record to database format
 */
function transformCallRecord(record: RingCentralCallRecord) {
  // Extract extension number from all possible locations
  const extensionNumber = extractExtensionNumber(record);

  // Determine agent ID based on direction and extension
  let agentId: number | null = null;

  if (record.direction === 'Outbound') {
    // For outbound calls, check legs for the originating extension
    let outboundExt = extensionNumber;

    // Special handling: Check legs for VoIP/Sip legs which have the actual user extension
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
    // For inbound calls, agent is usually the receiver
    // But check legs for the actual answering extension
    let inboundExt = extensionNumber;

    if (record.legs && record.legs.length > 0) {
      for (const leg of record.legs) {
        // Look for the accepting leg
        if (leg.result === 'Accepted' && leg.to?.extensionId) {
          // Try to find extension number in other legs with same extensionId
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

  // Calculate ended_at
  const startedAt = new Date(record.startTime);
  const endedAt = new Date(startedAt.getTime() + (record.duration * 1000));

  // Log if we couldn't find extension
  if (!extensionNumber) {
    console.log(`No extension found for call ${record.id}, direction: ${record.direction}`);
  }

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
 * Sync call logs from RingCentral to the database
 * This is the core sync logic used by both the cron job and API endpoint
 */
export async function syncCallLogs(options: SyncCallsOptions): Promise<SyncCallsResult> {
  const {
    dateFrom,
    dateTo,
    direction,
    perPage = 1000,
    page = 1,
    fetchAllPages = false,
    onlyAccurate = false,
  } = options;

  console.log('[Sync Calls] Starting sync from RingCentral...', {
    dateFrom,
    dateTo,
    direction,
    perPage,
    page,
    fetchAllPages,
    onlyAccurate,
  });

  let allRecords: RingCentralCallRecord[] = [];
  let currentPage = page;
  let hasMorePages = true;
  let totalPages = 1;

  // Fetch all pages if requested
  while (hasMorePages) {
    console.log(`[Sync Calls] Fetching page ${currentPage}...`);

    // Fetch call logs from RingCentral with current page
    const callLogResponse = await getCallLog({
      dateFrom,
      dateTo,
      direction,
      perPage,
      page: currentPage,
      view: 'Detailed', // Important: Need Detailed view to get all call information including legs
    });

    const records = callLogResponse.records || [];
    allRecords = allRecords.concat(records);

    console.log(`[Sync Calls] Page ${currentPage}: Fetched ${records.length} records (Total so far: ${allRecords.length})`);

    // Check if we should fetch more pages
    if (fetchAllPages && callLogResponse.paging) {
      const paging = callLogResponse.paging;
      totalPages = Math.ceil(paging.totalElements / paging.perPage);

      if (currentPage < totalPages && currentPage < 10) { // Limit to 10 pages max for safety
        currentPage++;
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        hasMorePages = false;
      }
    } else {
      hasMorePages = false;
    }
  }

  console.log(`[Sync Calls] Total fetched: ${allRecords.length} call records from ${totalPages} page(s)`);

  if (allRecords.length === 0) {
    return {
      success: true,
      message: 'No call records to sync',
      synced: 0,
      total: 0,
    };
  }

  // Transform and prepare for insertion
  const transformedRecords = allRecords.map(transformCallRecord);

  // Count accuracy metrics
  const withExtension = transformedRecords.filter((r) => r.extension_number).length;
  const withAgentId = transformedRecords.filter((r) => r.agent_id !== null).length;
  const accuracyPercent = transformedRecords.length > 0
    ? ((withAgentId / transformedRecords.length) * 100).toFixed(1)
    : '0.0';

  console.log(`[Sync Calls] Accuracy: ${withAgentId}/${transformedRecords.length} records mapped (${accuracyPercent}%)`);
  console.log(`[Sync Calls] With extensions: ${withExtension}/${transformedRecords.length}`);

  // Filter to only accurate (mapped) calls if requested
  const recordsToSync = onlyAccurate
    ? transformedRecords.filter((r) => r.agent_id !== null)
    : transformedRecords;

  if (onlyAccurate && recordsToSync.length < transformedRecords.length) {
    const filtered = transformedRecords.length - recordsToSync.length;
    console.log(`[Sync Calls] Filtered out ${filtered} unmapped calls (onlyAccurate mode)`);
  }

  // Upsert records into Supabase
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('call_logs')
    .upsert(recordsToSync, {
      onConflict: 'id',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('[Sync Calls] Supabase error:', error);
    return {
      success: false,
      message: 'Failed to sync call logs to database',
      error: 'Database error',
      details: error.message,
      synced: 0,
      total: transformedRecords.length,
    };
  }

  console.log(`[Sync Calls] Successfully synced ${recordsToSync.length} records`);

  return {
    success: true,
    message: `Successfully synced ${recordsToSync.length} call records (${accuracyPercent}% accuracy)`,
    synced: recordsToSync.length,
    total: transformedRecords.length,
    withExtensions: withExtension,
    withAgentId: withAgentId,
    accuracy: parseFloat(accuracyPercent),
    filtered: onlyAccurate ? transformedRecords.length - recordsToSync.length : 0,
    pagesFetched: totalPages,
    totalRecordsFetched: allRecords.length,
  };
}
