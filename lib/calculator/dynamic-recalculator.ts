/**
 * Dynamic Recalculator for Offer Price and Down Payment Edits
 *
 * This module handles dynamic recalculation when either:
 * 1. Offer Price is edited
 * 2. Down Payment is edited
 *
 * All other fields are calculated automatically based on these inputs.
 */

import { OfferResult, PropertyData } from './types'
import { CONFIG } from './config'

export class DynamicRecalculator {
  private config = CONFIG

  /**
   * Recalculate offer when Offer Price is edited
   */
  recalculateFromOfferPrice(
    currentOffer: OfferResult,
    newOfferPrice: number,
    propertyData: PropertyData
  ): OfferResult {
    const offer = { ...currentOffer }

    // Update offer price
    offer.final_offer_price = newOfferPrice

    // Recalculate closing cost (2% of offer price)
    const closingCost = newOfferPrice * this.config.closing_cost_percent_of_offer

    // Keep the same down payment percentage, recalculate amount
    // First, determine what the current down payment percentage was
    const currentDownPaymentPercent = (currentOffer.down_payment / currentOffer.final_offer_price) * 100

    // Apply same percentage to new offer price
    offer.down_payment = newOfferPrice * (currentDownPaymentPercent / 100)
    offer.down_payment_percent = currentDownPaymentPercent

    // Recalculate entry fee components
    const rehabCost = 6000
    const assignmentFee = 5000

    // Entry fee = Down Payment + Rehab + Closing + Assignment
    offer.final_entry_fee_amount = offer.down_payment + rehabCost + closingCost + assignmentFee
    offer.final_entry_fee_percent = (offer.final_entry_fee_amount / newOfferPrice) * 100

    // Recalculate loan amount
    offer.loan_amount = newOfferPrice - offer.down_payment

    // Recalculate monthly payment (0% interest)
    // Keep same amortization period if possible, otherwise adjust
    if (offer.amortization_years > 0) {
      offer.monthly_payment = offer.loan_amount / (offer.amortization_years * 12)
    }

    // Recalculate cash flow
    const nonDebtExpenses = this.calculateNonDebtExpenses(propertyData)
    offer.final_monthly_cash_flow = propertyData.monthly_rent - nonDebtExpenses - offer.monthly_payment

    // Recalculate net rental yield
    const annualNetIncome = offer.final_monthly_cash_flow * 12
    offer.net_rental_yield = (annualNetIncome / offer.final_entry_fee_amount) * 100

    // Recalculate COC for backward compatibility
    offer.final_coc_percent = offer.net_rental_yield

    // Recalculate balloon payment
    const principalPaid = offer.monthly_payment * 12 * offer.balloon_period
    offer.balloon_payment = offer.loan_amount - principalPaid
    offer.principal_paid = principalPaid

    // Recalculate appreciation profit
    // Use original listed price for appreciation calculation
    const futureValue = propertyData.listed_price * Math.pow(1 + this.config.appreciation_per_year, offer.balloon_period)
    offer.appreciation_profit = futureValue - newOfferPrice

    // Update viability
    const viability = this.evaluateDealViability(offer, propertyData)
    offer.deal_viability = viability.viability
    offer.viability_reasons = viability.reasons

    return offer
  }

  /**
   * Recalculate offer when Down Payment is edited
   */
  recalculateFromDownPayment(
    currentOffer: OfferResult,
    newDownPayment: number,
    propertyData: PropertyData
  ): OfferResult {
    const offer = { ...currentOffer }

    // Update down payment
    offer.down_payment = newDownPayment
    offer.down_payment_percent = (newDownPayment / offer.final_offer_price) * 100

    // Recalculate entry fee components
    const closingCost = offer.final_offer_price * this.config.closing_cost_percent_of_offer
    const rehabCost = 6000
    const assignmentFee = 5000

    // Entry fee = Down Payment + Rehab + Closing + Assignment
    offer.final_entry_fee_amount = newDownPayment + rehabCost + closingCost + assignmentFee
    offer.final_entry_fee_percent = (offer.final_entry_fee_amount / offer.final_offer_price) * 100

    // Recalculate loan amount
    offer.loan_amount = offer.final_offer_price - newDownPayment

    // Recalculate monthly payment (0% interest)
    if (offer.amortization_years > 0) {
      offer.monthly_payment = offer.loan_amount / (offer.amortization_years * 12)
    }

    // Recalculate cash flow
    const nonDebtExpenses = this.calculateNonDebtExpenses(propertyData)
    offer.final_monthly_cash_flow = propertyData.monthly_rent - nonDebtExpenses - offer.monthly_payment

    // Recalculate net rental yield
    const annualNetIncome = offer.final_monthly_cash_flow * 12
    offer.net_rental_yield = (annualNetIncome / offer.final_entry_fee_amount) * 100

    // Recalculate COC for backward compatibility
    offer.final_coc_percent = offer.net_rental_yield

    // Recalculate balloon payment
    const principalPaid = offer.monthly_payment * 12 * offer.balloon_period
    offer.balloon_payment = offer.loan_amount - principalPaid
    offer.principal_paid = principalPaid

    // Update viability
    const viability = this.evaluateDealViability(offer, propertyData)
    offer.deal_viability = viability.viability
    offer.viability_reasons = viability.reasons

    return offer
  }

  /**
   * Calculate non-debt expenses
   */
  private calculateNonDebtExpenses(propertyData: PropertyData): number {
    return (
      propertyData.monthly_property_tax +
      propertyData.monthly_insurance +
      propertyData.monthly_hoa_fee +
      propertyData.monthly_other_fees +
      (propertyData.monthly_rent * this.config.monthly_maintenance_rate) +
      (propertyData.monthly_rent * this.config.monthly_prop_mgmt_rate)
    )
  }

  /**
   * Evaluate deal viability
   */
  private evaluateDealViability(
    offer: OfferResult,
    propertyData: PropertyData
  ): { viability: 'good' | 'marginal' | 'not_viable'; reasons: string[] } {
    const reasons: string[] = []

    // Get target yield range based on offer type
    const targetYieldRange = this.getTargetYieldRange(offer.offer_type)
    const minYield = targetYieldRange[0]

    // Check for "Not Viable" conditions
    if (offer.down_payment < 0) {
      reasons.push('Negative down payment - deal requires more cash than available')
      return { viability: 'not_viable', reasons }
    }

    if (offer.final_monthly_cash_flow < 100) {
      reasons.push(`Monthly cash flow too low ($${offer.final_monthly_cash_flow.toFixed(0)}) - minimum $100 required`)
      return { viability: 'not_viable', reasons }
    }

    if (offer.net_rental_yield < minYield - 5) {
      reasons.push(`Net rental yield (${offer.net_rental_yield.toFixed(1)}%) is ${(minYield - offer.net_rental_yield).toFixed(1)}% below minimum threshold`)
      return { viability: 'not_viable', reasons }
    }

    // Check for "Marginal" conditions
    if (offer.down_payment_percent < 3) {
      reasons.push(`Low down payment (${offer.down_payment_percent.toFixed(1)}%) - less than 3% of offer price`)
    }

    if (offer.final_monthly_cash_flow >= 100 && offer.final_monthly_cash_flow < 200) {
      reasons.push(`Marginal cash flow ($${offer.final_monthly_cash_flow.toFixed(0)}/month) - minimum $200 recommended`)
    }

    if (offer.net_rental_yield < minYield && offer.net_rental_yield >= minYield - 5) {
      reasons.push(`Net rental yield (${offer.net_rental_yield.toFixed(1)}%) is below minimum threshold (${minYield}%)`)
    }

    if (offer.amortization_years > 35) {
      reasons.push(`Very long amortization (${offer.amortization_years} years) - payoff takes over 35 years`)
    }

    if (reasons.length > 0) {
      return { viability: 'marginal', reasons }
    }

    // If no red flags or warnings, it's a good deal
    reasons.push('All metrics meet or exceed target thresholds')
    return { viability: 'good', reasons }
  }

  /**
   * Get target yield range for offer type
   */
  private getTargetYieldRange(offerType: string): [number, number] {
    if (offerType.includes('Owner')) {
      return this.config.offers.owner_favored.net_rental_yield_range
    } else if (offerType.includes('Balanced')) {
      return this.config.offers.balanced.net_rental_yield_range
    } else {
      return this.config.offers.buyer_favored.net_rental_yield_range
    }
  }

  /**
   * Validate constraints
   */
  validateConstraints(offer: OfferResult): string[] {
    const errors: string[] = []

    // Down payment constraints (5-10%)
    if (offer.down_payment_percent < 5) {
      errors.push('Down payment must be at least 5% of offer price')
    }
    if (offer.down_payment_percent > 10) {
      errors.push('Down payment cannot exceed 10% of offer price')
    }

    // Entry fee constraint (max 20%)
    if (offer.final_entry_fee_percent > 20) {
      errors.push('Entry fee cannot exceed 20% of offer price')
    }

    // Cash flow constraint
    if (offer.final_monthly_cash_flow < 0) {
      errors.push('Monthly cash flow cannot be negative')
    }

    return errors
  }

  /**
   * Recalculate offer when Monthly Payment is edited
   */
  recalculateFromMonthlyPayment(
    currentOffer: OfferResult,
    newMonthlyPayment: number,
    propertyData: PropertyData
  ): OfferResult {
    const offer = { ...currentOffer }

    // Update monthly payment
    offer.monthly_payment = newMonthlyPayment

    // Recalculate amortization period based on new monthly payment
    // loan_amount = monthly_payment * months
    // months = loan_amount / monthly_payment
    if (newMonthlyPayment > 0) {
      const totalMonths = offer.loan_amount / newMonthlyPayment
      offer.amortization_years = totalMonths / 12
    }

    // Recalculate cash flow
    const nonDebtExpenses = this.calculateNonDebtExpenses(propertyData)
    offer.final_monthly_cash_flow = propertyData.monthly_rent - nonDebtExpenses - newMonthlyPayment

    // Recalculate net rental yield
    const annualNetIncome = offer.final_monthly_cash_flow * 12
    offer.net_rental_yield = (annualNetIncome / offer.final_entry_fee_amount) * 100

    // Recalculate COC for backward compatibility
    offer.final_coc_percent = offer.net_rental_yield

    // Recalculate balloon payment
    const principalPaid = newMonthlyPayment * 12 * offer.balloon_period
    offer.balloon_payment = offer.loan_amount - principalPaid
    offer.principal_paid = principalPaid

    // Update viability
    const viability = this.evaluateDealViability(offer, propertyData)
    offer.deal_viability = viability.viability
    offer.viability_reasons = viability.reasons

    return offer
  }

  /**
   * Recalculate offer when Balloon Period is edited
   */
  recalculateFromBalloonPeriod(
    currentOffer: OfferResult,
    newBalloonPeriod: number,
    propertyData: PropertyData
  ): OfferResult {
    const offer = { ...currentOffer }

    // Update balloon period
    offer.balloon_period = newBalloonPeriod

    // Recalculate principal paid during balloon period
    const principalPaid = offer.monthly_payment * 12 * newBalloonPeriod
    offer.principal_paid = principalPaid

    // Recalculate balloon payment
    offer.balloon_payment = offer.loan_amount - principalPaid

    // Recalculate appreciation profit based on new time period
    const futureValue = propertyData.listed_price * Math.pow(1 + this.config.appreciation_per_year, newBalloonPeriod)
    offer.appreciation_profit = futureValue - offer.final_offer_price

    // Update viability
    const viability = this.evaluateDealViability(offer, propertyData)
    offer.deal_viability = viability.viability
    offer.viability_reasons = viability.reasons

    return offer
  }

  /**
   * Recalculate offer when Rehab Cost is edited
   */
  recalculateFromRehabCost(
    currentOffer: OfferResult,
    newRehabCost: number,
    propertyData: PropertyData
  ): OfferResult {
    const offer = { ...currentOffer }

    // Enforce minimum rehab cost ($6,000)
    const MIN_REHAB_COST = 6000
    const validRehabCost = Math.max(newRehabCost, MIN_REHAB_COST)

    // Update rehab cost
    offer.rehab_cost = validRehabCost

    // Recalculate entry fee components
    const closingCost = offer.final_offer_price * this.config.closing_cost_percent_of_offer
    const assignmentFee = 5000

    // Entry fee = Down Payment + Rehab + Closing + Assignment
    offer.final_entry_fee_amount = offer.down_payment + validRehabCost + closingCost + assignmentFee
    offer.final_entry_fee_percent = (offer.final_entry_fee_amount / offer.final_offer_price) * 100

    // Recalculate net rental yield (it's based on entry fee)
    const annualNetIncome = offer.final_monthly_cash_flow * 12
    offer.net_rental_yield = (annualNetIncome / offer.final_entry_fee_amount) * 100

    // Recalculate COC for backward compatibility
    offer.final_coc_percent = offer.net_rental_yield

    // Update viability
    const viability = this.evaluateDealViability(offer, propertyData)
    offer.deal_viability = viability.viability
    offer.viability_reasons = viability.reasons

    return offer
  }

  /**
   * Get recommended down payment range for an offer price
   */
  getRecommendedDownPaymentRange(offerPrice: number): { min: number; max: number } {
    return {
      min: offerPrice * 0.05, // 5%
      max: offerPrice * 0.10  // 10%
    }
  }

  /**
   * Calculate entry fee breakdown for display
   */
  getEntryFeeBreakdown(offer: OfferResult): {
    downPayment: number
    rehabCost: number
    closingCost: number
    assignmentFee: number
    total: number
  } {
    const closingCost = offer.final_offer_price * this.config.closing_cost_percent_of_offer

    return {
      downPayment: offer.down_payment,
      rehabCost: 6000,
      closingCost: closingCost,
      assignmentFee: 5000,
      total: offer.final_entry_fee_amount
    }
  }
}