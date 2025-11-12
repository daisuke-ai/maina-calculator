import { CalculatorConfig } from './types'

export class CalculatorUtils {
  constructor(private config: CalculatorConfig) {}

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
