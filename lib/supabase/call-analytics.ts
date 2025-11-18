// lib/supabase/call-analytics.ts
// Functions to fetch call analytics from Supabase

import { createClient } from '@supabase/supabase-js';
import type { AgentCallPerformance, DailyCallVolume } from '@/lib/ringcentral/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get all-time call performance for all agents
 */
export async function getAllAgentCallPerformance(): Promise<AgentCallPerformance[]> {
  try {
    const { data, error } = await supabase
      .from('agent_call_performance')
      .select('*')
      .order('total_calls', { ascending: false });

    if (error) {
      console.error('[getAllAgentCallPerformance Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAllAgentCallPerformance Error]', error);
    return [];
  }
}

/**
 * Get 30-day call activity for all agents
 */
export async function getAgentCallActivity30d() {
  try {
    const { data, error } = await supabase
      .from('agent_call_activity_30d')
      .select('*')
      .order('calls_30d', { ascending: false });

    if (error) {
      console.error('[getAgentCallActivity30d Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAgentCallActivity30d Error]', error);
    return [];
  }
}

/**
 * Get call activity for a specific time range
 */
export async function getAgentCallActivityByRange(daysBack: number = 30) {
  try {
    const { data, error } = await supabase
      .rpc('get_agent_call_activity_by_range', { days_back: daysBack });

    if (error) {
      console.error('[getAgentCallActivityByRange Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAgentCallActivityByRange Error]', error);
    return [];
  }
}

/**
 * Get daily call volume
 */
export async function getDailyCallVolume(): Promise<DailyCallVolume[]> {
  try {
    const { data, error } = await supabase
      .from('daily_call_volume')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('[getDailyCallVolume Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getDailyCallVolume Error]', error);
    return [];
  }
}

/**
 * Get daily call volume for a specific time range
 */
export async function getDailyCallVolumeByRange(daysBack: number = 30) {
  try {
    const { data, error } = await supabase
      .rpc('get_daily_call_volume_by_range', { days_back: daysBack });

    if (error) {
      console.error('[getDailyCallVolumeByRange Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getDailyCallVolumeByRange Error]', error);
    return [];
  }
}

/**
 * Get call logs for a specific agent
 */
export async function getAgentCalls(agentId: number, limit: number = 100) {
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('agent_id', agentId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getAgentCalls Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAgentCalls Error]', error);
    return [];
  }
}

/**
 * Get combined agent stats (email + call data)
 */
export async function getAgentCombinedStats(agentId: number) {
  try {
    const { data: callPerformance, error: callError } = await supabase
      .from('agent_call_performance')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    const { data: callActivity30d, error: activityError } = await supabase
      .from('agent_call_activity_30d')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    const { data: recentCalls, error: callsError } = await supabase
      .from('call_logs')
      .select('*')
      .eq('agent_id', agentId)
      .order('started_at', { ascending: false })
      .limit(50);

    return {
      callPerformance: callPerformance || null,
      callActivity30d: callActivity30d || null,
      recentCalls: recentCalls || [],
    };
  } catch (error) {
    console.error('[getAgentCombinedStats Error]', error);
    return {
      callPerformance: null,
      callActivity30d: null,
      recentCalls: [],
    };
  }
}
