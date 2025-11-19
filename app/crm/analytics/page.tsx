'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft,
  Mail,
  Eye,
  MessageSquare,
  Calendar,
  BarChart3,
  Users,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  CheckCircle2,
  TrendingUp
} from 'lucide-react'

interface OfferTypeStats {
  offer_type: string
  total_sent: number
  total_opened: number
  total_replied: number
  open_rate: number
  reply_rate: number
  avg_offer_price: number
}

interface DailyVolume {
  date: string
  emails_sent: number
  emails_opened: number
  emails_replied: number
  active_agents: number
}

interface DailyCallVolume {
  date: string
  total_calls: number
  inbound_calls: number
  outbound_calls: number
  answered_calls: number
  missed_calls: number
  total_duration: number
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

interface CallPerformance {
  agent_id: number
  agent_name: string
  total_calls: number
  inbound_calls: number
  outbound_calls: number
  answered_calls: number
  answer_rate: number
  total_duration: number
  avg_duration: number
}

interface AnalyticsData {
  offerTypes: OfferTypeStats[]
  dailyVolume: DailyVolume[]
  topAgents: TopAgent[]
  callPerformance?: CallPerformance[]
  callActivity?: CallPerformance[]
  dailyCallVolume: DailyCallVolume[]
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
    { value: 'week', label: '7 Days' },
    { value: 'month', label: '30 Days' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
    { value: 'all', label: 'All-Time' },
  ]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week': return 'Last 7 Days'
      case 'month': return 'Last 30 Days'
      case 'quarter': return 'Last Quarter'
      case 'year': return 'Last Year'
      case 'all': return 'All-Time'
      default: return 'Last 30 Days'
    }
  }

  // Get call performance data (handles both all-time and time-range responses)
  const callData = analytics?.callPerformance || analytics?.callActivity || []

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
    <main className="min-h-screen bg-background">
      {/* Professional Header */}
      <div className="border-b">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/crm">
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-lg font-medium transition-colors mb-4">
                  <ArrowLeft className="w-4 h-4" />
                  Back to CRM
                </button>
              </Link>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">Performance metrics and insights</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Time Range Selector */}
        <Card className="p-4 border-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Time Range:</span>
            </div>
            <div className="flex gap-2">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === option.value
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Email Analytics Section */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Email Performance - {getTimeRangeLabel()}</h2>

          {/* Top Email Agents */}
          <Card className="border-2 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Agent</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Sent</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Opened</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Replied</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Reply Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.topAgents.slice(0, 10).map((agent) => (
                    <tr key={agent.agent_id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                            {agent.agent_name.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{agent.agent_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{agent.total_sent}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{agent.total_opened}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{agent.total_replied}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-foreground">
                          {agent.reply_rate?.toFixed(1) || '0.0'}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {analytics.topAgents.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg text-muted-foreground">No email data available</p>
              </div>
            )}
          </Card>

          {/* Daily Email Activity */}
          <Card className="border-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Date</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Sent</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Opened</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Replied</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Active Agents</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.dailyVolume.slice(0, 7).map((day, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{formatDate(day.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{day.emails_sent}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{day.emails_opened}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{day.emails_replied}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{day.active_agents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {analytics.dailyVolume.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg text-muted-foreground">No daily email activity data</p>
              </div>
            )}
          </Card>
        </div>

        {/* Call Analytics Section */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Call Performance - {getTimeRangeLabel()}</h2>

          {/* Top Call Agents */}
          <Card className="border-2 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Agent</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Total Calls</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Inbound</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Outbound</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Answered</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Answer Rate</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Avg Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {callData.slice(0, 10).map((agent) => (
                    <tr key={agent.agent_id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                            {agent.agent_name.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{agent.agent_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{agent.total_calls || 0}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{agent.inbound_calls || 0}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{agent.outbound_calls || 0}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{agent.answered_calls || 0}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-foreground">
                          {agent.answer_rate?.toFixed(1) || '0.0'}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">
                        {formatDuration(agent.avg_duration || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {callData.length === 0 && (
              <div className="text-center py-16">
                <Phone className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg text-muted-foreground">No call data available</p>
              </div>
            )}
          </Card>

          {/* Daily Call Activity */}
          <Card className="border-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-foreground">Date</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Total Calls</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Inbound</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Outbound</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Answered</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Missed</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-foreground">Active Agents</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.dailyCallVolume?.slice(0, 7).map((day, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{formatDate(day.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{day.total_calls}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{day.inbound_calls}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{day.outbound_calls}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{day.answered_calls}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{day.missed_calls}</td>
                      <td className="px-6 py-4 text-center font-medium text-foreground">{day.active_agents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!analytics.dailyCallVolume || analytics.dailyCallVolume.length === 0) && (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg text-muted-foreground">No daily call activity data</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
