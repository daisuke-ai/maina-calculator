/**
 * Dynamic Calculator Engine
 *
 * This module provides a fully reactive calculation system where any variable
 * can be edited and all dependent variables automatically update.
 */

import { PropertyData, OfferResult } from './types'
import { CONFIG } from './config'

export interface DynamicOfferData {
  // Primary Inputs (can be edited directly)
  offer_price: number
  down_payment_percent: number
  entry_fee_percent: number
  amortization_years: number
  balloon_period: number

  // Calculated from Primary
  down_payment: number
  entry_fee_amount: number
  loan_amount: number
  monthly_payment: number

  // Fixed Costs
  rehab_cost: number
  closing_cost_percent: number
  closing_cost: number
  assignment_fee: number

  // Cash Flow Variables
  monthly_rent: number
  monthly_expenses: number
  monthly_cash_flow: number

  // Returns
  net_rental_yield: number
  annual_net_income: number

  // Balloon Details
  principal_paid: number
  balloon_payment: number
  appreciation_profit: number

  // Validation
  is_valid: boolean
  validation_errors: string[]
}

export class DynamicCalculator {
  private config = CONFIG

  /**
   * VARIABLE RELATIONSHIPS MAP
   * Shows which variables depend on which inputs
   */
  private relationships = {
    // Direct calculations from offer_price
    closing_cost: ['offer_price', 'closing_cost_percent'],
    loan_amount: ['offer_price', 'down_payment'],

    // Down payment relationships
    down_payment: ['offer_price', 'down_payment_percent'],
    down_payment_percent: ['down_payment', 'offer_price'],

    // Entry fee relationships
    entry_fee_amount: ['down_payment', 'rehab_cost', 'closing_cost', 'assignment_fee'],
    entry_fee_percent: ['entry_fee_amount', 'offer_price'],

    // Reverse calculations (when editing entry fee)
    down_payment_from_entry: ['entry_fee_amount', 'rehab_cost', 'closing_cost', 'assignment_fee'],

    // Loan and payment
    monthly_payment: ['loan_amount', 'amortization_years'],
    amortization_years: ['loan_amount', 'monthly_payment'],

    // Cash flow
    monthly_cash_flow: ['monthly_rent', 'monthly_expenses', 'monthly_payment'],

    // Returns
    net_rental_yield: ['annual_net_income', 'entry_fee_amount'],
    annual_net_income: ['monthly_rent', 'monthly_expenses', 'monthly_payment'],

    // Balloon
    principal_paid: ['monthly_payment', 'balloon_period'],
    balloon_payment: ['loan_amount', 'principal_paid'],
  }

  /**
   * CONSTRAINTS
   */
  private constraints = {
    down_payment_percent: { min: 5, max: 10 },
    entry_fee_percent: { max: 20 },
    amortization_years: { min: 1, max: 40 },
    offer_price_markup: {
      owner_favored: 0.10,
      balanced: 0.05,
      buyer_favored: 0.00
    }
  }

  /**
   * Create initial dynamic offer from property data
   */
  createDynamicOffer(
    property_data: PropertyData,
    offer_type: 'owner_favored' | 'balanced' | 'buyer_favored'
  ): DynamicOfferData {
    // Calculate initial offer price based on type
    const markup = this.constraints.offer_price_markup[offer_type]
    const offer_price = property_data.listed_price * (1 + markup)

    // Start with default down payment
    const down_payment_percent = 5.0
    const down_payment = offer_price * (down_payment_percent / 100)

    // Fixed costs
    const rehab_cost = 6000
    const closing_cost_percent = 0.02
    const closing_cost = offer_price * closing_cost_percent
    const assignment_fee = 5000

    // Calculate entry fee
    const entry_fee_amount = down_payment + rehab_cost + closing_cost + assignment_fee
    const entry_fee_percent = (entry_fee_amount / offer_price) * 100

    // Loan details
    const loan_amount = offer_price - down_payment
    const amortization_years = 20 // Default
    const monthly_payment = loan_amount / (amortization_years * 12)

    // Cash flow
    const monthly_rent = property_data.monthly_rent
    const monthly_expenses = this.calculateMonthlyExpenses(property_data)
    const monthly_cash_flow = monthly_rent - monthly_expenses - monthly_payment

    // Returns
    const annual_net_income = monthly_cash_flow * 12
    const net_rental_yield = (annual_net_income / entry_fee_amount) * 100

    // Balloon
    const balloon_periods = {
      owner_favored: 5,
      balanced: 6,
      buyer_favored: 7
    }
    const balloon_period = balloon_periods[offer_type]
    const principal_paid = monthly_payment * 12 * balloon_period
    const balloon_payment = loan_amount - principal_paid

    // Appreciation
    const future_value = property_data.listed_price * Math.pow(1.045, balloon_period)
    const appreciation_profit = future_value - offer_price

    // Validate
    const { is_valid, validation_errors } = this.validate({
      offer_price,
      down_payment_percent,
      entry_fee_percent,
      amortization_years,
      balloon_period,
      down_payment,
      entry_fee_amount,
      loan_amount,
      monthly_payment,
      rehab_cost,
      closing_cost_percent,
      closing_cost,
      assignment_fee,
      monthly_rent,
      monthly_expenses,
      monthly_cash_flow,
      net_rental_yield,
      annual_net_income,
      principal_paid,
      balloon_payment,
      appreciation_profit,
      is_valid: true,
      validation_errors: []
    })

    return {
      offer_price,
      down_payment_percent,
      entry_fee_percent,
      amortization_years,
      balloon_period,
      down_payment,
      entry_fee_amount,
      loan_amount,
      monthly_payment,
      rehab_cost,
      closing_cost_percent,
      closing_cost,
      assignment_fee,
      monthly_rent,
      monthly_expenses,
      monthly_cash_flow,
      net_rental_yield,
      annual_net_income,
      principal_paid,
      balloon_payment,
      appreciation_profit,
      is_valid,
      validation_errors
    }
  }

  /**
   * UPDATE ENGINE - Recalculates all dependent variables when one changes
   */
  updateField(
    current: DynamicOfferData,
    field: keyof DynamicOfferData,
    value: number,
    property_data: PropertyData
  ): DynamicOfferData {
    const updated = { ...current }

    // Update the changed field
    (updated as any)[field] = value

    // Recalculate based on what was changed
    switch (field) {
      case 'offer_price':
        this.recalculateFromOfferPrice(updated)
        break

      case 'down_payment_percent':
        this.recalculateFromDownPaymentPercent(updated)
        break

      case 'down_payment':
        this.recalculateFromDownPaymentAmount(updated)
        break

      case 'entry_fee_percent':
        this.recalculateFromEntryFeePercent(updated)
        break

      case 'entry_fee_amount':
        this.recalculateFromEntryFeeAmount(updated)
        break

      case 'amortization_years':
        this.recalculateFromAmortization(updated)
        break

      case 'monthly_payment':
        this.recalculateFromMonthlyPayment(updated)
        break

      case 'balloon_period':
        this.recalculateFromBalloonPeriod(updated, property_data)
        break
    }

    // Always recalculate cash flow and returns
    this.recalculateCashFlow(updated, property_data)
    this.recalculateReturns(updated)

    // Validate
    const { is_valid, validation_errors } = this.validate(updated)
    updated.is_valid = is_valid
    updated.validation_errors = validation_errors

    return updated
  }

  /**
   * RECALCULATION METHODS
   */

  private recalculateFromOfferPrice(data: DynamicOfferData) {
    // Update closing cost
    data.closing_cost = data.offer_price * data.closing_cost_percent

    // Update down payment (maintain percentage)
    data.down_payment = data.offer_price * (data.down_payment_percent / 100)

    // Update loan amount
    data.loan_amount = data.offer_price - data.down_payment

    // Update entry fee
    data.entry_fee_amount = data.down_payment + data.rehab_cost + data.closing_cost + data.assignment_fee
    data.entry_fee_percent = (data.entry_fee_amount / data.offer_price) * 100

    // Update monthly payment
    data.monthly_payment = data.loan_amount / (data.amortization_years * 12)

    // Update balloon
    data.principal_paid = data.monthly_payment * 12 * data.balloon_period
    data.balloon_payment = data.loan_amount - data.principal_paid
  }

  private recalculateFromDownPaymentPercent(data: DynamicOfferData) {
    // Update down payment amount
    data.down_payment = data.offer_price * (data.down_payment_percent / 100)

    // Update loan amount
    data.loan_amount = data.offer_price - data.down_payment

    // Update entry fee
    data.entry_fee_amount = data.down_payment + data.rehab_cost + data.closing_cost + data.assignment_fee
    data.entry_fee_percent = (data.entry_fee_amount / data.offer_price) * 100

    // Update monthly payment
    data.monthly_payment = data.loan_amount / (data.amortization_years * 12)

    // Update balloon
    data.principal_paid = data.monthly_payment * 12 * data.balloon_period
    data.balloon_payment = data.loan_amount - data.principal_paid
  }

  private recalculateFromDownPaymentAmount(data: DynamicOfferData) {
    // Update down payment percentage
    data.down_payment_percent = (data.down_payment / data.offer_price) * 100

    // Update loan amount
    data.loan_amount = data.offer_price - data.down_payment

    // Update entry fee
    data.entry_fee_amount = data.down_payment + data.rehab_cost + data.closing_cost + data.assignment_fee
    data.entry_fee_percent = (data.entry_fee_amount / data.offer_price) * 100

    // Update monthly payment
    data.monthly_payment = data.loan_amount / (data.amortization_years * 12)

    // Update balloon
    data.principal_paid = data.monthly_payment * 12 * data.balloon_period
    data.balloon_payment = data.loan_amount - data.principal_paid
  }

  private recalculateFromEntryFeePercent(data: DynamicOfferData) {
    // Update entry fee amount
    data.entry_fee_amount = data.offer_price * (data.entry_fee_percent / 100)

    // Calculate down payment from entry fee
    data.down_payment = data.entry_fee_amount - data.rehab_cost - data.closing_cost - data.assignment_fee
    data.down_payment_percent = (data.down_payment / data.offer_price) * 100

    // Update loan amount
    data.loan_amount = data.offer_price - data.down_payment

    // Update monthly payment
    data.monthly_payment = data.loan_amount / (data.amortization_years * 12)

    // Update balloon
    data.principal_paid = data.monthly_payment * 12 * data.balloon_period
    data.balloon_payment = data.loan_amount - data.principal_paid
  }

  private recalculateFromEntryFeeAmount(data: DynamicOfferData) {
    // Update entry fee percentage
    data.entry_fee_percent = (data.entry_fee_amount / data.offer_price) * 100

    // Calculate down payment from entry fee
    data.down_payment = data.entry_fee_amount - data.rehab_cost - data.closing_cost - data.assignment_fee
    data.down_payment_percent = (data.down_payment / data.offer_price) * 100

    // Update loan amount
    data.loan_amount = data.offer_price - data.down_payment

    // Update monthly payment
    data.monthly_payment = data.loan_amount / (data.amortization_years * 12)

    // Update balloon
    data.principal_paid = data.monthly_payment * 12 * data.balloon_period
    data.balloon_payment = data.loan_amount - data.principal_paid
  }

  private recalculateFromAmortization(data: DynamicOfferData) {
    // Update monthly payment
    data.monthly_payment = data.loan_amount / (data.amortization_years * 12)

    // Update balloon
    data.principal_paid = data.monthly_payment * 12 * data.balloon_period
    data.balloon_payment = data.loan_amount - data.principal_paid
  }

  private recalculateFromMonthlyPayment(data: DynamicOfferData) {
    // Calculate amortization from payment
    if (data.monthly_payment > 0) {
      data.amortization_years = data.loan_amount / (data.monthly_payment * 12)
    }

    // Update balloon
    data.principal_paid = data.monthly_payment * 12 * data.balloon_period
    data.balloon_payment = data.loan_amount - data.principal_paid
  }

  private recalculateFromBalloonPeriod(data: DynamicOfferData, property_data: PropertyData) {
    // Update principal paid
    data.principal_paid = data.monthly_payment * 12 * data.balloon_period
    data.balloon_payment = data.loan_amount - data.principal_paid

    // Recalculate appreciation
    const future_value = property_data.listed_price * Math.pow(1.045, data.balloon_period)
    data.appreciation_profit = future_value - data.offer_price
  }

  private recalculateCashFlow(data: DynamicOfferData, property_data: PropertyData) {
    data.monthly_cash_flow = data.monthly_rent - data.monthly_expenses - data.monthly_payment
  }

  private recalculateReturns(data: DynamicOfferData) {
    data.annual_net_income = data.monthly_cash_flow * 12
    if (data.entry_fee_amount > 0) {
      data.net_rental_yield = (data.annual_net_income / data.entry_fee_amount) * 100
    } else {
      data.net_rental_yield = 0
    }
  }

  /**
   * VALIDATION
   */
  private validate(data: DynamicOfferData): { is_valid: boolean; validation_errors: string[] } {
    const errors: string[] = []

    // Down payment constraints
    if (data.down_payment_percent < this.constraints.down_payment_percent.min) {
      errors.push(`Down payment must be at least ${this.constraints.down_payment_percent.min}%`)
    }
    if (data.down_payment_percent > this.constraints.down_payment_percent.max) {
      errors.push(`Down payment cannot exceed ${this.constraints.down_payment_percent.max}%`)
    }

    // Entry fee constraints
    if (data.entry_fee_percent > this.constraints.entry_fee_percent.max) {
      errors.push(`Entry fee cannot exceed ${this.constraints.entry_fee_percent.max}%`)
    }

    // Amortization constraints
    if (data.amortization_years < this.constraints.amortization_years.min) {
      errors.push(`Amortization must be at least ${this.constraints.amortization_years.min} year`)
    }
    if (data.amortization_years > this.constraints.amortization_years.max) {
      errors.push(`Amortization cannot exceed ${this.constraints.amortization_years.max} years`)
    }

    // Cash flow check
    if (data.monthly_cash_flow < 100) {
      errors.push('Monthly cash flow must be at least $100')
    }

    // Down payment must be positive
    if (data.down_payment < 0) {
      errors.push('Down payment cannot be negative')
    }

    return {
      is_valid: errors.length === 0,
      validation_errors: errors
    }
  }

  /**
   * Helper to calculate monthly expenses
   */
  private calculateMonthlyExpenses(property_data: PropertyData): number {
    return property_data.monthly_property_tax +
           property_data.monthly_insurance +
           property_data.monthly_hoa_fee +
           property_data.monthly_other_fees +
           (property_data.monthly_rent * 0.1) + // Maintenance
           (property_data.monthly_rent * 0.1)   // Management
  }

  /**
   * Get editable fields for UI
   */
  getEditableFields(): string[] {
    return [
      'offer_price',
      'down_payment_percent',
      'down_payment',
      'entry_fee_percent',
      'entry_fee_amount',
      'amortization_years',
      'monthly_payment',
      'balloon_period'
    ]
  }

  /**
   * Get field metadata for UI
   */
  getFieldMetadata(field: string): {
    label: string
    format: 'currency' | 'percent' | 'years' | 'months'
    min?: number
    max?: number
    step?: number
  } {
    const metadata: Record<string, any> = {
      offer_price: {
        label: 'Offer Price',
        format: 'currency',
        step: 1000
      },
      down_payment_percent: {
        label: 'Down Payment %',
        format: 'percent',
        min: 5,
        max: 10,
        step: 0.5
      },
      down_payment: {
        label: 'Down Payment',
        format: 'currency',
        step: 100
      },
      entry_fee_percent: {
        label: 'Entry Fee %',
        format: 'percent',
        max: 20,
        step: 0.5
      },
      entry_fee_amount: {
        label: 'Entry Fee',
        format: 'currency',
        step: 100
      },
      amortization_years: {
        label: 'Amortization',
        format: 'years',
        min: 1,
        max: 40,
        step: 1
      },
      monthly_payment: {
        label: 'Monthly Payment',
        format: 'currency',
        step: 10
      },
      balloon_period: {
        label: 'Balloon Period',
        format: 'years',
        min: 1,
        max: 10,
        step: 1
      }
    }

    return metadata[field] || { label: field, format: 'currency' }
  }
}