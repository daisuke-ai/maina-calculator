'use client'

import { OfferResult } from '@/lib/calculator/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { exportToPDF } from '@/lib/pdf-export'
import { exportToExcel } from '@/lib/excel-export'
import {
  Download,
  FileSpreadsheet,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface ResultsTableProps {
  offers: OfferResult[]
  propertyAddress?: string
}

export function ResultsTable({ offers, propertyAddress = 'Property Address' }: ResultsTableProps) {
  const getOfferLabel = (offerType: string) => {
    if (offerType.includes('Owner')) return 'Owner Favored'
    if (offerType.includes('Balanced')) return 'Balanced'
    return 'Buyer Favored'
  }

  const getOfferColorScheme = (offerType: string) => {
    if (offerType.includes('Owner')) return {
      headerBg: 'bg-muted',
      headerBorder: 'border-border',
      headerText: 'text-foreground',
      badgeBg: 'bg-secondary',
      badgeText: 'text-secondary-foreground'
    }
    if (offerType.includes('Balanced')) return {
      headerBg: 'bg-accent/10',
      headerBorder: 'border-accent',
      headerText: 'text-foreground',
      badgeBg: 'bg-accent',
      badgeText: 'text-accent-foreground'
    }
    return {
      headerBg: 'bg-muted',
      headerBorder: 'border-border',
      headerText: 'text-foreground',
      badgeBg: 'bg-secondary',
      badgeText: 'text-secondary-foreground'
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Investment Analysis</h2>
            <p className="text-xs text-muted-foreground">Three offer scenarios compared</p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF(offers, propertyAddress)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary border-2 border-border rounded-lg text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 hover:border-ring hover:shadow-md transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => exportToExcel(offers, propertyAddress)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary border-2 border-border rounded-lg text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 hover:border-ring hover:shadow-md transition-all duration-200"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Compact Horizontal Table */}
      <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-4 px-4 font-bold text-foreground min-w-[180px] sticky left-0 bg-muted z-10 border-r border-border">
                  Metric
                </th>
                {offers.map((offer) => {
                  const colors = getOfferColorScheme(offer.offer_type)
                  return (
                    <th key={offer.offer_type} className={`text-center py-4 px-4 min-w-[160px] ${colors.headerBg} border-l border-border`}>
                      <div className="flex flex-col items-center gap-2">
                        <span className={`text-sm font-bold ${colors.headerText}`}>{getOfferLabel(offer.offer_type)}</span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {/* Key Metrics Section */}
              <tr className="bg-muted">
                <td colSpan={offers.length + 1} className="py-2.5 px-4 text-xs font-bold text-foreground uppercase tracking-wide border-r border-border">
                  Key Metrics
                </td>
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Offer Price</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-bold text-foreground border-l border-border">
                    {formatCurrency(offer.final_offer_price)}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Entry Fee</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center border-l border-border">
                    <div className="font-bold text-foreground">{formatCurrency(offer.final_entry_fee_amount)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{formatPercentage(offer.final_entry_fee_percent)}</div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border hover:bg-accent/10 transition-colors bg-accent/5">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border">Monthly Cash Flow</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-bold text-accent border-l border-border">
                    {formatCurrency(offer.final_monthly_cash_flow)}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border hover:bg-accent/10 transition-colors bg-accent/5">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border">Cash on Cash ROI</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-bold text-accent border-l border-border">
                    {formatPercentage(offer.final_coc_percent)}
                  </td>
                ))}
              </tr>

              <tr className="border-b-2 border-border hover:bg-accent/10 transition-colors bg-accent/5">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border">Net Rental Yield</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-bold text-accent border-l border-border">
                    {formatPercentage(offer.net_rental_yield)}
                  </td>
                ))}
              </tr>

              {/* Financial Structure Section */}
              <tr className="bg-muted">
                <td colSpan={offers.length + 1} className="py-2.5 px-4 text-xs font-bold text-foreground uppercase tracking-wide border-r border-border">
                  Financial Structure
                </td>
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Down Payment</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center border-l border-border">
                    <div className="font-bold text-foreground">{formatCurrency(offer.down_payment)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{formatPercentage(offer.down_payment_percent)}</div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Loan Amount</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-semibold text-foreground border-l border-border">
                    {formatCurrency(offer.loan_amount)}
                  </td>
                ))}
              </tr>

              <tr className="border-b-2 border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Monthly Payment</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-semibold text-foreground border-l border-border">
                    {formatCurrency(offer.monthly_payment)}
                  </td>
                ))}
              </tr>

              {/* Timeline & Exit Section */}
              <tr className="bg-muted">
                <td colSpan={offers.length + 1} className="py-2.5 px-4 text-xs font-bold text-foreground uppercase tracking-wide border-r border-border">
                  Timeline & Exit Strategy
                </td>
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Amortization Period</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-semibold text-foreground border-l border-border">
                    {offer.amortization_years.toFixed(1)} years
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Balloon Period</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-semibold text-foreground border-l border-border">
                    {offer.balloon_period} years
                  </td>
                ))}
              </tr>

              <tr className="border-b-2 border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Balloon Payment</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-bold text-foreground border-l border-border">
                    {formatCurrency(offer.balloon_payment)}
                  </td>
                ))}
              </tr>

              {/* Profit Potential Section */}
              <tr className="bg-muted">
                <td colSpan={offers.length + 1} className="py-2.5 px-4 text-xs font-bold text-foreground uppercase tracking-wide border-r border-border">
                  Profit Potential
                </td>
              </tr>

              <tr className="border-b border-border hover:bg-accent/10 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Appreciation Profit</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-bold text-accent border-l border-border">
                    {formatCurrency(offer.appreciation_profit)}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Principal Paid</td>
                {offers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-semibold text-foreground border-l border-border">
                    {formatCurrency(offer.principal_paid)}
                  </td>
                ))}
              </tr>

              {/* Rehab Cost if applicable */}
              {offers.some(o => o.rehab_cost > 0) && (
                <tr className="border-b border-border hover:bg-muted/50 transition-colors bg-muted/30">
                  <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-muted/30 border-r border-border">Rehab Cost</td>
                  {offers.map((offer) => (
                    <td key={offer.offer_type} className="py-3 px-4 text-center font-semibold text-muted-foreground border-l border-border">
                      {offer.rehab_cost > 0 ? formatCurrency(offer.rehab_cost) : '—'}
                    </td>
                  ))}
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
