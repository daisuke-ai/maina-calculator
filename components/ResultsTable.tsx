'use client'

import { useState } from 'react'
import { OfferResult } from '@/lib/calculator/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { exportToPDF } from '@/lib/pdf-export'
import { exportToExcel } from '@/lib/excel-export'
import { SendLOIModal } from './SendLOIModal'
import {
  Download,
  FileSpreadsheet,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Mail,
  Edit2,
  Check,
  X
} from 'lucide-react'

interface ResultsTableProps {
  offers: OfferResult[]
  propertyAddress?: string
  askingPrice: number
  monthlyRent: number
}

export function ResultsTable({ offers, propertyAddress = 'Property Address', askingPrice, monthlyRent }: ResultsTableProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferResult | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Editable offers state (copy of original offers)
  const [editableOffers, setEditableOffers] = useState<OfferResult[]>(offers)

  // Track which row is being edited: "offer_price", "down_payment", "monthly_payment", "balloon_year", "rehab_cost", or null
  const [editingRow, setEditingRow] = useState<string | null>(null)

  // Track which column (offer index) is being edited
  const [editingColumn, setEditingColumn] = useState<number | null>(null)

  // Temporary edit value
  const [editValue, setEditValue] = useState<string>('')

  const getOfferLabel = (offerType: string) => {
    if (offerType.includes('Owner')) return 'Owner Favored'
    if (offerType.includes('Balanced')) return 'Balanced'
    return 'Buyer Favored'
  }

  const handleSendLOI = (offer: OfferResult) => {
    setSelectedOffer(offer)
    setModalOpen(true)
  }

  const handleEditStart = (row: string, columnIndex: number, currentValue: number) => {
    setEditingRow(row)
    setEditingColumn(columnIndex)
    setEditValue(currentValue.toString())
  }

  const handleEditSave = () => {
    if (editingRow === null || editingColumn === null) return

    const newOffers = [...editableOffers]
    const numValue = parseFloat(editValue)

    if (isNaN(numValue)) {
      handleEditCancel()
      return
    }

    switch (editingRow) {
      case 'offer_price':
        newOffers[editingColumn] = { ...newOffers[editingColumn], final_offer_price: numValue }
        break
      case 'down_payment':
        newOffers[editingColumn] = { ...newOffers[editingColumn], down_payment: numValue }
        break
      case 'monthly_payment':
        newOffers[editingColumn] = { ...newOffers[editingColumn], monthly_payment: numValue }
        break
      case 'balloon_year':
        newOffers[editingColumn] = { ...newOffers[editingColumn], balloon_period: Math.round(numValue) }
        break
      case 'rehab_cost':
        // Minimum $6000 for rehab cost
        newOffers[editingColumn] = { ...newOffers[editingColumn], rehab_cost: Math.max(6000, numValue) }
        break
    }

    setEditableOffers(newOffers)
    setEditingRow(null)
    setEditingColumn(null)
    setEditValue('')
  }

  const handleEditCancel = () => {
    setEditingRow(null)
    setEditingColumn(null)
    setEditValue('')
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
                {editableOffers.map((offer) => {
                  const colors = getOfferColorScheme(offer.offer_type)
                  return (
                    <th key={offer.offer_type} className={`text-center py-4 px-4 min-w-[180px] ${colors.headerBg} border-l border-border`}>
                      <span className={`text-sm font-bold ${colors.headerText}`}>{getOfferLabel(offer.offer_type)}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {/* Key Metrics Section */}
              <tr className="bg-muted">
                <td colSpan={editableOffers.length + 1} className="py-2.5 px-4 text-xs font-bold text-foreground uppercase tracking-wide border-r border-border">
                  Key Metrics
                </td>
              </tr>

              {/* Deal Viability Status */}
              <tr className="border-b-2 border-border">
                <td className="py-4 px-4 font-bold text-foreground sticky left-0 bg-background border-r border-border">
                  Deal Status
                </td>
                {editableOffers.map((offer) => {
                  const viability = offer.deal_viability
                  let icon, bgColor, textColor, statusLabel

                  if (viability === 'not_viable') {
                    icon = <XCircle className="w-5 h-5" />
                    bgColor = 'bg-red-500/10'
                    textColor = 'text-red-500'
                    statusLabel = 'Not Viable'
                  } else if (viability === 'marginal') {
                    icon = <AlertTriangle className="w-5 h-5" />
                    bgColor = 'bg-yellow-500/10'
                    textColor = 'text-yellow-500'
                    statusLabel = 'Marginal'
                  } else {
                    icon = <CheckCircle2 className="w-5 h-5" />
                    bgColor = 'bg-accent/10'
                    textColor = 'text-accent'
                    statusLabel = 'Good Deal'
                  }

                  return (
                    <td key={offer.offer_type} className="py-4 px-4 border-l border-border">
                      <div className={`flex flex-col items-center gap-2 ${bgColor} rounded-lg p-3`}>
                        <div className={`flex items-center gap-2 ${textColor}`}>
                          {icon}
                          <span className="font-bold text-sm">{statusLabel}</span>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          {offer.viability_reasons.map((reason, idx) => (
                            <div key={idx} className="mt-1">{reason}</div>
                          ))}
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>

              {/* Editable: Offer Price */}
              <tr className="border-b border-border bg-accent/5 border-l-4 border-l-accent">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border flex items-center gap-2">
                  <span>Offer Price</span>
                  <span className="text-xs text-white font-normal">(Editable)</span>
                </td>
                {editableOffers.map((offer, idx) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center border-l border-border">
                    {editingRow === 'offer_price' && editingColumn === idx ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave()
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                          className="w-24 px-2 py-1 text-sm border-2 border-accent rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <button onClick={handleEditSave} className="p-1 text-accent rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleEditCancel} className="p-1 text-muted-foreground rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-foreground">{formatCurrency(offer.final_offer_price)}</span>
                        <button
                          onClick={() => handleEditStart('offer_price', idx, offer.final_offer_price)}
                          className="p-1 text-accent rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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
                <td colSpan={editableOffers.length + 1} className="py-2.5 px-4 text-xs font-bold text-foreground uppercase tracking-wide border-r border-border">
                  Financial Structure
                </td>
              </tr>

              {/* Editable: Down Payment */}
              <tr className="border-b border-border bg-accent/5 border-l-4 border-l-accent">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border flex items-center gap-2">
                  <span>Down Payment</span>
                  <span className="text-xs text-white font-normal">(Editable)</span>
                </td>
                {editableOffers.map((offer, idx) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center border-l border-border">
                    {editingRow === 'down_payment' && editingColumn === idx ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave()
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                          className="w-24 px-2 py-1 text-sm border-2 border-accent rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <button onClick={handleEditSave} className="p-1 text-accent rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleEditCancel} className="p-1 text-muted-foreground rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{formatCurrency(offer.down_payment)}</span>
                          <button
                            onClick={() => handleEditStart('down_payment', idx, offer.down_payment)}
                            className="p-1 text-accent rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{formatPercentage(offer.down_payment_percent)}</div>
                      </div>
                    )}
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

              {/* Editable: Monthly Payment */}
              <tr className="border-b-2 border-border bg-accent/5 border-l-4 border-l-accent">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border flex items-center gap-2">
                  <span>Monthly Payment</span>
                  <span className="text-xs text-white font-normal">(Editable)</span>
                </td>
                {editableOffers.map((offer, idx) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center border-l border-border">
                    {editingRow === 'monthly_payment' && editingColumn === idx ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave()
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                          className="w-24 px-2 py-1 text-sm border-2 border-accent rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <button onClick={handleEditSave} className="p-1 text-accent rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleEditCancel} className="p-1 text-muted-foreground rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-foreground">{formatCurrency(offer.monthly_payment)}</span>
                        <button
                          onClick={() => handleEditStart('monthly_payment', idx, offer.monthly_payment)}
                          className="p-1 text-accent rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* Timeline & Exit Section */}
              <tr className="bg-muted">
                <td colSpan={editableOffers.length + 1} className="py-2.5 px-4 text-xs font-bold text-foreground uppercase tracking-wide border-r border-border">
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

              {/* Editable: Balloon Period */}
              <tr className="border-b border-border bg-accent/5 border-l-4 border-l-accent">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border flex items-center gap-2">
                  <span>Balloon Period</span>
                  <span className="text-xs text-white font-normal">(Editable)</span>
                </td>
                {editableOffers.map((offer, idx) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center border-l border-border">
                    {editingRow === 'balloon_year' && editingColumn === idx ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave()
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                          className="w-20 px-2 py-1 text-sm border-2 border-accent rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <span className="text-sm text-foreground">years</span>
                        <button onClick={handleEditSave} className="p-1 text-accent rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleEditCancel} className="p-1 text-muted-foreground rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-foreground">{offer.balloon_period} years</span>
                        <button
                          onClick={() => handleEditStart('balloon_year', idx, offer.balloon_period)}
                          className="p-1 text-accent rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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
                <td colSpan={editableOffers.length + 1} className="py-2.5 px-4 text-xs font-bold text-foreground uppercase tracking-wide border-r border-border">
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

              {/* Editable: Rehab Cost (min $6000) */}
              {editableOffers.some(o => o.rehab_cost > 0) && (
                <tr className="border-b border-border bg-accent/5 border-l-4 border-l-accent">
                  <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border flex items-center gap-2">
                    <span>Rehab Cost</span>
                    <span className="text-xs text-white font-normal">(Editable, min $6K)</span>
                  </td>
                  {editableOffers.map((offer, idx) => (
                    <td key={offer.offer_type} className="py-3 px-4 text-center border-l border-border">
                      {editingRow === 'rehab_cost' && editingColumn === idx ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSave()
                              if (e.key === 'Escape') handleEditCancel()
                            }}
                            min="6000"
                            className="w-24 px-2 py-1 text-sm border-2 border-accent rounded bg-background text-foreground"
                            autoFocus
                          />
                          <button
                            onClick={handleEditSave}
                            className="p-1 text-accent rounded hover:bg-accent/10"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-1 text-muted-foreground rounded hover:bg-muted"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-semibold text-muted-foreground">
                            {offer.rehab_cost > 0 ? formatCurrency(offer.rehab_cost) : '—'}
                          </span>
                          {offer.rehab_cost > 0 && (
                            <button
                              onClick={() => handleEditStart('rehab_cost', idx, offer.rehab_cost)}
                              className="p-1 text-accent rounded hover:bg-accent/10"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Send LOI Buttons Row */}
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="py-4 px-4 font-semibold text-foreground sticky left-0 bg-muted/30 border-r border-border">
                  Actions
                </td>
                {editableOffers.map((offer) => (
                  <td key={offer.offer_type} className="py-4 px-4 text-center border-l border-border">
                    <button
                      onClick={() => handleSendLOI(offer)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-foreground text-sm font-semibold rounded-lg hover:bg-accent/90 hover:shadow-lg transition-all duration-200 hover:scale-105 mx-auto"
                    >
                      <Mail className="w-4 h-4" />
                      Send LOI
                    </button>
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Send LOI Modal */}
      {selectedOffer && (
        <SendLOIModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          offer={selectedOffer}
          propertyAddress={propertyAddress}
          askingPrice={askingPrice}
          monthlyRent={monthlyRent}
        />
      )}
    </div>
  )
}
