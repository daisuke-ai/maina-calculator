// app/api/crm/agents/route.ts
// API endpoint to get all agents with performance data (emails + calls)

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAgentPerformance,
  getAgentActivity30d,
  getAgentPerformanceByRange,
  TIME_RANGES,
} from '@/lib/supabase/crm-analytics';
import {
  getAllAgentCallPerformance,
  getAgentCallActivity30d,
  getAgentCallActivityByRange,
} from '@/lib/supabase/call-analytics';
import { AGENTS } from '@/config/agents';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range');

    // Determine days back based on range parameter
    let daysBack: number = TIME_RANGES.MONTH; // Default to 30 days for agents page
    if (range) {
      const rangeUpper = range.toUpperCase() as keyof typeof TIME_RANGES;
      if (rangeUpper in TIME_RANGES) {
        daysBack = TIME_RANGES[rangeUpper];
      } else {
        const parsedDays = parseInt(range);
        if (!isNaN(parsedDays) && parsedDays > 0) {
          daysBack = parsedDays;
        }
      }
    }

    // Get both email and call data
    // For month view, use optimized views; for other ranges, use time-range functions
    const [performance, activityRange, callPerformance, callActivityRange] = await Promise.all([
      getAllAgentPerformance(), // All-time performance data
      getAgentPerformanceByRange(daysBack), // Always use range function for consistency
      getAllAgentCallPerformance(), // All-time call performance
      getAgentCallActivityByRange(daysBack), // Always use range function for consistency
    ]);

    // Combine with agent config data
    const agentsWithStats = AGENTS.map((agent) => {
      const perfData = performance.find((p) => p.agent_id === agent.id) || {
        agent_id: agent.id,
        agent_name: agent.aliasName,
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_replied: 0,
        total_opens: 0,
        total_clicks: 0,
        open_rate: 0,
        click_rate: 0,
        reply_rate: 0,
        first_email_sent: null,
        last_email_sent: null,
        last_reply_received: null,
      };

      // Get time-range email data
      const activity = activityRange.find((a: any) => a.agent_id === agent.id) || {
        agent_id: agent.id,
        agent_name: agent.aliasName,
        emails_sent: 0,
        emails_opened: 0,
        emails_replied: 0,
        reply_rate: 0,
      };

      // Normalize the activity data to consistent format
      // These values come from get_agent_activity_by_range SQL function
      const normalizedActivity = {
        emails_sent_30d: activity.emails_sent || 0,
        emails_opened_30d: activity.emails_opened || 0,
        emails_replied_30d: activity.emails_replied || 0,
        reply_rate_30d: activity.reply_rate || 0,
      };

      // Get call performance data
      const callPerfData = callPerformance.find((p: any) => p.agent_id === agent.id) || {
        total_calls: 0,
        inbound_calls: 0,
        outbound_calls: 0,
        answered_calls: 0,
        missed_calls: 0,
        voicemail_calls: 0,
        total_duration: 0,
        avg_duration: 0,
        answer_rate: 0,
        first_call: null,
        last_call: null,
      };

      // Get call activity data for time range
      const callActivity = callActivityRange.find((a: any) => a.agent_id === agent.id) || {
        agent_id: agent.id,
        agent_name: agent.aliasName,
        total_calls: 0,
        inbound_calls: 0,
        outbound_calls: 0,
        answered_calls: 0,
        missed_calls: 0,
        total_duration: 0,
        avg_duration: 0,
        answer_rate: 0,
      };

      // Normalize call activity data to match expected 30d field names
      // These values come from get_agent_call_activity_by_range SQL function
      const normalizedCallActivity = {
        calls_30d: callActivity.total_calls || 0,
        inbound_calls_30d: callActivity.inbound_calls || 0,
        outbound_calls_30d: callActivity.outbound_calls || 0,
        answered_calls_30d: callActivity.answered_calls || 0,
        missed_calls_30d: callActivity.missed_calls || 0,
        total_duration_30d: callActivity.total_duration || 0,
        avg_duration_30d: callActivity.avg_duration || 0,
        answer_rate_30d: callActivity.answer_rate || 0,
      };

      return {
        ...agent,
        // Email data (all-time + normalized range)
        ...perfData,
        ...normalizedActivity,
        // Call data (all-time + normalized range)
        ...callPerfData,
        ...normalizedCallActivity,
      };
    });

    return NextResponse.json({
      success: true,
      agents: agentsWithStats,
      total: agentsWithStats.length,
      range: range || 'month',
      daysBack,
    });
  } catch (error: any) {
    console.error('[GET /api/crm/agents Error]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
