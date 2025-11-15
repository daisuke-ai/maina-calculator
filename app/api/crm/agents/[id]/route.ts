// app/api/crm/agents/[id]/route.ts
// API endpoint to get individual agent details with analytics

import { NextRequest, NextResponse } from 'next/server';
import { getAgentCombinedStats } from '@/lib/supabase/crm-analytics';
import { AGENTS } from '@/config/agents';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = parseInt(resolvedParams.id);

    if (isNaN(agentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid agent ID' },
        { status: 400 }
      );
    }

    // Find agent in config
    const agentConfig = AGENTS.find((a) => a.id === agentId);

    if (!agentConfig) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get combined stats
    const stats = await getAgentCombinedStats(agentId);

    return NextResponse.json({
      success: true,
      agent: {
        ...agentConfig,
        ...stats,
      },
    });
  } catch (error: any) {
    console.error('[GET /api/crm/agents/[id] Error]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
