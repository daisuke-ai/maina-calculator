'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Mail,
  Phone,
  TrendingUp,
  Eye,
  MousePointer,
  MessageSquare,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Circle,
  LayoutDashboard,
  DollarSign,
  Target
} from 'lucide-react'

interface AgentData {
  id: number
  realName: string
  aliasName: string
  email: string
  phone: string
  performance: {
    agent_id: number
    agent_name: string
    agent_email: string
    total_sent: number
    total_delivered: number
    total_opened: number
    total_clicked: number
    total_replied: number
    open_rate: number
    click_rate: number
    reply_rate: number
    first_email_sent: string
    last_email_sent: string
    last_reply_received: string | null
    avg_hours_to_reply: number | null
  }
  activity30d: {
    emails_sent_30d: number
    emails_opened_30d: number
    emails_replied_30d: number
    reply_rate_30d: number
  }
  emails: Array<{
    property_address: string
    offer_type: string
    offer_price: number
    sent_at: string
    opened: boolean
    opened_at: string | null
    replied: boolean
    replied_at: string | null
    open_count: number
    click_count: number
    hours_to_reply: number | null
    realtor_email_response: string | null
  }>
  replies: Array<{
    from_email: string
    subject: string
    received_at: string
    text_content: string
  }>
}

interface AgentPipelinePerformance {
  active_deals: number
  total_won: number
  total_lost: number
  conversion_rate: number
  total_won_value: number
  active_pipeline_value: number
  avg_days_to_close: number
}

export default function AgentDetailPage() {
  const params = useParams()
  const agentId = params.id as string

  const [agent, setAgent] = useState<AgentData | null>(null)
  const [pipelinePerf, setPipelinePerf] = useState<AgentPipelinePerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAgentData()
    fetchPipelinePerformance()
  }, [agentId])

  const fetchAgentData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/crm/agents/${agentId}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch agent data')
      }

      setAgent(result.agent)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPipelinePerformance = async () => {
    try {
      const response = await fetch(`/api/crm/pipeline/analytics/agents?agent_id=${agentId}`)
      const result = await response.json()

      if (response.ok && result.agents && result.agents.length > 0) {
        setPipelinePerf(result.agents[0])
      }
    } catch (err: any) {
      console.error('Failed to fetch pipeline performance:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateStr: string) => {
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

  const getStatusIcon = (email: AgentData['emails'][0]) => {
    if (email.replied) {
      return <CheckCircle2 className="w-5 h-5 text-accent" />
    }
    if (email.opened) {
      return <Eye className="w-5 h-5 text-muted-foreground" />
    }
    return <Circle className="w-5 h-5 text-muted-foreground opacity-50" />
  }

  const getStatusText = (email: AgentData['emails'][0]) => {
    if (email.replied) return 'Replied'
    if (email.opened) return 'Opened'
    return 'Sent'
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agent data...</p>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <Card className="p-6 bg-destructive/10 border-l-4 border-destructive">
            <p className="text-destructive font-semibold mb-4">Error: {error || 'Agent not found'}</p>
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
        <div className="flex items-center justify-between">
          <Link href="/crm">
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-all shadow-lg border-2 border-border">
              <ArrowLeft className="w-4 h-4" />
              Back to Agents
            </button>
          </Link>
        </div>

        {/* Agent Info Card */}
        <Card className="p-8 bg-card border-2 border-border shadow-xl">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-3xl shadow-lg">
              {agent.aliasName.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">{agent.aliasName}</h1>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-accent" />
                  <span>{agent.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 text-accent" />
                  <span>{agent.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Stats */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">All-Time Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <Mail className="w-5 h-5 text-accent opacity-50" />
              </div>
              <p className="text-3xl font-bold text-foreground">{agent.performance?.total_sent || 0}</p>
            </Card>

            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Opened</p>
                <Eye className="w-5 h-5 text-accent opacity-50" />
              </div>
              <p className="text-3xl font-bold text-foreground">{agent.performance?.total_opened || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {agent.performance?.open_rate?.toFixed(1) || '0.0'}% open rate
              </p>
            </Card>

            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Replied</p>
                <MessageSquare className="w-5 h-5 text-accent opacity-50" />
              </div>
              <p className="text-3xl font-bold text-foreground">{agent.performance?.total_replied || 0}</p>
              <p className="text-xs text-accent font-medium mt-1">
                {agent.performance?.reply_rate?.toFixed(1) || '0.0'}% reply rate
              </p>
            </Card>

            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <Clock className="w-5 h-5 text-accent opacity-50" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {agent.performance?.avg_hours_to_reply?.toFixed(1) || 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">hours</p>
            </Card>
          </div>
        </div>

        {/* 30-Day Activity */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">Last 30 Days</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <p className="text-sm text-muted-foreground mb-2">Emails Sent</p>
              <p className="text-2xl font-bold text-foreground">{agent.activity30d?.emails_sent_30d || 0}</p>
            </Card>

            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <p className="text-sm text-muted-foreground mb-2">Opened</p>
              <p className="text-2xl font-bold text-foreground">{agent.activity30d?.emails_opened_30d || 0}</p>
            </Card>

            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <p className="text-sm text-muted-foreground mb-2">Replied</p>
              <p className="text-2xl font-bold text-foreground">{agent.activity30d?.emails_replied_30d || 0}</p>
            </Card>

            <Card className="p-6 bg-card border-2 border-border shadow-xl">
              <p className="text-sm text-muted-foreground mb-2">Reply Rate</p>
              <p className="text-2xl font-bold text-accent">
                {agent.activity30d?.reply_rate_30d?.toFixed(1) || '0.0'}%
              </p>
            </Card>
          </div>
        </div>

        {/* Pipeline Performance */}
        {pipelinePerf && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Pipeline Performance</h2>
              <Link href="/crm/pipeline">
                <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-medium transition-all shadow-lg">
                  <LayoutDashboard className="w-4 h-4" />
                  View Pipeline
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Active Deals</p>
                  <LayoutDashboard className="w-5 h-5 text-green-500 opacity-50" />
                </div>
                <p className="text-3xl font-bold text-foreground">{pipelinePerf.active_deals}</p>
                <p className="text-xs text-green-500 font-medium mt-1">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(pipelinePerf.active_pipeline_value)} value
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Deals Won</p>
                  <CheckCircle2 className="w-5 h-5 text-green-500 opacity-50" />
                </div>
                <p className="text-3xl font-bold text-foreground">{pipelinePerf.total_won}</p>
                <p className="text-xs text-green-500 font-medium mt-1">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(pipelinePerf.total_won_value)} total
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <Target className="w-5 h-5 text-green-500 opacity-50" />
                </div>
                <p className="text-3xl font-bold text-green-500">{pipelinePerf.conversion_rate}%</p>
                <p className="text-xs text-muted-foreground mt-1">{pipelinePerf.total_lost} lost</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Avg Days to Close</p>
                  <Clock className="w-5 h-5 text-green-500 opacity-50" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {pipelinePerf.avg_days_to_close || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">days average</p>
              </Card>
            </div>
          </div>
        )}

        {/* Email History */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">Email History</h2>
          <Card className="bg-card border-2 border-border shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b-2 border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Property</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Offer Type</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Price</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Engagement</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agent.emails.slice(0, 20).map((email, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm text-foreground">{email.property_address}</p>
                        {email.realtor_email_response && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reply from: {email.realtor_email_response}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{email.offer_type}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                        ${email.offer_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(email)}
                          <span className="text-sm text-foreground">{getStatusText(email)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <div className="flex gap-3 justify-center">
                          <span className="text-muted-foreground">
                            {email.open_count} opens
                          </span>
                          {email.click_count > 0 && (
                            <span className="text-accent">
                              {email.click_count} clicks
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatRelativeTime(email.sent_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {agent.emails.length === 0 && (
              <div className="text-center py-16">
                <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg text-muted-foreground">No emails sent yet</p>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Replies */}
        {agent.replies && agent.replies.length > 0 && (
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">
              Recent Replies ({agent.replies.length})
            </h2>
            <div className="space-y-4">
              {agent.replies.slice(0, 5).map((reply, index) => (
                <Card key={index} className="p-6 bg-card border-2 border-border shadow-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-foreground text-lg">{reply.subject}</p>
                      <p className="text-sm text-muted-foreground mt-1">From: {reply.from_email}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(reply.received_at)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg max-h-32 overflow-y-auto border border-border">
                    {reply.text_content || '(No text content)'}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
