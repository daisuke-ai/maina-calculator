import { CalculatorConfig, DealViability } from './types'

export class CalculatorUtils {
  constructor(private config: CalculatorConfig) {}

  /**
   * Evaluate deal viability based on key metrics
   */
  evaluateDealViability(
    offerType: 'Max Owner Favored' | 'Balanced' | 'Max Buyer Favored',
    downPayment: number,
    downPaymentPercent: number,
    monthlyCashFlow: number,
    netRentalYield: number,
    amortizationYears: number
  ): { viability: DealViability; reasons: string[] } {
    const reasons: string[] = []

    // Get target yield range for this offer type
    const targetYieldRange = this.getTargetYieldRange(offerType)
    const minYield = targetYieldRange[0]

    // Check for "Not Viable" conditions (red flags)
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

    // Check for "Marginal" conditions (yellow warnings)
    if (downPaymentPercent < 3) {
      reasons.push(`Low down payment (${downPaymentPercent.toFixed(1)}%) - less than 3% of offer price`)
    }

    if (monthlyCashFlow >= 100 && monthlyCashFlow < 200) {
      reasons.push(`Marginal cash flow ($${monthlyCashFlow.toFixed(0)}/month) - minimum $200 recommended`)
    }

    // Only flag as marginal if yield is BELOW minimum threshold (not just near it)
    if (netRentalYield < minYield && netRentalYield >= minYield - 5) {
      reasons.push(`Net rental yield (${netRentalYield.toFixed(1)}%) is below minimum threshold (${minYield}%)`)
    }

    if (amortizationYears > 35) {
      reasons.push(`Very long amortization (${amortizationYears} years) - payoff takes over 35 years`)
    }

    if (reasons.length > 0) {
      return { viability: 'marginal', reasons }
    }

    // If no red flags or warnings, it's a good deal
    reasons.push('All metrics meet or exceed target thresholds')
    return { viability: 'good', reasons }
  }

  private getTargetYieldRange(offerType: 'Max Owner Favored' | 'Balanced' | 'Max Buyer Favored'): [number, number] {
    switch (offerType) {
      case 'Max Owner Favored':
        return this.config.offers.owner_favored.net_rental_yield_range
      case 'Balanced':
        return this.config.offers.balanced.net_rental_yield_range
      case 'Max Buyer Favored':
        return this.config.offers.buyer_favored.net_rental_yield_range
    }
  }

  calculateNetRentalYield(annual_net_income: number, entry_fee: number): number {
    if (entry_fee <= 0) return 0.0
    return (annual_net_income / entry_fee) * 100
  }

  calculateRehabCost(): number {
    return 6000.0
  }

  calculateAppreciatedValue(base_price: number, balloon_years: number): number {
    return base_price * Math.pow(1 + this.config.appreciation_per_year, balloon_years)
  }

  calculateAmortizationPeriod(loan_amount: number, monthly_payment: number): number {
    if (monthly_payment <= 0) return Infinity
    return loan_amount / (monthly_payment * 12)
  }

  calculateOperatingExpenses(property_data: {
    monthly_rent: number
    monthly_property_tax: number
    monthly_insurance: number
    monthly_hoa_fee: number
    monthly_other_fees: number
  }, monthly_payment: number): number {
    const { monthly_rent, monthly_property_tax, monthly_insurance, monthly_hoa_fee, monthly_other_fees } = property_data

    // Operating Expenses = Principal & Interest + Property Tax + Insurance + HOA + Other + Maintenance + Management
    return (
      monthly_payment + // Principal & Interest
      monthly_property_tax +
      monthly_insurance +
      monthly_hoa_fee +
      monthly_other_fees +
      monthly_rent * this.config.monthly_maintenance_rate + // 10% for maintenance
      monthly_rent * this.config.monthly_prop_mgmt_rate      // 10% for management
    )
  }

  calculateNonDebtExpenses(property_data: {
    monthly_rent: number
    monthly_property_tax: number
    monthly_insurance: number
    monthly_hoa_fee: number
    monthly_other_fees: number
  }): number {
    const { monthly_rent, monthly_property_tax, monthly_insurance, monthly_hoa_fee, monthly_other_fees } = property_data

    // Non-debt expenses (excludes mortgage payment)
    return (
      monthly_property_tax +
      monthly_insurance +
      monthly_hoa_fee +
      monthly_other_fees +
      monthly_rent * this.config.monthly_maintenance_rate +
      monthly_rent * this.config.monthly_prop_mgmt_rate
    )
  }
}
