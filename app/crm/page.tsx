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
  ChevronRight
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
  const [sortBy, setSortBy] = useState<'name' | 'sent' | 'reply_rate'>('reply_rate')
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

  const toggleSort = (field: 'name' | 'sent' | 'reply_rate') => {
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-t-2 border-accent/30 mx-auto" style={{ animationDirection: 'reverse' }}></div>
          </div>
          <p className="text-muted-foreground mt-6 text-lg">Loading CRM data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <Card className="p-8 bg-destructive/5 backdrop-blur border-2 border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive mt-0.5" />
              <div>
                <p className="text-destructive font-semibold text-lg">Error Loading Dashboard</p>
                <p className="text-muted-foreground mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg font-medium transition-all"
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
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Modern Header Section */}
      <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border-b border-border/50">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Title Section */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-xl">
                  <Users className="w-6 h-6 text-accent-foreground" />
                </div>
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight">CRM Dashboard</h1>
              </div>
              <p className="text-muted-foreground text-lg pl-15">Track team performance and communication metrics</p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Quick Actions */}
              <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl">
                <Link href="/crm/analytics">
                  <button className="flex items-center gap-2 px-4 py-2.5 hover:bg-background rounded-lg font-medium transition-all group">
                    <BarChart3 className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                    <span>Analytics</span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </button>
                </Link>
                <Link href="/crm/pipeline">
                  <button className="flex items-center gap-2 px-4 py-2.5 hover:bg-background rounded-lg font-medium transition-all group">
                    <LayoutDashboard className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                    <span>Pipeline</span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </button>
                </Link>
              </div>

              {/* Export Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadAgentsCSV(agents, timeRange)}
                  disabled={loading || agents.length === 0}
                  className="p-2.5 hover:bg-muted rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  title="Export CSV"
                >
                  <FileText className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
                <button
                  onClick={() => downloadAgentsPDF(agents, timeRange)}
                  disabled={loading || agents.length === 0}
                  className="p-2.5 hover:bg-muted rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  title="Export PDF"
                >
                  <Download className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>

              {/* Calculator Link */}
              <Link href="/">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-background hover:bg-muted border-2 border-border rounded-xl font-medium transition-all shadow-sm hover:shadow-lg group">
                  <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Calculator
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Time Range Pills */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-2xl backdrop-blur">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                disabled={loading}
                className={`
                  relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                  ${timeRange === option.value
                    ? 'bg-background text-foreground shadow-lg scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {timeRange === option.value && (
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/10 rounded-xl" />
                )}
                <span className="relative">{option.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={fetchAgents}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-background hover:bg-muted border border-border rounded-xl font-medium transition-all shadow-sm hover:shadow-lg group disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Active Pipeline Card */}
          {pipelineSummary && (
            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent border-emerald-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl" />
              <div className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <Target className="w-6 h-6 text-emerald-500" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
                    {((pipelineSummary.overall_conversion_rate as number) || 0).toFixed(1)}% Conv.
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Pipeline</p>
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format((pipelineSummary.active_pipeline_value as number) || 0)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Activity className="w-3 h-3" />
                    <span>{(pipelineSummary.total_active_deals as number) || 0} active deals</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Email Performance Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl" />
            <div className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Mail className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-500/10 px-2 py-1 rounded-full">
                  {avgReplyRate}% Reply
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email Outreach</p>
                <p className="text-3xl font-bold text-foreground mb-1">{totalSent.toLocaleString()}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {totalReplied} replies
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Call Performance Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border-purple-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
            <div className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Phone className="w-6 h-6 text-purple-500" />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-500/10 px-2 py-1 rounded-full">
                  {avgAnswerRate}% Answer
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Call Activity</p>
                <p className="text-3xl font-bold text-foreground mb-1">{totalCalls.toLocaleString()}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(avgCallDuration)} avg
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Team Performance Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl" />
            <div className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <Award className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">
                  {timeRange === 'month' ? '30 Days' : timeRangeOptions.find(o => o.value === timeRange)?.label}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Agents</p>
                <p className="text-3xl font-bold text-foreground mb-1">{agents.length}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3" />
                  <span>Team members tracked</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search agents by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-background/50 backdrop-blur border-2 border-border/50 text-foreground text-base rounded-xl focus:border-accent/50 transition-all shadow-sm"
          />
        </div>

        {/* Agents Table - Modern Design */}
        <Card className="bg-background/50 backdrop-blur border border-border/50 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-muted/80 to-muted/60 border-b border-border/50">
                <tr>
                  <th className="px-6 py-5 text-left">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-accent transition-colors group"
                    >
                      <span>Agent</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                    </button>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <button
                      onClick={() => toggleSort('sent')}
                      className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-accent transition-colors mx-auto group"
                    >
                      <span>Emails</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                    </button>
                  </th>
                  <th className="px-6 py-5 text-center font-semibold text-sm text-foreground">
                    <span className="flex items-center gap-2 justify-center">
                      <MessageSquare className="w-3.5 h-3.5 opacity-50" />
                      Replies
                    </span>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <button
                      onClick={() => toggleSort('reply_rate')}
                      className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-accent transition-colors mx-auto group"
                    >
                      <span>Reply Rate</span>
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                    </button>
                  </th>
                  <th className="px-6 py-5 text-center font-semibold text-sm text-foreground">
                    <span className="flex items-center gap-2 justify-center">
                      <Phone className="w-3.5 h-3.5 opacity-50" />
                      Calls
                    </span>
                  </th>
                  <th className="px-6 py-5 text-center font-semibold text-sm text-foreground">Answer Rate</th>
                  <th className="px-6 py-5 text-center font-semibold text-sm text-foreground">Last Active</th>
                  <th className="px-6 py-5 text-center font-semibold text-sm text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredAgents.map((agent, index) => (
                  <tr key={agent.id} className="hover:bg-muted/30 transition-all duration-200 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center text-accent font-semibold text-lg shadow-sm group-hover:shadow-lg transition-all">
                            {agent.aliasName.charAt(0)}
                          </div>
                          {agent.last_email_sent && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{agent.aliasName}</p>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-center">
                        <p className="font-semibold text-lg text-foreground">{(agent[emailSentField] as number) || 0}</p>
                        <p className="text-xs text-muted-foreground">sent</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-center">
                        <p className="font-semibold text-lg text-foreground">{(agent[emailRepliedField] as number) || 0}</p>
                        <p className="text-xs text-muted-foreground">received</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-600 border border-blue-500/30">
                        {((agent[replyRateField] as number) || 0).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-center">
                        <p className="font-semibold text-lg text-foreground">{(agent[callsField] as number) || 0}</p>
                        <p className="text-xs text-muted-foreground">{(agent[answeredCallsField] as number) || 0} answered</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 border border-purple-500/30">
                        {((agent[answerRateField] as number) || 0).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{formatDate(agent.last_email_sent)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Link href={`/crm/agents/${agent.id}`}>
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-background hover:bg-muted border border-border rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-lg group">
                          <Eye className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                          View
                          <ArrowRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-16 px-4">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No agents found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}