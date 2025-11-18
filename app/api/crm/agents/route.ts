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
    const [performance, activityRange, callPerformance, callActivityRange] = await Promise.all([
      getAllAgentPerformance(),
      daysBack === TIME_RANGES.MONTH
        ? getAgentActivity30d() // Use existing 30d view
        : getAgentPerformanceByRange(daysBack), // Use time-range function
      getAllAgentCallPerformance(),
      daysBack === TIME_RANGES.MONTH
        ? getAgentCallActivity30d()
        : getAgentCallActivityByRange(daysBack),
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

      // Map time-range data to match expected structure
      const activity = activityRange.find((a: any) => a.agent_id === agent.id) || {
        agent_id: agent.id,
        agent_name: agent.aliasName,
        emails_sent_30d: 0,
        emails_sent: 0,
        emails_opened_30d: 0,
        emails_opened: 0,
        emails_replied_30d: 0,
        emails_replied: 0,
        reply_rate_30d: 0,
        reply_rate: 0,
      };

      // Normalize the activity data
      const normalizedActivity = {
        emails_sent_30d: activity.emails_sent_30d || activity.emails_sent || 0,
        emails_opened_30d: activity.emails_opened_30d || activity.emails_opened || 0,
        emails_replied_30d: activity.emails_replied_30d || activity.emails_replied || 0,
        reply_rate_30d: activity.reply_rate_30d || activity.reply_rate || 0,
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

      // Get call activity data
      const callActivity = callActivityRange.find((a: any) => a.agent_id === agent.id) || {
        calls_30d: 0,
        inbound_calls_30d: 0,
        outbound_calls_30d: 0,
        answered_calls_30d: 0,
        missed_calls_30d: 0,
        total_duration_30d: 0,
        avg_duration_30d: 0,
        answer_rate_30d: 0,
      };

      return {
        ...agent,
        // Email data
        ...perfData,
        ...normalizedActivity,
        // Call data
        ...callPerfData,
        ...callActivity,
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
