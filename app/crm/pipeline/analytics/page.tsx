'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  TrendingUp,
  BarChart3,
  Users,
  DollarSign,
  Calendar,
  Target,
  Award,
  RefreshCw,
  ExternalLink,
  LayoutDashboard,
} from 'lucide-react';

interface SummaryData {
  timeRange: {
    total_created: number;
    total_won: number;
    total_lost: number;
    won_value: number;
    lost_value: number;
    conversion_rate: number;
  };
  allTime: {
    total_active_deals: number;
    active_pipeline_value: number;
    overall_conversion_rate: number;
    avg_days_to_close: number;
  };
}

interface StageData {
  stage: string;
  deal_count: number;
  total_value: number;
  avg_probability: number;
  weighted_value: number;
}

interface AgentPerformance {
  agent_id: number;
  agent_name: string;
  active_deals: number;
  total_won: number;
  total_lost: number;
  conversion_rate: number;
  total_won_value: number;
  avg_days_to_close: number;
  active_pipeline_value: number;
}

interface ForecastData {
  forecast_month: string;
  deals_expected_to_close: number;
  weighted_value: number;
  unweighted_value: number;
}

export default function PipelineAnalyticsPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [byStage, setByStage] = useState<StageData[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch summary
      const summaryRes = await fetch(`/api/crm/pipeline/analytics/summary?days_back=${timeRange}`);
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);
      setByStage(summaryData.byStage || []);

      // Fetch agent performance
      const agentsRes = await fetch('/api/crm/pipeline/analytics/agents');
      const agentsData = await agentsRes.json();
      setAgentPerformance(agentsData.agents || []);

      // Fetch forecast
      const forecastRes = await fetch('/api/crm/pipeline/analytics/forecast?months_ahead=6');
      const forecastData = await forecastRes.json();
      setForecast(forecastData.forecast || []);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const STAGE_LABELS: { [key: string]: string } = {
    loi_accepted: 'LOI Accepted',
    due_diligence: 'Due Diligence',
    contract: 'Contract',
    closing: 'Closing',
    won: 'Won',
    lost: 'Lost',
  };

  if (loading && !summary) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted shadow-lg mb-4">
              <BarChart3 className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2">Pipeline Analytics</h1>
            <p className="text-lg text-muted-foreground">Performance metrics and forecasting</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-4 py-2 bg-muted border-2 border-border rounded-xl text-foreground font-medium shadow-lg"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link href="/crm/pipeline">
              <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-medium transition-all shadow-lg">
                <LayoutDashboard className="w-4 h-4" />
                Back to Pipeline
              </button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Pipeline</p>
                  <p className="text-3xl font-bold text-accent">
                    {formatCurrency(summary.allTime.active_pipeline_value || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.allTime.total_active_deals} active deals
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-accent opacity-30" />
              </div>
            </Card>

            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Won (Period)</p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(summary.timeRange.won_value || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.timeRange.total_won} deals closed
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-accent opacity-30" />
              </div>
            </Card>

            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
                  <p className="text-3xl font-bold text-accent">
                    {summary.allTime.overall_conversion_rate || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">All-time performance</p>
                </div>
                <Target className="w-10 h-10 text-accent opacity-30" />
              </div>
            </Card>

            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Days to Close</p>
                  <p className="text-3xl font-bold text-foreground">
                    {summary.allTime.avg_days_to_close || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Days on average</p>
                </div>
                <Calendar className="w-10 h-10 text-accent opacity-30" />
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pipeline by Stage */}
          <Card className="bg-card border-2 border-border shadow-xl p-6">
            <h2 className="text-2xl font-extrabold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Pipeline by Stage
            </h2>
            <div className="space-y-3">
              {byStage.map(stage => (
                <div key={stage.stage} className="bg-muted border-2 border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-accent">
                      {STAGE_LABELS[stage.stage]}
                    </h3>
                    <span className="text-sm text-muted-foreground">{stage.deal_count} deals</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Value</p>
                      <p className="font-semibold text-foreground">{formatCurrency(stage.total_value)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Weighted Value</p>
                      <p className="font-semibold text-accent">
                        {formatCurrency(stage.weighted_value)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      Avg Probability: {stage.avg_probability}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 6-Month Forecast */}
          <Card className="bg-card border-2 border-border shadow-xl p-6">
            <h2 className="text-2xl font-extrabold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              6-Month Forecast
            </h2>
            <div className="space-y-3">
              {forecast.map(month => (
                <div key={month.forecast_month} className="bg-muted border-2 border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground">{formatMonth(month.forecast_month)}</h3>
                    <span className="text-sm text-muted-foreground">
                      {month.deals_expected_to_close} deals
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Weighted Forecast</p>
                      <p className="font-bold text-accent">
                        {formatCurrency(month.weighted_value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Best Case</p>
                      <p className="font-semibold text-foreground">{formatCurrency(month.unweighted_value)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Agent Performance Table */}
        <Card className="bg-card border-2 border-border shadow-xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-extrabold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Agent Performance
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b-2 border-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Agent</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Active</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Won</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Lost</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Conv. Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Won Value</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Pipeline Value</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Avg Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agentPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No agent performance data available
                    </td>
                  </tr>
                ) : (
                  agentPerformance
                    .sort((a, b) => b.active_pipeline_value - a.active_pipeline_value)
                    .map(agent => (
                      <tr key={agent.agent_id} className="hover:bg-muted transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-accent" />
                            <span className="font-semibold text-foreground">{agent.agent_name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-semibold text-accent">
                          {agent.active_deals}
                        </td>
                        <td className="text-right py-3 px-4 text-foreground">{agent.total_won}</td>
                        <td className="text-right py-3 px-4 text-muted-foreground">{agent.total_lost}</td>
                        <td className="text-right py-3 px-4">
                          <span className={`font-semibold ${
                            agent.conversion_rate >= 50 ? 'text-accent' :
                            agent.conversion_rate >= 30 ? 'text-yellow-500' :
                            'text-muted-foreground'
                          }`}>
                            {agent.conversion_rate}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 font-semibold text-foreground">
                          {formatCurrency(agent.total_won_value)}
                        </td>
                        <td className="text-right py-3 px-4 font-semibold text-accent">
                          {formatCurrency(agent.active_pipeline_value)}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {agent.avg_days_to_close || '-'}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
