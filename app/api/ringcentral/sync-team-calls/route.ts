// app/api/ringcentral/sync-team-calls/route.ts
// Sync ONLY calls from your specific team extensions
import { NextRequest, NextResponse } from 'next/server';
import { getCallLog } from '@/lib/ringcentral/client';
import { createClient } from '@supabase/supabase-js';
import type { RingCentralCallRecord } from '@/lib/ringcentral/types';
import { getAgentIdFromCallRecord, RINGCENTRAL_EXTENSION_TO_AGENT } from '@/config/ringcentral-mapping';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// YOUR TEAM'S EXTENSIONS - Only sync calls from these
const TEAM_EXTENSIONS = Object.keys(RINGCENTRAL_EXTENSION_TO_AGENT);

/**
 * Check if a call belongs to your team
 */
function isTeamCall(record: RingCentralCallRecord): boolean {
  // Check from extension
  if (record.from?.extensionNumber && TEAM_EXTENSIONS.includes(record.from.extensionNumber)) {
    return true;
  }

  // Check to extension
  if (record.to?.extensionNumber && TEAM_EXTENSIONS.includes(record.to.extensionNumber)) {
    return true;
  }

  // Check legs for extensions
  if (record.legs) {
    for (const leg of record.legs) {
      if (leg.from?.extensionNumber && TEAM_EXTENSIONS.includes(leg.from.extensionNumber)) {
        return true;
      }
      if (leg.to?.extensionNumber && TEAM_EXTENSIONS.includes(leg.to.extensionNumber)) {
        return true;
      }
    }
  }

  // Check extension field
  if (record.extension?.extensionNumber && TEAM_EXTENSIONS.includes(record.extension.extensionNumber)) {
    return true;
  }

  return false;
}

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
 * POST /api/ringcentral/sync-team-calls
 * Sync ONLY your team's calls, filtering out company-wide noise
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dateFrom,
      dateTo,
      perPage = 1000,
      fetchAllPages = true,
    } = body;

    console.log('[Team Sync] Starting team-only sync...', {
      dateFrom,
      dateTo,
      teamExtensions: TEAM_EXTENSIONS,
    });

    let allRecords: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    let totalFetched = 0;
    let totalPages = 1;

    // Fetch all pages
    while (hasMorePages && currentPage <= 50) {
      console.log(`[Team Sync] Fetching page ${currentPage}...`);

      const callLogResponse = await getCallLog({
        dateFrom,
        dateTo,
        perPage,
        page: currentPage,
        view: 'Detailed',
        type: 'Voice', // Only voice calls
      });

      const records = callLogResponse.records || [];
      totalFetched += records.length;

      // CRITICAL: Filter to only team calls
      const teamRecords = records.filter(isTeamCall);
      allRecords = allRecords.concat(teamRecords);

      console.log(`[Team Sync] Page ${currentPage}: ${records.length} fetched, ${teamRecords.length} are team calls`);

      // Check if more pages exist
      if (fetchAllPages && callLogResponse.paging) {
        const paging = callLogResponse.paging;
        totalPages = Math.ceil(paging.totalElements / paging.perPage);

        if (currentPage < totalPages && currentPage < 50) {
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          hasMorePages = false;
        }
      } else {
        hasMorePages = false;
      }
    }

    console.log(`[Team Sync] Fetched ${totalFetched} total, filtered to ${allRecords.length} team calls`);

    if (allRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No team calls to sync',
        synced: 0,
        totalFetched,
        teamCalls: 0,
      });
    }

    // Transform records
    const transformedRecords = allRecords.map(transformCallRecord);

    // Filter to only mapped calls
    const mappedRecords = transformedRecords.filter(r => r.agent_id !== null);
    const accuracy = transformedRecords.length > 0
      ? ((mappedRecords.length / transformedRecords.length) * 100).toFixed(1)
      : '0.0';

    console.log(`[Team Sync] Syncing ${mappedRecords.length} mapped calls (${accuracy}% accuracy)`);

    // Clear existing data first (for clean start)
    if (body.clearFirst) {
      const { error: deleteError } = await supabase
        .from('call_logs')
        .delete()
        .gte('id', '0'); // Delete all

      if (deleteError) {
        console.error('[Team Sync] Error clearing old data:', deleteError);
      } else {
        console.log('[Team Sync] Cleared old data');
      }
    }

    // Upsert to database
    const { error } = await supabase
      .from('call_logs')
      .upsert(mappedRecords, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('[Team Sync] Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to sync to database',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log(`[Team Sync] Success! ${mappedRecords.length} team calls synced`);

    return NextResponse.json({
      success: true,
      message: `Synced ${mappedRecords.length} team calls (filtered from ${totalFetched} total)`,
      synced: mappedRecords.length,
      totalFetched,
      teamCalls: allRecords.length,
      accuracy: parseFloat(accuracy),
      pagesFetched: totalPages,
    });

  } catch (error: any) {
    console.error('[Team Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Team sync failed',
      },
      { status: 500 }
    );
  }
}