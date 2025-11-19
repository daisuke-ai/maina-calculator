'use client'

import { useState, useEffect } from 'react'
import { OfferResult, PropertyData } from '@/lib/calculator/types'
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
  propertyData: PropertyData
}

// Configuration constants matching backend
const CONFIG = {
  closing_cost_percent: 0.02,     // 2% closing cost
  assignment_fee: 5000,            // $5,000 assignment fee
  maintenance_rate: 0.1,           // 10% of rent for maintenance
  management_rate: 0.1,            // 10% of rent for management
  appreciation_rate: 0.045,        // 4.5% annual appreciation
  min_rehab_cost: 6000,           // Minimum $6,000 rehab cost
}

export function ResultsTable({
  offers,
  propertyAddress = 'Property Address',
  askingPrice,
  monthlyRent,
  propertyData
}: ResultsTableProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferResult | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Editable offers state (copy of original offers)
  const [editableOffers, setEditableOffers] = useState<OfferResult[]>(offers)

  // Track which row is being edited
  const [editingRow, setEditingRow] = useState<string | null>(null)

  // Track which column (offer index) is being edited
  const [editingColumn, setEditingColumn] = useState<number | null>(null)

  // Temporary edit value
  const [editValue, setEditValue] = useState<string>('')

  // Reset editable offers when new offers prop comes in
  useEffect(() => {
    setEditableOffers(offers)
    // Also clear any active editing state
    setEditingRow(null)
    setEditingColumn(null)
    setEditValue('')
  }, [offers])

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

  // Calculate non-debt expenses (everything except monthly payment)
  const calculateNonDebtExpenses = (): number => {
    return (
      propertyData.monthly_property_tax +
      propertyData.monthly_insurance +
      propertyData.monthly_hoa_fee +
      propertyData.monthly_other_fees +
      (monthlyRent * CONFIG.maintenance_rate) +  // 10% maintenance
      (monthlyRent * CONFIG.management_rate)     // 10% management
    )
  }

  // Evaluate deal viability based on metrics
  const evaluateDealViability = (
    offerType: string,
    downPayment: number,
    downPaymentPercent: number,
    monthlyCashFlow: number,
    netRentalYield: number,
    amortizationYears: number
  ): { viability: 'good' | 'marginal' | 'not_viable'; reasons: string[] } => {
    const reasons: string[] = []

    // Get target yield range based on offer type
    let minYield: number
    if (offerType.includes('Owner')) {
      minYield = 15.0  // Owner Favored: 15-17%
    } else if (offerType.includes('Balanced')) {
      minYield = 17.0  // Balanced: 17-20%
    } else {
      minYield = 20.0  // Buyer Favored: 20-30%
    }

    // Check for "Not Viable" conditions
    if (downPayment < 0) {
      reasons.push('Negative down payment - deal requires more cash than available')
      return { viability: 'not_viable', reasons }
    }

    if (monthlyCashFlow < 100) {
      reasons.push(`Monthly cash flow too low ($${monthlyCashFlow.toFixed(0)}) - minimum $100 required`)
      return { viability: 'not_viable', reasons }
    }

    if (netRentalYield < minYield - 5) {
      reasons.push(`Net rental yield (${netRentalYield.toFixed(1)}%) is ${(minYield - netRentalYield).toFixed(1)}% below minimum threshold`)
      return { viability: 'not_viable', reasons }
    }

    // Check for "Marginal" conditions
    if (downPaymentPercent < 3) {
      reasons.push(`Low down payment (${downPaymentPercent.toFixed(1)}%) - less than 3% of offer price`)
    }

    if (monthlyCashFlow >= 100 && monthlyCashFlow < 200) {
      reasons.push(`Marginal cash flow ($${monthlyCashFlow.toFixed(0)}/month) - minimum $200 recommended`)
    }

    if (netRentalYield < minYield && netRentalYield >= minYield - 5) {
      reasons.push(`Net rental yield (${netRentalYield.toFixed(1)}%) is below minimum threshold (${minYield}%)`)
    }

    if (amortizationYears > 35) {
      reasons.push(`Very long amortization (${amortizationYears.toFixed(1)} years) - payoff takes over 35 years`)
    }

    if (reasons.length > 0) {
      return { viability: 'marginal', reasons }
    }

    // If no issues, it's a good deal
    reasons.push('All metrics meet or exceed target thresholds')
    return { viability: 'good', reasons }
  }

  // Comprehensive recalculation function
  const recalculateOffer = (offer: OfferResult, editedField: string, newValue: number): OfferResult => {
    const updated = { ...offer }

    // Get non-debt expenses (constant for all calculations)
    const nonDebtExpenses = calculateNonDebtExpenses()

    switch (editedField) {
      case 'offer_price': {
        // User changed offer price
        const offerPrice = newValue
        updated.final_offer_price = offerPrice

        // Recalculate closing cost (2% of offer price)
        const closingCost = offerPrice * CONFIG.closing_cost_percent

        // Recalculate entry fee amount (keeping the same percentage)
        // Entry Fee = Down Payment + Rehab + Closing + Assignment
        // So: Down Payment = Entry Fee - Rehab - Closing - Assignment
        const entryFeeAmount = offerPrice * (updated.final_entry_fee_percent / 100)
        updated.final_entry_fee_amount = entryFeeAmount

        // Recalculate down payment
        const downPayment = entryFeeAmount - updated.rehab_cost - closingCost - CONFIG.assignment_fee
        updated.down_payment = downPayment
        updated.down_payment_percent = (downPayment / offerPrice) * 100

        // Recalculate loan amount
        updated.loan_amount = offerPrice - downPayment

        // Keep the same monthly payment (user didn't change it)
        // But recalculate amortization period
        if (updated.monthly_payment > 0) {
          updated.amortization_years = updated.loan_amount / (updated.monthly_payment * 12)
        }

        // Recalculate cash flow (monthly payment unchanged)
        updated.final_monthly_cash_flow = monthlyRent - nonDebtExpenses - updated.monthly_payment

        // Recalculate net rental yield
        const annualNetIncome = updated.final_monthly_cash_flow * 12
        updated.net_rental_yield = (annualNetIncome / entryFeeAmount) * 100
        updated.final_coc_percent = updated.net_rental_yield // COC same as yield

        // Recalculate balloon payment
        const principalPaid = Math.min(updated.monthly_payment * updated.balloon_period * 12, updated.loan_amount)
        updated.principal_paid = principalPaid
        updated.balloon_payment = Math.max(0, updated.loan_amount - principalPaid)

        // Recalculate appreciation profit
        const futureValue = propertyData.listed_price * Math.pow(1 + CONFIG.appreciation_rate, updated.balloon_period)
        updated.appreciation_profit = futureValue - offerPrice
        break
      }

      case 'down_payment': {
        // User changed down payment directly
        const downPayment = newValue
        updated.down_payment = downPayment
        updated.down_payment_percent = (downPayment / updated.final_offer_price) * 100

        // Recalculate loan amount
        updated.loan_amount = updated.final_offer_price - downPayment

        // Recalculate entry fee (Down Payment + Rehab + Closing + Assignment)
        const closingCost = updated.final_offer_price * CONFIG.closing_cost_percent
        const entryFeeAmount = downPayment + updated.rehab_cost + closingCost + CONFIG.assignment_fee
        updated.final_entry_fee_amount = entryFeeAmount
        updated.final_entry_fee_percent = (entryFeeAmount / updated.final_offer_price) * 100

        // Keep the same monthly payment, but recalculate amortization
        if (updated.monthly_payment > 0) {
          updated.amortization_years = updated.loan_amount / (updated.monthly_payment * 12)
        }

        // Cash flow unchanged (monthly payment unchanged)
        updated.final_monthly_cash_flow = monthlyRent - nonDebtExpenses - updated.monthly_payment

        // Recalculate net rental yield with new entry fee
        const annualNetIncome = updated.final_monthly_cash_flow * 12
        updated.net_rental_yield = (annualNetIncome / entryFeeAmount) * 100
        updated.final_coc_percent = updated.net_rental_yield

        // Recalculate balloon payment with new loan amount
        const principalPaid = Math.min(updated.monthly_payment * updated.balloon_period * 12, updated.loan_amount)
        updated.principal_paid = principalPaid
        updated.balloon_payment = Math.max(0, updated.loan_amount - principalPaid)
        break
      }

      case 'monthly_payment': {
        // User changed monthly payment
        const monthlyPayment = newValue
        updated.monthly_payment = monthlyPayment

        // Recalculate monthly cash flow
        updated.final_monthly_cash_flow = monthlyRent - nonDebtExpenses - monthlyPayment

        // Recalculate net rental yield
        const annualNetIncome = updated.final_monthly_cash_flow * 12
        updated.net_rental_yield = (annualNetIncome / updated.final_entry_fee_amount) * 100
        updated.final_coc_percent = updated.net_rental_yield

        // Recalculate amortization period
        if (monthlyPayment > 0) {
          updated.amortization_years = updated.loan_amount / (monthlyPayment * 12)
        } else {
          updated.amortization_years = Infinity
        }

        // Recalculate principal paid and balloon payment
        const principalPaid = Math.min(monthlyPayment * updated.balloon_period * 12, updated.loan_amount)
        updated.principal_paid = principalPaid
        updated.balloon_payment = Math.max(0, updated.loan_amount - principalPaid)
        break
      }

      case 'balloon_year': {
        // User changed balloon period
        const balloonYears = Math.round(newValue)
        updated.balloon_period = balloonYears

        // Recalculate principal paid during balloon period
        const principalPaid = Math.min(updated.monthly_payment * balloonYears * 12, updated.loan_amount)
        updated.principal_paid = principalPaid

        // Recalculate balloon payment
        updated.balloon_payment = Math.max(0, updated.loan_amount - principalPaid)

        // Recalculate appreciation profit with new balloon period
        const futureValue = propertyData.listed_price * Math.pow(1 + CONFIG.appreciation_rate, balloonYears)
        updated.appreciation_profit = futureValue - updated.final_offer_price
        break
      }

      case 'rehab_cost': {
        // User changed rehab cost
        const rehabCost = Math.max(CONFIG.min_rehab_cost, newValue)
        updated.rehab_cost = rehabCost

        // Recalculate entry fee (Down Payment + Rehab + Closing + Assignment)
        const closingCost = updated.final_offer_price * CONFIG.closing_cost_percent
        const entryFeeAmount = updated.down_payment + rehabCost + closingCost + CONFIG.assignment_fee
        updated.final_entry_fee_amount = entryFeeAmount
        updated.final_entry_fee_percent = (entryFeeAmount / updated.final_offer_price) * 100

        // Cash flow unchanged (doesn't depend on rehab cost)
        // But net rental yield changes because entry fee changed
        const annualNetIncome = updated.final_monthly_cash_flow * 12
        updated.net_rental_yield = (annualNetIncome / entryFeeAmount) * 100
        updated.final_coc_percent = updated.net_rental_yield
        break
      }
    }

    // Recalculate deal viability with new values
    const { viability, reasons } = evaluateDealViability(
      updated.offer_type,
      updated.down_payment,
      updated.down_payment_percent,
      updated.final_monthly_cash_flow,
      updated.net_rental_yield,
      updated.amortization_years
    )

    updated.deal_viability = viability
    updated.viability_reasons = reasons

    return updated
  }

  const handleEditSave = () => {
    if (editingRow === null || editingColumn === null) return

    const numValue = parseFloat(editValue)

    if (isNaN(numValue)) {
      handleEditCancel()
      return
    }

    const newOffers = [...editableOffers]
    // Recalculate the entire offer with dependent values
    newOffers[editingColumn] = recalculateOffer(editableOffers[editingColumn], editingRow, numValue)

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
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border">
                  <div className="flex items-center gap-2">
                    <span>Offer Price</span>
                    <span className="text-xs text-muted-foreground font-normal whitespace-nowrap">(Editable)</span>
                  </div>
                </td>
                {editableOffers.map((offer, idx) => (
                  <td key={offer.offer_type} className="py-3 px-4 border-l border-border">
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
                          className="w-28 px-2 py-1.5 text-sm border-2 border-accent rounded bg-background text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <button onClick={handleEditSave} className="p-1.5 text-accent rounded hover:bg-accent/10 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleEditCancel} className="p-1.5 text-muted-foreground rounded hover:bg-muted transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 min-h-[32px]">
                        <span className="font-bold text-foreground">{formatCurrency(offer.final_offer_price)}</span>
                        <button
                          onClick={() => handleEditStart('offer_price', idx, offer.final_offer_price)}
                          className="p-1 text-accent rounded hover:bg-accent/10 transition-colors flex-shrink-0"
                          title="Edit offer price"
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
                {editableOffers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center border-l border-border">
                    <div className="font-bold text-foreground">{formatCurrency(offer.final_entry_fee_amount)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{formatPercentage(offer.final_entry_fee_percent)}</div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border hover:bg-accent/10 transition-colors bg-accent/5">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border">Monthly Cash Flow</td>
                {editableOffers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-bold text-accent border-l border-border">
                    {formatCurrency(offer.final_monthly_cash_flow)}
                  </td>
                ))}
              </tr>

              <tr className="border-b-2 border-border hover:bg-accent/10 transition-colors bg-accent/5">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border">Net Rental Yield</td>
                {editableOffers.map((offer) => (
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
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border">
                  <div className="flex items-center gap-2">
                    <span>Down Payment</span>
                    <span className="text-xs text-muted-foreground font-normal whitespace-nowrap">(Editable)</span>
                  </div>
                </td>
                {editableOffers.map((offer, idx) => (
                  <td key={offer.offer_type} className="py-3 px-4 border-l border-border">
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
                          className="w-28 px-2 py-1.5 text-sm border-2 border-accent rounded bg-background text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <button onClick={handleEditSave} className="p-1.5 text-accent rounded hover:bg-accent/10 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleEditCancel} className="p-1.5 text-muted-foreground rounded hover:bg-muted transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center gap-1.5 min-h-[32px]">
                          <span className="font-bold text-foreground">{formatCurrency(offer.down_payment)}</span>
                          <button
                            onClick={() => handleEditStart('down_payment', idx, offer.down_payment)}
                            className="p-1 text-accent rounded hover:bg-accent/10 transition-colors flex-shrink-0"
                            title="Edit down payment"
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
                {editableOffers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-semibold text-foreground border-l border-border">
                    {formatCurrency(offer.loan_amount)}
                  </td>
                ))}
              </tr>

              {/* Editable: Monthly Payment */}
              <tr className="border-b-2 border-border bg-accent/5 border-l-4 border-l-accent">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border">
                  <div className="flex items-center gap-2">
                    <span>Monthly Payment</span>
                    <span className="text-xs text-muted-foreground font-normal whitespace-nowrap">(Editable)</span>
                  </div>
                </td>
                {editableOffers.map((offer, idx) => (
                  <td key={offer.offer_type} className="py-3 px-4 border-l border-border">
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
                          className="w-28 px-2 py-1.5 text-sm border-2 border-accent rounded bg-background text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <button onClick={handleEditSave} className="p-1.5 text-accent rounded hover:bg-accent/10 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleEditCancel} className="p-1.5 text-muted-foreground rounded hover:bg-muted transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 min-h-[32px]">
                        <span className="font-semibold text-foreground">{formatCurrency(offer.monthly_payment)}</span>
                        <button
                          onClick={() => handleEditStart('monthly_payment', idx, offer.monthly_payment)}
                          className="p-1 text-accent rounded hover:bg-accent/10 transition-colors flex-shrink-0"
                          title="Edit monthly payment"
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
                {editableOffers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-semibold text-foreground border-l border-border">
                    {offer.amortization_years.toFixed(1)} years
                  </td>
                ))}
              </tr>

              {/* Editable: Balloon Period */}
              <tr className="border-b border-border bg-accent/5 border-l-4 border-l-accent">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border">
                  <div className="flex items-center gap-2">
                    <span>Balloon Period</span>
                    <span className="text-xs text-muted-foreground font-normal whitespace-nowrap">(Editable)</span>
                  </div>
                </td>
                {editableOffers.map((offer, idx) => (
                  <td key={offer.offer_type} className="py-3 px-4 border-l border-border">
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
                          className="w-20 px-2 py-1.5 text-sm border-2 border-accent rounded bg-background text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <span className="text-sm text-foreground">years</span>
                        <button onClick={handleEditSave} className="p-1.5 text-accent rounded hover:bg-accent/10 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleEditCancel} className="p-1.5 text-muted-foreground rounded hover:bg-muted transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 min-h-[32px]">
                        <span className="font-semibold text-foreground">{offer.balloon_period} years</span>
                        <button
                          onClick={() => handleEditStart('balloon_year', idx, offer.balloon_period)}
                          className="p-1 text-accent rounded hover:bg-accent/10 transition-colors flex-shrink-0"
                          title="Edit balloon period"
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
                {editableOffers.map((offer) => (
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
                {editableOffers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-bold text-accent border-l border-border">
                    {formatCurrency(offer.appreciation_profit)}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Principal Paid</td>
                {editableOffers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center font-semibold text-foreground border-l border-border">
                    {formatCurrency(offer.principal_paid)}
                  </td>
                ))}
              </tr>

              {/* Editable: Rehab Cost (min $6000) */}
              {editableOffers.some(o => o.rehab_cost > 0) && (
                <tr className="border-b border-border bg-accent/5 border-l-4 border-l-accent">
                  <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-accent/5 border-r border-border">
                    <div className="flex items-center gap-2">
                      <span>Rehab Cost</span>
                      <span className="text-xs text-muted-foreground font-normal whitespace-nowrap">(Editable, min $6K)</span>
                    </div>
                  </td>
                  {editableOffers.map((offer, idx) => (
                    <td key={offer.offer_type} className="py-3 px-4 border-l border-border">
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
                            className="w-28 px-2 py-1.5 text-sm border-2 border-accent rounded bg-background text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent"
                            autoFocus
                          />
                          <button
                            onClick={handleEditSave}
                            className="p-1.5 text-accent rounded hover:bg-accent/10 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-1.5 text-muted-foreground rounded hover:bg-muted transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 min-h-[32px]">
                          <span className="font-semibold text-muted-foreground">
                            {offer.rehab_cost > 0 ? formatCurrency(offer.rehab_cost) : '—'}
                          </span>
                          {offer.rehab_cost > 0 && (
                            <button
                              onClick={() => handleEditStart('rehab_cost', idx, offer.rehab_cost)}
                              className="p-1 text-accent rounded hover:bg-accent/10 transition-colors flex-shrink-0"
                              title="Edit rehab cost"
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

              {/* Additional Info Section */}
              <tr className="bg-muted">
                <td colSpan={editableOffers.length + 1} className="py-2.5 px-4 text-xs font-bold text-foreground uppercase tracking-wide border-r border-border">
                  Additional Information
                </td>
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Assignment Fee</td>
                {editableOffers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center text-muted-foreground border-l border-border">
                    {formatCurrency(CONFIG.assignment_fee)}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">Closing Cost</td>
                {editableOffers.map((offer) => (
                  <td key={offer.offer_type} className="py-3 px-4 text-center text-muted-foreground border-l border-border">
                    {formatCurrency(offer.final_offer_price * CONFIG.closing_cost_percent)}
                    <div className="text-xs mt-0.5">({(CONFIG.closing_cost_percent * 100).toFixed(0)}% of offer)</div>
                  </td>
                ))}
              </tr>

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