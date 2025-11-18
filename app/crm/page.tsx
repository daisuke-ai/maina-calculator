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
  Clock
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
    fetchPipelineSummary()
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

  const fetchPipelineSummary = async () => {
    try {
      const response = await fetch('/api/crm/pipeline/analytics/summary?days_back=30')
      const result = await response.json()

      if (response.ok && result.summary) {
        setPipelineSummary(result.summary.allTime)
      }
    } catch (err: any) {
      console.error('Failed to fetch pipeline summary:', err)
    }
  }

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ]

  // Filter and sort agents
  const filteredAgents = agents
    .filter(agent => {
      const searchLower = searchTerm.toLowerCase()
      return (
        agent.aliasName.toLowerCase().includes(searchLower) ||
        agent.realName.toLowerCase().includes(searchLower) ||
        agent.email.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      let aVal, bVal

      switch (sortBy) {
        case 'name':
          aVal = a.aliasName
          bVal = b.aliasName
          break
        case 'sent':
          aVal = a.total_sent
          bVal = b.total_sent
          break
        case 'reply_rate':
          aVal = a.reply_rate || 0
          bVal = b.reply_rate || 0
          break
        default:
          return 0
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal)
      } else {
        return sortOrder === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal
      }
    })

  // Calculate summary stats - Emails
  const totalSent = agents.reduce((sum, a) => sum + a.total_sent, 0)
  const totalReplied = agents.reduce((sum, a) => sum + a.total_replied, 0)
  const avgReplyRate = agents.length > 0
    ? (agents.reduce((sum, a) => sum + (a.reply_rate || 0), 0) / agents.length).toFixed(1)
    : '0.0'

  // Calculate summary stats - Calls
  const totalCalls = agents.reduce((sum, a) => sum + (a.total_calls || 0), 0)
  const totalAnswered = agents.reduce((sum, a) => sum + (a.answered_calls || 0), 0)
  const totalDuration = agents.reduce((sum, a) => sum + (a.total_duration || 0), 0)
  const avgCallDuration = totalCalls > 0
    ? Math.round(totalDuration / totalCalls)
    : 0
  const avgAnswerRate = agents.length > 0
    ? (agents.reduce((sum, a) => sum + (a.answer_rate || 0), 0) / agents.length).toFixed(1)
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
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading CRM data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <Card className="p-6 bg-destructive/10 border-l-4 border-destructive">
            <p className="text-destructive font-semibold">Error: {error}</p>
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
              <Users className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2">CRM Dashboard</h1>
            <p className="text-lg text-muted-foreground">Track agent performance and email analytics</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/">
              <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border">
                <ExternalLink className="w-4 h-4" />
                Calculator
              </button>
            </Link>
            <Link href="/crm/analytics">
              <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-medium transition-all shadow-lg">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
            </Link>
            <Link href="/crm/pipeline">
              <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-medium transition-all shadow-lg">
                <LayoutDashboard className="w-4 h-4" />
                Pipeline
              </button>
            </Link>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => downloadAgentsCSV(agents, timeRange)}
                disabled={loading || agents.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download CSV Report"
              >
                <FileText className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => downloadAgentsPDF(agents, timeRange)}
                disabled={loading || agents.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download PDF Report"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Email Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card border-2 border-border shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Emails Sent</p>
                <p className="text-3xl font-bold text-foreground">{totalSent.toLocaleString()}</p>
              </div>
              <Mail className="w-10 h-10 text-accent opacity-30" />
            </div>
          </Card>

          <Card className="p-6 bg-card border-2 border-border shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Replies</p>
                <p className="text-3xl font-bold text-foreground">{totalReplied}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-accent opacity-30" />
            </div>
          </Card>

          <Card className="p-6 bg-card border-2 border-border shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Reply Rate</p>
                <p className="text-3xl font-bold text-accent">{avgReplyRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-accent opacity-30" />
            </div>
          </Card>
        </div>

        {/* Call Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Calls</p>
                <p className="text-3xl font-bold text-foreground">{totalCalls.toLocaleString()}</p>
              </div>
              <Phone className="w-10 h-10 text-blue-500 opacity-40" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Calls Answered</p>
                <p className="text-3xl font-bold text-foreground">{totalAnswered.toLocaleString()}</p>
              </div>
              <PhoneIncoming className="w-10 h-10 text-blue-500 opacity-40" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Answer Rate</p>
                <p className="text-3xl font-bold text-blue-500">{avgAnswerRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500 opacity-40" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-500/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Call Duration</p>
                <p className="text-3xl font-bold text-foreground">{formatDuration(avgCallDuration)}</p>
                <p className="text-xs text-muted-foreground mt-1">min:sec</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500 opacity-40" />
            </div>
          </Card>
        </div>

        {/* Pipeline Summary Stats */}
        {pipelineSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Pipeline</p>
                  <p className="text-3xl font-bold text-foreground">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(pipelineSummary.active_pipeline_value)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pipelineSummary.total_active_deals} deals in pipeline
                  </p>
                </div>
                <LayoutDashboard className="w-10 h-10 text-green-500 opacity-40" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Deals</p>
                  <p className="text-3xl font-bold text-foreground">{pipelineSummary.total_active_deals}</p>
                  <p className="text-xs text-muted-foreground mt-1">Properties under contract</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500 opacity-40" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pipeline Conv. Rate</p>
                  <p className="text-3xl font-bold text-green-500">{pipelineSummary.overall_conversion_rate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">All-time conversion</p>
                </div>
                <BarChart3 className="w-10 h-10 text-green-500 opacity-40" />
              </div>
            </Card>
          </div>
        )}

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

        {/* Search and Filters */}
        <Card className="p-6 bg-card border-2 border-border shadow-xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search agents by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-input border-border text-foreground"
              />
            </div>
            <button
              onClick={fetchAgents}
              className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium transition-all border-2 border-border whitespace-nowrap"
            >
              Refresh Data
            </button>
          </div>
        </Card>

        {/* Agents Table */}
        <Card className="bg-card border-2 border-border shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b-2 border-border">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-accent transition-colors"
                    >
                      Agent
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleSort('sent')}
                      className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-accent transition-colors mx-auto"
                    >
                      Emails Sent
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-sm text-foreground">Replies</th>
                  <th className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleSort('reply_rate')}
                      className="flex items-center gap-2 font-semibold text-sm text-foreground hover:text-accent transition-colors mx-auto"
                    >
                      Reply Rate
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-sm text-foreground">Total Calls</th>
                  <th className="px-6 py-4 text-center font-semibold text-sm text-foreground">Answer Rate</th>
                  <th className="px-6 py-4 text-center font-semibold text-sm text-foreground">Last Active</th>
                  <th className="px-6 py-4 text-center font-semibold text-sm text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAgents.map((agent, index) => (
                  <tr key={agent.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                          {agent.aliasName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{agent.aliasName}</p>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-foreground">
                      {agent.total_sent}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-foreground">
                      {agent.total_replied}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent/20 text-accent border border-accent/30">
                        {agent.reply_rate?.toFixed(1) || '0.0'}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm">
                        <div className="flex items-center justify-center gap-1">
                          <Phone className="w-3 h-3 text-blue-500" />
                          <span className="font-medium text-foreground">{agent.total_calls || 0}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {agent.answered_calls || 0} answered
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-500 border border-blue-500/30">
                        {agent.answer_rate?.toFixed(1) || '0.0'}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                      {formatDate(agent.last_email_sent)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/crm/agents/${agent.id}`}>
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-all border border-border">
                          <Eye className="w-4 h-4" />
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
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-lg text-muted-foreground">
                {searchTerm ? 'No agents found matching your search' : 'No agents available'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}
