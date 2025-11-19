'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Mail,
  TrendingUp,
  Search,
  ArrowUpDown,
  Eye,
  MessageSquare,
  ExternalLink,
  BarChart3,
  Calendar,
  Download,
  FileText,
  LayoutDashboard,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Activity,
  Target,
  Award,
  Zap,
  ArrowRight,
  ChevronRight,
  DollarSign
} from 'lucide-react'
import { downloadAgentsCSV, downloadAgentsPDF } from '@/lib/export-reports'

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all'

interface AgentStats {
  id: number
  realName: string
  aliasName: string
  email: string
  phone: string
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_replied: number
  open_rate: number
  click_rate: number
  reply_rate: number
  emails_sent_30d: number
  emails_opened_30d: number
  emails_replied_30d: number
  reply_rate_30d: number
  last_email_sent: string | null
  // Call data
  total_calls: number
  inbound_calls: number
  outbound_calls: number
  answered_calls: number
  missed_calls: number
  total_duration: number
  avg_duration: number
  answer_rate: number
  calls_30d: number
  answered_calls_30d: number
  answer_rate_30d: number
}

interface PipelineSummary {
  total_active_deals: number
  active_pipeline_value: number
  overall_conversion_rate: number
}

export default function CRMDashboard() {
  const [agents, setAgents] = useState<AgentStats[]>([])
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'sent' | 'reply_rate' | 'calls' | 'answer_rate'>('reply_rate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [timeRange, setTimeRange] = useState<TimeRange>('month')

  useEffect(() => {
    fetchAgents()
    fetchPipelineSummary(timeRange)
  }, [timeRange])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const url = `/api/crm/agents${timeRange !== 'month' ? `?range=${timeRange}` : ''}`
      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch agents')
      }

      setAgents(result.agents)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPipelineSummary = async (range: TimeRange) => {
    try {
      const daysBack = range === 'week' ? 7 : range === 'month' ? 30 : range === 'quarter' ? 90 : range === 'year' ? 365 : 9999
      const response = await fetch(`/api/crm/pipeline/analytics/summary?days_back=${daysBack}`)
      const result = await response.json()

      if (response.ok && result.pipeline_summary) {
        setPipelineSummary(result.pipeline_summary)
      }
    } catch (err: any) {
      console.error('Failed to fetch pipeline summary:', err)
    }
  }

  const timeRangeOptions: { value: TimeRange; label: string; icon?: any }[] = [
    { value: 'week', label: '7 Days' },
    { value: 'month', label: '30 Days' },
    { value: 'quarter', label: '3 Months' },
    { value: 'year', label: '12 Months' },
    { value: 'all', label: 'All Time' }
  ]

  const filteredAgents = agents
    .filter(agent => {
      const search = searchTerm.toLowerCase()
      return agent.aliasName.toLowerCase().includes(search) ||
        agent.email.toLowerCase().includes(search) ||
        agent.realName.toLowerCase().includes(search)
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = a.aliasName.localeCompare(b.aliasName)
      } else if (sortBy === 'sent') {
        const aVal = timeRange === 'month' ? a.emails_sent_30d : a.total_sent
        const bVal = timeRange === 'month' ? b.emails_sent_30d : b.total_sent
        comparison = (aVal || 0) - (bVal || 0)
      } else if (sortBy === 'reply_rate') {
        const aVal = timeRange === 'month' ? a.reply_rate_30d : a.reply_rate
        const bVal = timeRange === 'month' ? b.reply_rate_30d : b.reply_rate
        comparison = (aVal || 0) - (bVal || 0)
      } else if (sortBy === 'calls') {
        const aVal = timeRange === 'month' ? a.calls_30d : a.total_calls
        const bVal = timeRange === 'month' ? b.calls_30d : b.total_calls
        comparison = (aVal || 0) - (bVal || 0)
      } else if (sortBy === 'answer_rate') {
        const aVal = timeRange === 'month' ? a.answer_rate_30d : a.answer_rate
        const bVal = timeRange === 'month' ? b.answer_rate_30d : b.answer_rate
        comparison = (aVal || 0) - (bVal || 0)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Determine which fields to use based on time range
  const getEmailSentField = () => timeRange === 'month' ? 'emails_sent_30d' : 'total_sent'
  const getEmailRepliedField = () => timeRange === 'month' ? 'emails_replied_30d' : 'total_replied'
  const getReplyRateField = () => timeRange === 'month' ? 'reply_rate_30d' : 'reply_rate'

  const getCallsField = () => timeRange === 'month' ? 'calls_30d' : 'total_calls'
  const getAnsweredCallsField = () => timeRange === 'month' ? 'answered_calls_30d' : 'answered_calls'
  const getDurationField = () => timeRange === 'month' ? 'total_duration_30d' : 'total_duration'
  const getAnswerRateField = () => timeRange === 'month' ? 'answer_rate_30d' : 'answer_rate'

  // Get field names based on current time range
  const emailSentField = getEmailSentField() as keyof AgentStats
  const emailRepliedField = getEmailRepliedField() as keyof AgentStats
  const replyRateField = getReplyRateField() as keyof AgentStats

  // Calculate summary stats - Emails
  const totalSent = agents.reduce((sum, a) => sum + (a[emailSentField] as number || 0), 0)
  const totalReplied = agents.reduce((sum, a) => sum + (a[emailRepliedField] as number || 0), 0)
  const avgReplyRate = agents.length > 0
    ? (agents.reduce((sum, a) => sum + (a[replyRateField] as number || 0), 0) / agents.length).toFixed(1)
    : '0.0'

  // Calculate summary stats - Calls (using time-range aware fields)
  const callsField = getCallsField() as keyof AgentStats
  const answeredCallsField = getAnsweredCallsField() as keyof AgentStats
  const durationField = getDurationField() as keyof AgentStats
  const answerRateField = getAnswerRateField() as keyof AgentStats

  const totalCalls = agents.reduce((sum, a) => sum + (a[callsField] as number || 0), 0)
  const totalAnswered = agents.reduce((sum, a) => sum + (a[answeredCallsField] as number || 0), 0)
  const totalDuration = agents.reduce((sum, a) => sum + (a[durationField] as number || 0), 0)
  const avgCallDuration = totalCalls > 0
    ? Math.round(totalDuration / totalCalls)
    : 0
  const avgAnswerRate = agents.length > 0
    ? (agents.reduce((sum, a) => sum + (a[answerRateField] as number || 0), 0) / agents.length).toFixed(1)
    : '0.0'

  // Format duration to minutes:seconds
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleSort = (field: 'name' | 'sent' | 'reply_rate' | 'calls' | 'answer_rate') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading CRM data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <Card className="p-6 bg-destructive/5 border-l-4 border-destructive">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="text-destructive font-semibold">Error Loading Dashboard</p>
                <p className="text-muted-foreground text-sm mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
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
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Title Section */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">CRM Dashboard</h1>
              <p className="text-muted-foreground mt-1">Monitor team performance and communication metrics</p>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-3">
              <Link href="/crm/analytics">
                <button className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors">
                  Analytics
                </button>
              </Link>
              <Link href="/crm/pipeline">
                <button className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors">
                  Pipeline
                </button>
              </Link>

              <div className="h-6 w-px bg-border mx-1" />

              <button
                onClick={() => downloadAgentsCSV(agents, timeRange)}
                disabled={loading || agents.length === 0}
                className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export CSV"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => downloadAgentsPDF(agents, timeRange)}
                disabled={loading || agents.length === 0}
                className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export PDF"
              >
                <Download className="w-4 h-4 text-muted-foreground" />
              </button>

              <Link href="/">
                <button className="px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors">
                  Calculator
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Time Range and Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                disabled={loading}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${timeRange === option.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAgents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Key Metrics - Professional Style */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Pipeline Value */}
          {pipelineSummary && (
            <Card className="p-6 border-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pipeline Value</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format((pipelineSummary.active_pipeline_value as number) || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {(pipelineSummary.total_active_deals as number) || 0} deals • {((pipelineSummary.overall_conversion_rate as number) || 0).toFixed(1)}% conv
                  </p>
                </div>
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          )}

          {/* Email Metrics */}
          <Card className="p-6 border-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalSent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalReplied} replies • {avgReplyRate}% rate
                </p>
              </div>
              <Mail className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>

          {/* Call Metrics */}
          <Card className="p-6 border-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalCalls.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDuration(avgCallDuration)} avg • {avgAnswerRate}% answer
                </p>
              </div>
              <Phone className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>

          {/* Active Agents */}
          <Card className="p-6 border-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold text-foreground mt-1">{agents.length}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {timeRange === 'month' ? 'Last 30 days' : timeRangeOptions.find(o => o.value === timeRange)?.label}
                </p>
              </div>
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search agents by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-background border text-foreground"
          />
        </div>

        {/* Agents Table - Clean Professional Design */}
        <Card className="border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors"
                    >
                      Agent
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center">
                    <button
                      onClick={() => toggleSort('sent')}
                      className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors mx-auto"
                    >
                      Emails
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-foreground">
                    Replies
                  </th>
                  <th className="px-6 py-3 text-center">
                    <button
                      onClick={() => toggleSort('reply_rate')}
                      className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors mx-auto"
                    >
                      Reply Rate
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center">
                    <button
                      onClick={() => toggleSort('calls')}
                      className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors mx-auto"
                    >
                      Calls
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center">
                    <button
                      onClick={() => toggleSort('answer_rate')}
                      className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors mx-auto"
                    >
                      Answer Rate
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-foreground">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAgents.map((agent, index) => (
                  <tr key={agent.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium text-sm">
                          {agent.aliasName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{agent.aliasName}</p>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-medium text-foreground">{(agent[emailSentField] as number) || 0}</p>
                      <p className="text-xs text-muted-foreground">sent</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-medium text-foreground">{(agent[emailRepliedField] as number) || 0}</p>
                      <p className="text-xs text-muted-foreground">received</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border">
                        {((agent[replyRateField] as number) || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-medium text-foreground">{(agent[callsField] as number) || 0}</p>
                      <p className="text-xs text-muted-foreground">{(agent[answeredCallsField] as number) || 0} answered</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
                        {((agent[answerRateField] as number) || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm text-muted-foreground">{formatDate(agent.last_email_sent)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/crm/agents/${agent.id}`}>
                        <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No agents found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}