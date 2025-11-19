// lib/supabase/crm-analytics.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// Types
// ============================================================================

export interface AgentPerformance {
  agent_id: number;
  agent_name: string;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
  total_opens: number;
  total_clicks: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  first_email_sent: string;
  last_email_sent: string;
  last_reply_received: string | null;
}

export interface AgentActivity30d {
  agent_id: number;
  agent_name: string;
  emails_sent_30d: number;
  emails_opened_30d: number;
  emails_replied_30d: number;
  reply_rate_30d: number;
}

export interface PropertyAnalytics {
  agent_id: number;
  agent_name: string;
  property_address: string;
  offer_type: string;
  offer_price: number;
  sent_at: string;
  opened: boolean;
  opened_at: string | null;
  replied: boolean;
  replied_at: string | null;
  open_count: number;
  click_count: number;
  hours_to_reply: number | null;
  realtor_email_response: string | null;
  reply_received_at: string | null;
}

export interface OfferTypeAnalytics {
  offer_type: string;
  total_sent: number;
  total_opened: number;
  total_replied: number;
  open_rate: number;
  reply_rate: number;
  avg_offer_price: number;
  avg_down_payment: number;
  avg_monthly_payment: number;
}

export interface DailyVolume {
  date: string;
  emails_sent: number;
  emails_opened: number;
  emails_replied: number;
  active_agents: number;
}

export interface AgentDetails extends AgentPerformance {
  agent_email: string;
  avg_hours_to_reply: number | null;
}

// ============================================================================
// Time Range Constants
// ============================================================================

export const TIME_RANGES = {
  WEEK: 7,
  MONTH: 30,
  QUARTER: 90,
  YEAR: 365,
  ALL_TIME: 999999, // Very large number to get all data
} as const;

export type TimeRangeKey = keyof typeof TIME_RANGES;

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Get all agent performance summaries
 */
export async function getAllAgentPerformance(): Promise<AgentPerformance[]> {
  try {
    const { data, error } = await supabase
      .from('agent_performance_summary')
      .select('*')
      .order('total_sent', { ascending: false });

    if (error) {
      console.error('[getAllAgentPerformance Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAllAgentPerformance Error]', error);
    return [];
  }
}

/**
 * Get agent performance for a specific time range
 */
export async function getAgentPerformanceByRange(daysBack: number = TIME_RANGES.WEEK) {
  try {
    const { data, error } = await supabase
      .rpc('get_agent_activity_by_range', { days_back: daysBack });

    if (error) {
      console.error('[getAgentPerformanceByRange Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAgentPerformanceByRange Catch Error]', error);
    return [];
  }
}

/**
 * Get 30-day activity for all agents
 */
export async function getAgentActivity30d(): Promise<AgentActivity30d[]> {
  try {
    const { data, error } = await supabase
      .from('agent_activity_30d')
      .select('*')
      .order('emails_sent_30d', { ascending: false });

    if (error) {
      console.error('[getAgentActivity30d Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAgentActivity30d Error]', error);
    return [];
  }
}

/**
 * Get detailed agent information by ID
 */
export async function getAgentDetails(agentId: number): Promise<AgentDetails | null> {
  try {
    const { data, error } = await supabase.rpc('get_agent_details', {
      p_agent_id: agentId,
    });

    if (error) {
      console.error('[getAgentDetails Error]', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[getAgentDetails Error]', error);
    return null;
  }
}

/**
 * Get all emails sent by a specific agent
 */
export async function getAgentEmails(agentId: number): Promise<PropertyAnalytics[]> {
  try {
    const { data, error } = await supabase
      .from('agent_property_analytics')
      .select('*')
      .eq('agent_id', agentId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('[getAgentEmails Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAgentEmails Error]', error);
    return [];
  }
}

/**
 * Get email replies for a specific agent
 */
export async function getAgentReplies(agentId: number) {
  try {
    const { data, error } = await supabase
      .from('email_replies')
      .select('*')
      .eq('agent_id', agentId)
      .order('received_at', { ascending: false });

    if (error) {
      console.error('[getAgentReplies Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAgentReplies Error]', error);
    return [];
  }
}

/**
 * Get offer type analytics
 */
export async function getOfferTypeAnalytics(): Promise<OfferTypeAnalytics[]> {
  try {
    const { data, error } = await supabase
      .from('offer_type_analytics')
      .select('*')
      .order('total_sent', { ascending: false });

    if (error) {
      console.error('[getOfferTypeAnalytics Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getOfferTypeAnalytics Error]', error);
    return [];
  }
}

/**
 * Get daily email volume for the last 90 days
 */
export async function getDailyEmailVolume(): Promise<DailyVolume[]> {
  try {
    const { data, error } = await supabase
      .from('daily_email_volume')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('[getDailyEmailVolume Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getDailyEmailVolume Error]', error);
    return [];
  }
}

/**
 * Get top performing agents
 */
export async function getTopAgents(limit: number = 10) {
  try {
    const { data, error } = await supabase.rpc('get_top_agents', {
      limit_count: limit,
    });

    if (error) {
      console.error('[getTopAgents Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getTopAgents Error]', error);
    return [];
  }
}

/**
 * Get combined agent stats (performance + 30d activity + call metrics)
 * Supports time ranges: 7, 30, 90 (quarter), 365 (year)
 */
export async function getAgentCombinedStats(agentId: number, timeRange?: number) {
  try {
    const [
      performance,
      activity,
      emails,
      replies,
      callPerformance,
      callActivity30d,
      callActivity7d,
      callActivity90d,
      callActivity365d
    ] = await Promise.all([
      getAgentDetails(agentId),
      supabase
        .from('agent_activity_30d')
        .select('*')
        .eq('agent_id', agentId)
        .single(),
      getAgentEmails(agentId),
      getAgentReplies(agentId),
      // Fetch call performance (all-time)
      supabase
        .from('agent_call_performance')
        .select('*')
        .eq('agent_id', agentId)
        .single(),
      // Fetch 30-day call activity
      supabase
        .from('agent_call_activity_30d')
        .select('*')
        .eq('agent_id', agentId)
        .single(),
      // Fetch 7-day call activity
      supabase
        .rpc('get_agent_call_activity_by_range', { days_back: 7 })
        .then(res => res.data?.find((a: any) => a.agent_id === agentId) || null),
      // Fetch 90-day call activity (quarter)
      supabase
        .rpc('get_agent_call_activity_by_range', { days_back: 90 })
        .then(res => res.data?.find((a: any) => a.agent_id === agentId) || null),
      // Fetch 365-day call activity (year)
      supabase
        .rpc('get_agent_call_activity_by_range', { days_back: 365 })
        .then(res => res.data?.find((a: any) => a.agent_id === agentId) || null),
    ]);

    // Extract call metrics from the fetched data
    const callData = callPerformance.data || {};
    const call30d = callActivity30d.data || {};
    const call7d = callActivity7d || {};
    const call90d = callActivity90d || {};
    const call365d = callActivity365d || {};

    return {
      performance,
      activity30d: activity.data || null,
      emails: emails || [],
      replies: replies || [],
      // Add all-time call metrics
      total_calls: callData.total_calls || 0,
      inbound_calls: callData.inbound_calls || 0,
      outbound_calls: callData.outbound_calls || 0,
      answered_calls: callData.answered_calls || 0,
      missed_calls: callData.missed_calls || 0,
      total_duration: callData.total_duration || 0,
      avg_duration: callData.avg_duration || 0,
      answer_rate: callData.answer_rate || 0,
      // Add 7-day call metrics
      calls_7d: call7d.total_calls || 0,
      inbound_calls_7d: call7d.inbound_calls || 0,
      outbound_calls_7d: call7d.outbound_calls || 0,
      answered_calls_7d: call7d.answered_calls || 0,
      missed_calls_7d: call7d.missed_calls || 0,
      total_duration_7d: call7d.total_duration || 0,
      avg_duration_7d: call7d.avg_duration || 0,
      answer_rate_7d: call7d.answer_rate || 0,
      // Add 30-day call metrics
      calls_30d: call30d.calls_30d || 0,
      inbound_calls_30d: call30d.inbound_calls_30d || 0,
      outbound_calls_30d: call30d.outbound_calls_30d || 0,
      answered_calls_30d: call30d.answered_calls_30d || 0,
      missed_calls_30d: call30d.missed_calls_30d || 0,
      total_duration_30d: call30d.total_duration_30d || 0,
      avg_duration_30d: call30d.avg_duration_30d || 0,
      answer_rate_30d: call30d.answer_rate_30d || 0,
      // Add 90-day call metrics (quarter)
      calls_90d: call90d.total_calls || 0,
      inbound_calls_90d: call90d.inbound_calls || 0,
      outbound_calls_90d: call90d.outbound_calls || 0,
      answered_calls_90d: call90d.answered_calls || 0,
      missed_calls_90d: call90d.missed_calls || 0,
      total_duration_90d: call90d.total_duration || 0,
      avg_duration_90d: call90d.avg_duration || 0,
      answer_rate_90d: call90d.answer_rate || 0,
      // Add 365-day call metrics (year)
      calls_365d: call365d.total_calls || 0,
      inbound_calls_365d: call365d.inbound_calls || 0,
      outbound_calls_365d: call365d.outbound_calls || 0,
      answered_calls_365d: call365d.answered_calls || 0,
      missed_calls_365d: call365d.missed_calls || 0,
      total_duration_365d: call365d.total_duration || 0,
      avg_duration_365d: call365d.avg_duration || 0,
      answer_rate_365d: call365d.answer_rate || 0,
    };
  } catch (error) {
    console.error('[getAgentCombinedStats Error]', error);
    return {
      performance: null,
      activity30d: null,
      emails: [],
      replies: [],
      // Return default call values
      total_calls: 0,
      inbound_calls: 0,
      outbound_calls: 0,
      answered_calls: 0,
      missed_calls: 0,
      total_duration: 0,
      avg_duration: 0,
      answer_rate: 0,
      // 7-day
      calls_7d: 0,
      inbound_calls_7d: 0,
      outbound_calls_7d: 0,
      answered_calls_7d: 0,
      missed_calls_7d: 0,
      total_duration_7d: 0,
      avg_duration_7d: 0,
      answer_rate_7d: 0,
      // 30-day
      calls_30d: 0,
      inbound_calls_30d: 0,
      outbound_calls_30d: 0,
      answered_calls_30d: 0,
      missed_calls_30d: 0,
      total_duration_30d: 0,
      avg_duration_30d: 0,
      answer_rate_30d: 0,
      // 90-day
      calls_90d: 0,
      inbound_calls_90d: 0,
      outbound_calls_90d: 0,
      answered_calls_90d: 0,
      missed_calls_90d: 0,
      total_duration_90d: 0,
      avg_duration_90d: 0,
      answer_rate_90d: 0,
      // 365-day
      calls_365d: 0,
      inbound_calls_365d: 0,
      outbound_calls_365d: 0,
      answered_calls_365d: 0,
      missed_calls_365d: 0,
      total_duration_365d: 0,
      avg_duration_365d: 0,
      answer_rate_365d: 0,
    };
  }
}

// ============================================================================
// Time-Range Analytics Functions
// ============================================================================

/**
 * Get offer type analytics for a specific time range
 */
export async function getOfferTypeAnalyticsByRange(daysBack: number = TIME_RANGES.WEEK) {
  try {
    const { data, error } = await supabase
      .rpc('get_offer_type_analytics_by_range', { days_back: daysBack });

    if (error) {
      console.error('[getOfferTypeAnalyticsByRange Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getOfferTypeAnalyticsByRange Catch Error]', error);
    return [];
  }
}

/**
 * Get daily email volume for a specific time range
 */
export async function getDailyEmailVolumeByRange(daysBack: number = TIME_RANGES.WEEK) {
  try {
    const { data, error } = await supabase
      .rpc('get_daily_email_volume_by_range', { days_back: daysBack });

    if (error) {
      console.error('[getDailyEmailVolumeByRange Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getDailyEmailVolumeByRange Catch Error]', error);
    return [];
  }
}

/**
 * Get top agents for a specific time range
 */
export async function getTopAgentsByRange(limit: number = 10, daysBack: number = TIME_RANGES.WEEK) {
  try {
    const { data, error } = await supabase
      .rpc('get_top_agents_by_range', { limit_count: limit, days_back: daysBack });

    if (error) {
      console.error('[getTopAgentsByRange Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getTopAgentsByRange Catch Error]', error);
    return [];
  }
}

/**
 * Get comprehensive analytics for all time ranges
 */
export async function getAnalyticsByRange(daysBack: number = TIME_RANGES.WEEK) {
  try {
    const [offerTypes, dailyVolume, topAgents] = await Promise.all([
      getOfferTypeAnalyticsByRange(daysBack),
      getDailyEmailVolumeByRange(daysBack),
      getTopAgentsByRange(10, daysBack),
    ]);

    return {
      offerTypes,
      dailyVolume,
      topAgents,
    };
  } catch (error) {
    console.error('[getAnalyticsByRange Error]', error);
    return {
      offerTypes: [],
      dailyVolume: [],
      topAgents: [],
    };
  }
}
