// app/api/ringcentral/sync-calls/route.ts
// API endpoint to fetch call logs from RingCentral and sync to Supabase

import { NextRequest, NextResponse } from 'next/server';
import { getCallLog } from '@/lib/ringcentral/client';
import { createClient } from '@supabase/supabase-js';
import type { RingCentralCallRecord } from '@/lib/ringcentral/types';
import { getAgentIdFromCallRecord } from '@/config/ringcentral-mapping';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Transform RingCentral call record to database format
 */
function transformCallRecord(record: RingCentralCallRecord) {
  // Determine agent ID from call direction
  let agentId: number | null = null;

  if (record.direction === 'Outbound') {
    // For outbound calls, agent is the caller (from)
    agentId = getAgentIdFromCallRecord(
      record.from?.extensionNumber,
      record.from?.phoneNumber
    );
  } else {
    // For inbound calls, agent is the receiver (to)
    agentId = getAgentIdFromCallRecord(
      record.to?.extensionNumber,
      record.to?.phoneNumber
    );
  }

  // Calculate ended_at
  const startedAt = new Date(record.startTime);
  const endedAt = new Date(startedAt.getTime() + (record.duration * 1000));

  return {
    id: record.id,
    session_id: record.sessionId,
    agent_id: agentId,
    extension_id: record.extension?.id || null,
    extension_number: record.from?.extensionNumber || record.to?.extensionNumber || null,

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
 * POST /api/ringcentral/sync-calls
 * Fetch call logs from RingCentral and sync to database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dateFrom, // ISO 8601 format
      dateTo,
      direction,
      perPage = 1000,
      page = 1,
    } = body;

    console.log('[Sync Calls] Fetching call logs from RingCentral...', {
      dateFrom,
      dateTo,
      direction,
      perPage,
      page,
    });

    // Fetch call logs from RingCentral
    const callLogResponse = await getCallLog({
      dateFrom,
      dateTo,
      direction,
      perPage,
      page,
      view: 'Detailed',
    });

    const records = callLogResponse.records || [];

    console.log(`[Sync Calls] Fetched ${records.length} call records`);

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No call records to sync',
        synced: 0,
        total: 0,
      });
    }

    // Transform and prepare for insertion
    const transformedRecords = records.map(transformCallRecord);

    // Upsert records into Supabase
    const { data, error } = await supabase
      .from('call_logs')
      .upsert(transformedRecords, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('[Sync Calls] Supabase error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to sync call logs to database',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log(`[Sync Calls] Successfully synced ${transformedRecords.length} records`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${transformedRecords.length} call records`,
      synced: transformedRecords.length,
      total: callLogResponse.paging?.totalElements || records.length,
      paging: callLogResponse.paging,
    });

  } catch (error: any) {
    console.error('[Sync Calls] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ringcentral/sync-calls
 * Get sync status and information
 */
export async function GET(request: NextRequest) {
  try {
    // Get count of synced calls
    const { count, error } = await supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[Sync Calls Status] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get date range of synced calls
    const { data: dateRange } = await supabase
      .from('call_logs')
      .select('started_at')
      .order('started_at', { ascending: false })
      .limit(1);

    const { data: oldestCall } = await supabase
      .from('call_logs')
      .select('started_at')
      .order('started_at', { ascending: true })
      .limit(1);

    return NextResponse.json({
      success: true,
      totalCalls: count || 0,
      latestCall: dateRange?.[0]?.started_at || null,
      oldestCall: oldestCall?.[0]?.started_at || null,
    });

  } catch (error: any) {
    console.error('[Sync Calls Status] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
