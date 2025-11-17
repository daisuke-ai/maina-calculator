'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft,
  TrendingUp,
  Mail,
  Eye,
  MessageSquare,
  Calendar,
  BarChart3,
  Users,
  Download,
  FileText
} from 'lucide-react'
import { downloadAnalyticsCSV, downloadAnalyticsPDF } from '@/lib/export-reports'

interface OfferTypeStats {
  offer_type: string
  total_sent: number
  total_opened: number
  total_replied: number
  open_rate: number
  reply_rate: number
  avg_offer_price: number
  avg_down_payment: number
  avg_monthly_payment: number
}

interface DailyVolume {
  date: string
  emails_sent: number
  emails_opened: number
  emails_replied: number
  active_agents: number
}

interface TopAgent {
  agent_id: number
  agent_name: string
  total_sent: number
  total_opened: number
  total_replied: number
  reply_rate: number
}

interface AnalyticsData {
  offerTypes: OfferTypeStats[]
  dailyVolume: DailyVolume[]
  topAgents: TopAgent[]
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('month')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const url = `/api/crm/analytics${timeRange !== 'all' ? `?range=${timeRange}` : ''}`
      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch analytics')
      }

      setAnalytics(result.analytics)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <Card className="p-6 bg-destructive/10 border-l-4 border-destructive">
            <p className="text-destructive font-semibold mb-4">Error: {error || 'Failed to load analytics'}</p>
            <Link href="/crm">
              <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium transition-all border-2 border-border">
                Back to CRM
              </button>
            </Link>
          </Card>
        </div>
      </div>
    )
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
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2">Analytics</h1>
            <p className="text-lg text-muted-foreground">Insights and performance metrics</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/crm">
              <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border">
                <ArrowLeft className="w-4 h-4" />
                Back to CRM
              </button>
            </Link>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => analytics && downloadAnalyticsCSV(analytics.offerTypes, analytics.topAgents, analytics.dailyVolume, timeRange)}
                disabled={loading || !analytics}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download CSV Report"
              >
                <FileText className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => analytics && downloadAnalyticsPDF(analytics.offerTypes, analytics.topAgents, analytics.dailyVolume, timeRange)}
                disabled={loading || !analytics}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download PDF Report"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <Card className="p-4 bg-card border-2 border-border shadow-xl">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-muted-foreground mr-2">Time Range:</span>
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                disabled={loading}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${timeRange === option.value
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Top Performing Agents */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">Top Performing Agents</h2>
          <Card className="bg-card border-2 border-border shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b-2 border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Agent</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Sent</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Opened</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Replied</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Reply Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.topAgents.map((agent, index) => (
                    <tr key={agent.agent_id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${index === 0 ? 'bg-accent/30 text-accent' :
                            index === 1 ? 'bg-accent/20 text-accent' :
                            index === 2 ? 'bg-accent/10 text-accent' :
                            'bg-muted text-muted-foreground'}
                        `}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                            {agent.agent_name.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{agent.agent_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{agent.total_sent}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{agent.total_opened}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{agent.total_replied}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent/20 text-accent border border-accent/30">
                          {agent.reply_rate?.toFixed(1) || '0.0'}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {analytics.topAgents.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg text-muted-foreground">No agent data available</p>
              </div>
            )}
          </Card>
        </div>

        {/* Daily Email Volume (Last 7 Days) */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">Recent Activity (Last 7 Days)</h2>
          <Card className="bg-card border-2 border-border shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b-2 border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Emails Sent</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Opened</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Replied</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Active Agents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.dailyVolume.slice(0, 7).map((day, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-accent" />
                          <span className="font-medium text-foreground">{formatDate(day.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{day.emails_sent}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{day.emails_opened}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <MessageSquare className="w-4 h-4 text-accent" />
                          <span className="font-medium text-accent">{day.emails_replied}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{day.active_agents}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {analytics.dailyVolume.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg text-muted-foreground">No daily activity data available</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
