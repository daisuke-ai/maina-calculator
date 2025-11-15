// lib/export-reports.ts
// Utility functions for exporting CRM reports in CSV and PDF formats

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
}

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

interface TopAgent {
  agent_id: number
  agent_name: string
  total_sent: number
  total_opened: number
  total_replied: number
  reply_rate: number
}

interface DailyVolume {
  date: string
  emails_sent: number
  emails_opened: number
  emails_replied: number
  active_agents: number
}

// CSV Export Functions

export function downloadAgentsCSV(agents: AgentStats[], timeRange: string) {
  const headers = [
    'Agent Name',
    'Email',
    'Phone',
    'Total Sent',
    'Total Opened',
    'Open Rate %',
    'Total Replied',
    'Reply Rate %',
    'Last 30d Sent',
    'Last 30d Replied',
    'Last Email Sent'
  ]

  const rows = agents.map(agent => [
    agent.aliasName,
    agent.email,
    agent.phone,
    agent.total_sent,
    agent.total_opened,
    agent.open_rate?.toFixed(1) || '0.0',
    agent.total_replied,
    agent.reply_rate?.toFixed(1) || '0.0',
    agent.emails_sent_30d,
    agent.emails_replied_30d,
    agent.last_email_sent ? new Date(agent.last_email_sent).toLocaleDateString() : 'Never'
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  downloadCSV(csv, `agents-report-${timeRange}-${getDateString()}.csv`)
}

export function downloadAnalyticsCSV(
  offerTypes: OfferTypeStats[],
  topAgents: TopAgent[],
  dailyVolume: DailyVolume[],
  timeRange: string
) {
  let csv = ''

  // Offer Types Section
  csv += 'OFFER TYPE PERFORMANCE\n'
  csv += 'Offer Type,Sent,Opened,Open Rate %,Replied,Reply Rate %,Avg Offer Price,Avg Down Payment,Avg Monthly Payment\n'
  offerTypes.forEach(offer => {
    csv += `"${offer.offer_type}",${offer.total_sent},${offer.total_opened},${offer.open_rate?.toFixed(1) || '0.0'},${offer.total_replied},${offer.reply_rate?.toFixed(1) || '0.0'},$${offer.avg_offer_price.toLocaleString()},$${offer.avg_down_payment.toLocaleString()},$${offer.avg_monthly_payment.toLocaleString()}\n`
  })

  csv += '\n'

  // Top Agents Section
  csv += 'TOP PERFORMING AGENTS\n'
  csv += 'Rank,Agent Name,Sent,Opened,Replied,Reply Rate %\n'
  topAgents.forEach((agent, index) => {
    csv += `${index + 1},"${agent.agent_name}",${agent.total_sent},${agent.total_opened},${agent.total_replied},${agent.reply_rate?.toFixed(1) || '0.0'}\n`
  })

  csv += '\n'

  // Daily Volume Section
  csv += 'DAILY EMAIL VOLUME (Last 7 Days)\n'
  csv += 'Date,Emails Sent,Opened,Replied,Active Agents\n'
  dailyVolume.slice(0, 7).forEach(day => {
    csv += `${new Date(day.date).toLocaleDateString()},${day.emails_sent},${day.emails_opened},${day.emails_replied},${day.active_agents}\n`
  })

  downloadCSV(csv, `analytics-report-${timeRange}-${getDateString()}.csv`)
}

// PDF Export Functions

export function downloadAgentsPDF(agents: AgentStats[], timeRange: string) {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text('CRM Agent Performance Report', 14, 20)

  // Metadata
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Time Range: ${formatTimeRangeLabel(timeRange)}`, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34)

  // Summary Stats
  const totalSent = agents.reduce((sum, a) => sum + a.total_sent, 0)
  const totalOpened = agents.reduce((sum, a) => sum + a.total_opened, 0)
  const totalReplied = agents.reduce((sum, a) => sum + a.total_replied, 0)
  const avgReplyRate = agents.length > 0
    ? (agents.reduce((sum, a) => sum + (a.reply_rate || 0), 0) / agents.length).toFixed(1)
    : '0.0'

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('Summary', 14, 44)

  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text(`Total Agents: ${agents.length}`, 14, 52)
  doc.text(`Total Emails: ${totalSent.toLocaleString()}`, 14, 58)
  doc.text(`Total Replies: ${totalReplied}`, 14, 64)
  doc.text(`Average Reply Rate: ${avgReplyRate}%`, 14, 70)

  // Agent Table
  const tableData = agents.map(agent => [
    agent.aliasName,
    agent.total_sent,
    agent.total_opened,
    `${agent.open_rate?.toFixed(1) || '0.0'}%`,
    agent.total_replied,
    `${agent.reply_rate?.toFixed(1) || '0.0'}%`,
    agent.emails_sent_30d,
    agent.last_email_sent ? new Date(agent.last_email_sent).toLocaleDateString() : 'Never'
  ])

  autoTable(doc, {
    startY: 78,
    head: [['Agent', 'Sent', 'Opened', 'Open %', 'Replied', 'Reply %', '30d Sent', 'Last Active']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80], // Green
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'center', cellWidth: 15 },
      6: { halign: 'center', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 25 }
    }
  })

  doc.save(`agents-report-${timeRange}-${getDateString()}.pdf`)
}

export function downloadAnalyticsPDF(
  offerTypes: OfferTypeStats[],
  topAgents: TopAgent[],
  dailyVolume: DailyVolume[],
  timeRange: string
) {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text('CRM Analytics Report', 14, 20)

  // Metadata
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Time Range: ${formatTimeRangeLabel(timeRange)}`, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34)

  let currentY = 44

  // Offer Type Performance Section
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Offer Type Performance', 14, currentY)
  currentY += 8

  const offerTypeData = offerTypes.map(offer => [
    offer.offer_type,
    offer.total_sent,
    offer.total_opened,
    `${offer.open_rate?.toFixed(1) || '0.0'}%`,
    offer.total_replied,
    `${offer.reply_rate?.toFixed(1) || '0.0'}%`,
    `$${offer.avg_offer_price.toLocaleString()}`
  ])

  autoTable(doc, {
    startY: currentY,
    head: [['Offer Type', 'Sent', 'Opened', 'Open %', 'Replied', 'Reply %', 'Avg Price']],
    body: offerTypeData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    }
  })

  currentY = (doc as any).lastAutoTable.finalY + 15

  // Top Agents Section
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Top Performing Agents', 14, currentY)
  currentY += 8

  const topAgentData = topAgents.slice(0, 10).map((agent, index) => [
    index + 1,
    agent.agent_name,
    agent.total_sent,
    agent.total_opened,
    agent.total_replied,
    `${agent.reply_rate?.toFixed(1) || '0.0'}%`
  ])

  autoTable(doc, {
    startY: currentY,
    head: [['Rank', 'Agent', 'Sent', 'Opened', 'Replied', 'Reply %']],
    body: topAgentData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    }
  })

  currentY = (doc as any).lastAutoTable.finalY + 15

  // Daily Volume Section (if it fits on page, otherwise new page)
  if (currentY > 220) {
    doc.addPage()
    currentY = 20
  }

  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Recent Activity (Last 7 Days)', 14, currentY)
  currentY += 8

  const dailyVolumeData = dailyVolume.slice(0, 7).map(day => [
    new Date(day.date).toLocaleDateString(),
    day.emails_sent,
    day.emails_opened,
    day.emails_replied,
    day.active_agents
  ])

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Sent', 'Opened', 'Replied', 'Active Agents']],
    body: dailyVolumeData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    }
  })

  doc.save(`analytics-report-${timeRange}-${getDateString()}.pdf`)
}

// Helper Functions

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function getDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTimeRangeLabel(range: string): string {
  const labels: { [key: string]: string } = {
    'week': 'Last Week',
    'month': 'Last Month',
    'quarter': 'Last Quarter',
    'year': 'Last Year',
    'all': 'All Time'
  }
  return labels[range] || range
}
