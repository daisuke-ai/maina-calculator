// app/api/crm/agents/route.ts
// API endpoint to get all agents with performance data

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAgentPerformance,
  getAgentActivity30d,
  getAgentPerformanceByRange,
  TIME_RANGES,
} from '@/lib/supabase/crm-analytics';
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

    // Get both all-time performance and time-range specific activity
    const [performance, activityRange] = await Promise.all([
      getAllAgentPerformance(),
      daysBack === TIME_RANGES.MONTH
        ? getAgentActivity30d() // Use existing 30d view
        : getAgentPerformanceByRange(daysBack), // Use time-range function
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

      return {
        ...agent,
        ...perfData,
        ...normalizedActivity,
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
