import { PropertyData, OfferResult, CalculatorConfig } from './types'
import { CalculatorUtils } from './utils'
import { CONFIG } from './config'

export class SellerFinanceCalculator {
  private utils: CalculatorUtils

  constructor(private config: CalculatorConfig = CONFIG) {
    this.utils = new CalculatorUtils(config)
  }

  /**
   * Find the best amortization period (1-40 years) that targets the net rental yield range.
   * Returns the amortization period in years and the resulting monthly payment.
   */
  private findOptimalAmortization(
    loan_amount: number,
    entry_fee_amount: number,
    property_data: PropertyData,
    target_yield_range: [number, number]
  ): { amortization_years: number; monthly_payment: number; net_rental_yield: number } {
    const [min_yield, max_yield] = target_yield_range
    const target_yield = (min_yield + max_yield) / 2 // Target the middle of the range

    let best_amortization = this.config.max_amortization_years
    let best_payment = loan_amount / (best_amortization * 12)
    let best_yield = 0
    let best_diff = Infinity

    // Try different amortization periods from 1 to 40 years
    for (let years = 1; years <= this.config.max_amortization_years; years++) {
      const monthly_payment = loan_amount / (years * 12)

      // Calculate net rental yield for this payment
      const annual_gross_rent = property_data.monthly_rent * 12
      const annual_operating_expenses = this.utils.calculateOperatingExpenses(property_data, monthly_payment) * 12
      const annual_net_income = annual_gross_rent - annual_operating_expenses
      const net_rental_yield = this.utils.calculateNetRentalYield(annual_net_income, entry_fee_amount)

      // Check if this is closer to our target
      const diff = Math.abs(net_rental_yield - target_yield)

      if (diff < best_diff) {
        best_diff = diff
        best_amortization = years
        best_payment = monthly_payment
        best_yield = net_rental_yield
      }

      // If we're within the range and close to target, we can stop
      if (net_rental_yield >= min_yield && net_rental_yield <= max_yield && diff < 0.5) {
        break
      }
    }

    return {
      amortization_years: best_amortization,
      monthly_payment: best_payment,
      net_rental_yield: best_yield
    }
  }

  calculateMaxOwnerFavoredOffer(property_data: PropertyData): OfferResult {
    const offer_cfg = this.config.offers.owner_favored
    const balloon_period = offer_cfg.balloon_period
    const rehab_cost = this.utils.calculateRehabCost()

    // Calculate future value and offer price
    const future_value = this.utils.calculateAppreciatedValue(property_data.listed_price, balloon_period)
    const appreciation_profit = offer_cfg.appreciation_profit_fixed
    const offer_price = future_value - appreciation_profit

    // Start with max entry fee
    let entry_fee_percent = offer_cfg.entry_fee_max_percent
    const entry_fee_amount = offer_price * (entry_fee_percent / 100)

    // Calculate costs and loan
    const closing_cost = offer_price * this.config.closing_cost_percent_of_offer
    const down_payment = entry_fee_amount - rehab_cost - closing_cost - this.config.assignment_fee
    const loan_amount = offer_price - down_payment

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

    // Start with max entry fee
    let entry_fee_percent = offer_cfg.entry_fee_max_percent
    const entry_fee_amount = offer_price * (entry_fee_percent / 100)

    // Calculate costs and loan
    const closing_cost = offer_price * this.config.closing_cost_percent_of_offer
    const down_payment = entry_fee_amount - rehab_cost - closing_cost - this.config.assignment_fee
    const loan_amount = offer_price - down_payment

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

    // Average the offer prices from owner and buyer
    const offer_price = (owner_offer.final_offer_price + buyer_offer.final_offer_price) / 2

    // Calculate future value and appreciation profit
    const future_value = this.utils.calculateAppreciatedValue(property_data.listed_price, balloon_period)
    const appreciation_profit = future_value - offer_price

    // Entry fee max 20%
    let entry_fee_percent = offer_cfg.entry_fee_max_percent
    const entry_fee_amount = offer_price * (entry_fee_percent / 100)

    // Calculate costs and loan
    const closing_cost = offer_price * this.config.closing_cost_percent_of_offer
    const down_payment = entry_fee_amount - rehab_cost - closing_cost - this.config.assignment_fee
    const loan_amount = offer_price - down_payment

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

    // All deals are shown now (no buyability checks)
    return {
      offer_type,
      is_buyable: true,
      unbuyable_reason: '',
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
}
