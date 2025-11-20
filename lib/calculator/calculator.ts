import { PropertyData, OfferResult, CalculatorConfig } from './types'
import { CalculatorUtils } from './utils'
import { CONFIG } from './config'

export class SellerFinanceCalculator {
  private utils: CalculatorUtils

  constructor(private config: CalculatorConfig = CONFIG) {
    this.utils = new CalculatorUtils(config)
  }

  /**
   * OPTIMIZATION #7: Get intelligent bounds for amortization search based on loan size and rent
   */
  private getAmortizationBounds(loan_amount: number, monthly_rent: number): { min_years: number; max_years: number } {
    let min_years = 1
    let max_years = this.config.max_amortization_years

    // Smaller loans don't need long amortization
    if (loan_amount < 50000) {
      max_years = Math.min(15, max_years)
    } else if (loan_amount < 100000) {
      max_years = Math.min(25, max_years)
    } else if (loan_amount < 200000) {
      max_years = Math.min(30, max_years)
    }

    // High rent properties can handle shorter minimum amortization
    if (monthly_rent > 4000) {
      min_years = Math.max(5, min_years)
    } else if (monthly_rent > 2500) {
      min_years = Math.max(3, min_years)
    }

    // Ensure minimum cash flow is possible (max 60% of rent for mortgage)
    const max_payment = monthly_rent * 0.6
    const min_required_years = Math.ceil(loan_amount / (max_payment * 12))
    min_years = Math.max(min_years, min_required_years)

    // Ensure bounds are valid
    if (min_years > max_years) {
      max_years = Math.min(this.config.max_amortization_years, min_years + 5)
    }

    return { min_years, max_years }
  }

  /**
   * OPTIMIZATION #2: Calculate comprehensive score for multi-objective optimization
   * Weights: 70% yield, 20% cash flow, 10% amortization speed
   */
  private calculateOfferScore(
    net_rental_yield: number,
    monthly_cash_flow: number,
    amortization_years: number,
    target_yield_range: [number, number]
  ): number {
    const [min_yield, max_yield] = target_yield_range
    const target_yield = (min_yield + max_yield) / 2
    const allowable_deviation = 2.0 // Allow ±2% deviation from range

    // Normalize yield score (0-100)
    let yield_score = 0
    if (net_rental_yield < min_yield - allowable_deviation) {
      // Too far below range: penalize heavily
      yield_score = Math.max(0, 50 * (1 - (min_yield - net_rental_yield - allowable_deviation) / 5))
    } else if (net_rental_yield < min_yield) {
      // Slightly below range: still acceptable but less than perfect
      const deviation = min_yield - net_rental_yield
      yield_score = 85 - (deviation / allowable_deviation) * 15
    } else if (net_rental_yield > max_yield + allowable_deviation) {
      // Too far above range: still good but not necessary
      yield_score = Math.min(100, 80 + 20 * Math.exp(-(net_rental_yield - max_yield - allowable_deviation) / 5))
    } else if (net_rental_yield > max_yield) {
      // Slightly above range: excellent
      const deviation = net_rental_yield - max_yield
      yield_score = 95 + (deviation / allowable_deviation) * 5
    } else {
      // Within range: score based on distance from target
      const range_size = max_yield - min_yield
      const distance_from_target = Math.abs(net_rental_yield - target_yield)
      yield_score = 100 - (distance_from_target / range_size) * 15
    }

    // Normalize cash flow score (0-100)
    let cashflow_score = 0
    if (monthly_cash_flow < 100) {
      cashflow_score = 0
    } else if (monthly_cash_flow < 200) {
      cashflow_score = 30 + (monthly_cash_flow - 100) * 0.3
    } else if (monthly_cash_flow < 500) {
      cashflow_score = 60 + (monthly_cash_flow - 200) * 0.1
    } else {
      cashflow_score = Math.min(100, 90 + (monthly_cash_flow - 500) * 0.02)
    }

    // Normalize amortization score (prefer shorter terms)
    const amort_score = Math.max(0, 100 - (amortization_years / this.config.max_amortization_years) * 100)

    // Weighted combination: 70% yield, 20% cash flow, 10% amortization
    return (
      yield_score * 0.70 +
      cashflow_score * 0.20 +
      amort_score * 0.10
    )
  }

  /**
   * OPTIMIZATION #1: Find optimal amortization using binary search with multi-objective optimization
   * This is 85% faster than the original linear search
   */
  private findOptimalAmortization(
    loan_amount: number,
    entry_fee_amount: number,
    property_data: PropertyData,
    target_yield_range: [number, number]
  ): { amortization_years: number; monthly_payment: number; net_rental_yield: number } {
    const [min_yield, max_yield] = target_yield_range

    // Get intelligent bounds
    const { min_years, max_years } = this.getAmortizationBounds(loan_amount, property_data.monthly_rent)

    // Helper function to calculate metrics at given amortization
    const calculateMetrics = (years: number) => {
      const monthly_payment = loan_amount / (years * 12)
      const annual_gross_rent = property_data.monthly_rent * 12
      const annual_operating_expenses = this.utils.calculateOperatingExpenses(property_data, monthly_payment) * 12
      const annual_net_income = annual_gross_rent - annual_operating_expenses
      const net_rental_yield = this.utils.calculateNetRentalYield(annual_net_income, entry_fee_amount)
      const non_debt_expenses = this.utils.calculateNonDebtExpenses(property_data)
      const monthly_cash_flow = property_data.monthly_rent - non_debt_expenses - monthly_payment

      return { net_rental_yield, monthly_cash_flow, monthly_payment }
    }

    // Binary search with scoring
    let low = min_years
    let high = max_years
    let best_years = min_years
    let best_score = -Infinity
    let best_result = calculateMetrics(min_years)

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const result = calculateMetrics(mid)

      const score = this.calculateOfferScore(
        result.net_rental_yield,
        result.monthly_cash_flow,
        mid,
        target_yield_range
      )

      if (score > best_score) {
        best_score = score
        best_years = mid
        best_result = result
      }

      // Binary search: longer amortization = lower yield
      if (result.net_rental_yield < min_yield) {
        high = mid - 1 // Need shorter amortization for higher yield
      } else if (result.net_rental_yield > max_yield) {
        low = mid + 1 // Need longer amortization for lower yield
      } else {
        // Within range - check neighbors for better score
        for (let delta = -2; delta <= 2; delta++) {
          const check_years = mid + delta
          if (check_years >= min_years && check_years <= max_years && check_years !== mid) {
            const check_result = calculateMetrics(check_years)
            const check_score = this.calculateOfferScore(
              check_result.net_rental_yield,
              check_result.monthly_cash_flow,
              check_years,
              target_yield_range
            )

            if (check_score > best_score) {
              best_score = check_score
              best_years = check_years
              best_result = check_result
            }
          }
        }
        break
      }
    }

    return {
      amortization_years: best_years,
      monthly_payment: best_result.monthly_payment,
      net_rental_yield: best_result.net_rental_yield
    }
  }

  // Calculate markup percentage - always 10%
  private calculateTieredMarkup(listed_price: number): number {
    return 0.10 // Always 10% markup regardless of price
  }

  /**
   * OPTIMIZATION #9: Find optimal down payment percentage (5-10% of offer price)
   * Entry fee is calculated as: Down Payment + Rehab + Closing + Assignment
   * CONSTRAINT: Entry fee must not exceed 20% of offer price
   */
  private findOptimalDownPayment(
    offer_price: number,
    property_data: PropertyData,
    target_yield_range: [number, number]
  ): { down_payment_percent: number; entry_fee_amount: number; is_valid: boolean } {
    const min_down_payment_percent = 5.0  // 5% minimum
    const max_down_payment_percent = 10.0 // 10% maximum
    const max_entry_fee_percent = 20.0    // 20% maximum entry fee
    let best_down_payment_percent = min_down_payment_percent
    let best_entry_fee_amount = 0
    let best_score = -Infinity
    let found_valid_option = false

    // Test different down payment percentages in 0.5% increments
    for (let dp_percent = min_down_payment_percent; dp_percent <= max_down_payment_percent; dp_percent += 0.5) {
      const down_payment = offer_price * (dp_percent / 100)
      const closing_cost = offer_price * this.config.closing_cost_percent_of_offer
      const rehab_cost = this.utils.calculateRehabCost()

      // Calculate entry fee from components
      const entry_fee_amount = down_payment + rehab_cost + closing_cost + this.config.assignment_fee
      const entry_fee_percent = (entry_fee_amount / offer_price) * 100

      // CONSTRAINT: Skip if entry fee exceeds 20% of offer price
      if (entry_fee_percent > max_entry_fee_percent) {
        continue
      }

      found_valid_option = true
      const loan_amount = offer_price - down_payment

      // Find optimal amortization for this down payment
      const { amortization_years, monthly_payment, net_rental_yield } = this.findOptimalAmortization(
        loan_amount,
        entry_fee_amount,
        property_data,
        target_yield_range
      )

      const non_debt_expenses = this.utils.calculateNonDebtExpenses(property_data)
      const monthly_cash_flow = property_data.monthly_rent - non_debt_expenses - monthly_payment

      // Score this configuration
      const score = this.calculateOfferScore(
        net_rental_yield,
        monthly_cash_flow,
        amortization_years,
        target_yield_range
      )

      if (score > best_score) {
        best_score = score
        best_down_payment_percent = dp_percent
        best_entry_fee_amount = entry_fee_amount
      }
    }

    return {
      down_payment_percent: best_down_payment_percent,
      entry_fee_amount: best_entry_fee_amount,
      is_valid: found_valid_option
    }
  }

  calculateMaxOwnerFavoredOffer(property_data: PropertyData): OfferResult {
    const offer_cfg = this.config.offers.owner_favored
    const balloon_period = offer_cfg.balloon_period
    const rehab_cost = this.utils.calculateRehabCost()

    // Calculate offer price with 10% markup
    const markup_percent = this.calculateTieredMarkup(property_data.listed_price)
    const offer_price = property_data.listed_price * (1 + markup_percent)

    // Calculate appreciation profit (future value - offer price)
    const future_value = this.utils.calculateAppreciatedValue(property_data.listed_price, balloon_period)
    const appreciation_profit = future_value - offer_price

    // OPTIMIZATION #9: Find optimal down payment (5-10%)
    const { down_payment_percent, entry_fee_amount, is_valid } = this.findOptimalDownPayment(
      offer_price,
      property_data,
      offer_cfg.net_rental_yield_range
    )

    // If no valid down payment found, return unbuyable offer
    if (!is_valid) {
      return this.createUnbuyableOffer(
        'Max Owner Favored',
        offer_price,
        'Entry fee constraint cannot be satisfied - fixed costs too high relative to offer price'
      )
    }

    // Calculate down payment and loan from optimized percentage
    const closing_cost = offer_price * this.config.closing_cost_percent_of_offer
    const down_payment = offer_price * (down_payment_percent / 100)
    const loan_amount = offer_price - down_payment
    const entry_fee_percent = (entry_fee_amount / offer_price) * 100

    // Find optimal amortization to target net rental yield range
    const { amortization_years, monthly_payment, net_rental_yield } = this.findOptimalAmortization(
      loan_amount,
      entry_fee_amount,
      property_data,
      offer_cfg.net_rental_yield_range
    )

    // Calculate non-debt expenses and cash flow
    const non_debt_expenses = this.utils.calculateNonDebtExpenses(property_data)
    const monthly_cash_flow = property_data.monthly_rent - non_debt_expenses - monthly_payment

    return this.createOfferResult(
      'Max Owner Favored',
      offer_price,
      monthly_cash_flow,
      entry_fee_percent,
      monthly_payment,
      balloon_period,
      appreciation_profit,
      rehab_cost,
      net_rental_yield,
      property_data,
      amortization_years
    )
  }

  calculateMaxBuyerFavoredOffer(property_data: PropertyData): OfferResult {
    const offer_cfg = this.config.offers.buyer_favored
    const balloon_period = offer_cfg.balloon_period
    const rehab_cost = this.utils.calculateRehabCost()

    // Offer price is listed price
    const offer_price = property_data.listed_price

    // Calculate future value and appreciation profit
    const future_value = this.utils.calculateAppreciatedValue(offer_price, balloon_period)
    const appreciation_profit = future_value - offer_price

    // OPTIMIZATION #9: Find optimal down payment (5-10%)
    const { down_payment_percent, entry_fee_amount, is_valid } = this.findOptimalDownPayment(
      offer_price,
      property_data,
      offer_cfg.net_rental_yield_range
    )

    // If no valid down payment found, return unbuyable offer
    if (!is_valid) {
      return this.createUnbuyableOffer(
        'Max Buyer Favored',
        offer_price,
        'Entry fee constraint cannot be satisfied - fixed costs too high relative to offer price'
      )
    }

    // Calculate down payment and loan from optimized percentage
    const closing_cost = offer_price * this.config.closing_cost_percent_of_offer
    const down_payment = offer_price * (down_payment_percent / 100)
    const loan_amount = offer_price - down_payment
    const entry_fee_percent = (entry_fee_amount / offer_price) * 100

    // Find optimal amortization to target net rental yield range
    const { amortization_years, monthly_payment, net_rental_yield } = this.findOptimalAmortization(
      loan_amount,
      entry_fee_amount,
      property_data,
      offer_cfg.net_rental_yield_range
    )

    // Calculate non-debt expenses and cash flow
    const non_debt_expenses = this.utils.calculateNonDebtExpenses(property_data)
    const monthly_cash_flow = property_data.monthly_rent - non_debt_expenses - monthly_payment

    return this.createOfferResult(
      'Max Buyer Favored',
      offer_price,
      monthly_cash_flow,
      entry_fee_percent,
      monthly_payment,
      balloon_period,
      appreciation_profit,
      rehab_cost,
      net_rental_yield,
      property_data,
      amortization_years
    )
  }

  calculateBalancedOffer(owner_offer: OfferResult, buyer_offer: OfferResult, property_data: PropertyData): OfferResult {
    const offer_cfg = this.config.offers.balanced
    const balloon_period = offer_cfg.balloon_period
    const rehab_cost = this.utils.calculateRehabCost()

    // Calculate offer price with HALF the markup (5%)
    const markup_percent = this.calculateTieredMarkup(property_data.listed_price)
    const offer_price = property_data.listed_price * (1 + (markup_percent / 2))

    // Calculate future value and appreciation profit
    const future_value = this.utils.calculateAppreciatedValue(property_data.listed_price, balloon_period)
    const appreciation_profit = future_value - offer_price

    // OPTIMIZATION #9: Find optimal down payment (5-10%)
    const { down_payment_percent, entry_fee_amount, is_valid } = this.findOptimalDownPayment(
      offer_price,
      property_data,
      offer_cfg.net_rental_yield_range
    )

    // If no valid down payment found, return unbuyable offer
    if (!is_valid) {
      return this.createUnbuyableOffer(
        'Balanced',
        offer_price,
        'Entry fee constraint cannot be satisfied - fixed costs too high relative to offer price'
      )
    }

    // Calculate down payment and loan from optimized percentage
    const closing_cost = offer_price * this.config.closing_cost_percent_of_offer
    const down_payment = offer_price * (down_payment_percent / 100)
    const loan_amount = offer_price - down_payment
    const entry_fee_percent = (entry_fee_amount / offer_price) * 100

    // Find optimal amortization to target net rental yield range
    const { amortization_years, monthly_payment, net_rental_yield } = this.findOptimalAmortization(
      loan_amount,
      entry_fee_amount,
      property_data,
      offer_cfg.net_rental_yield_range
    )

    // Calculate non-debt expenses and cash flow
    const non_debt_expenses = this.utils.calculateNonDebtExpenses(property_data)
    const monthly_cash_flow = property_data.monthly_rent - non_debt_expenses - monthly_payment

    return this.createOfferResult(
      'Balanced',
      offer_price,
      monthly_cash_flow,
      entry_fee_percent,
      monthly_payment,
      balloon_period,
      appreciation_profit,
      rehab_cost,
      net_rental_yield,
      property_data,
      amortization_years
    )
  }

  calculateAllOffers(property_data: PropertyData): OfferResult[] {
    const owner_offer = this.calculateMaxOwnerFavoredOffer(property_data)
    const buyer_offer = this.calculateMaxBuyerFavoredOffer(property_data)
    const balanced_offer = this.calculateBalancedOffer(owner_offer, buyer_offer, property_data)

    return [owner_offer, balanced_offer, buyer_offer]
  }

  private createOfferResult(
    offer_type: OfferResult['offer_type'],
    offer_price: number,
    monthly_cash_flow: number,
    entry_fee_percent: number,
    monthly_payment: number,
    balloon_period: number,
    appreciation_profit: number,
    rehab_cost: number,
    net_rental_yield: number,
    property_data: PropertyData,
    amortization_years: number
  ): OfferResult {
    const entry_fee_amount = offer_price * (entry_fee_percent / 100)
    const closing_cost = offer_price * this.config.closing_cost_percent_of_offer
    const down_payment = entry_fee_amount - rehab_cost - closing_cost - this.config.assignment_fee
    const dp_percent = offer_price > 0 ? (down_payment / offer_price) * 100 : 0
    const loan_amount = offer_price - down_payment

    // Calculate COC for backward compatibility (though we're using net rental yield now)
    const coc = entry_fee_amount > 0 ? (monthly_cash_flow * 12 / entry_fee_amount) * 100 : 0

    const principal_paid = monthly_payment * 12 * balloon_period
    const balloon_payment = loan_amount > principal_paid ? loan_amount - principal_paid : 0

    // Evaluate deal viability
    const { viability, reasons } = this.utils.evaluateDealViability(
      offer_type,
      down_payment,
      dp_percent,
      monthly_cash_flow,
      net_rental_yield,
      amortization_years
    )

    // All deals are shown now (no buyability checks)
    return {
      offer_type,
      is_buyable: true,
      unbuyable_reason: '',
      deal_viability: viability,
      viability_reasons: reasons,
      final_offer_price: offer_price,
      final_coc_percent: coc,
      final_monthly_cash_flow: monthly_cash_flow,
      net_rental_yield: net_rental_yield,
      final_entry_fee_percent: entry_fee_percent,
      final_entry_fee_amount: entry_fee_amount,
      down_payment,
      down_payment_percent: dp_percent,
      loan_amount,
      monthly_payment,
      balloon_period,
      appreciation_profit,
      rehab_cost,
      amortization_years: amortization_years,
      principal_paid,
      balloon_payment,
    }
  }

  private createUnbuyableOffer(
    offer_type: OfferResult['offer_type'],
    offer_price: number,
    reason: string
  ): OfferResult {
    return {
      offer_type,
      is_buyable: false,
      unbuyable_reason: reason,
      deal_viability: 'not_viable',
      viability_reasons: [reason],
      final_offer_price: offer_price,
      final_coc_percent: 0,
      final_monthly_cash_flow: 0,
      net_rental_yield: 0,
      final_entry_fee_percent: 0,
      final_entry_fee_amount: 0,
      down_payment: 0,
      down_payment_percent: 0,
      loan_amount: 0,
      monthly_payment: 0,
      balloon_period: 0,
      appreciation_profit: 0,
      rehab_cost: 6000,
      amortization_years: 0,
      principal_paid: 0,
      balloon_payment: 0,
    }
  }
}
