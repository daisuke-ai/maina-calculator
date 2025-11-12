import { CalculatorConfig } from './types'

export const CONFIG: CalculatorConfig = {
  annual_interest_rate: 0.0,
  assignment_fee: 5000.0,
  closing_cost_percent_of_offer: 0.02,
  monthly_maintenance_rate: 0.1,      // 10% of monthly rent for property maintenance
  monthly_prop_mgmt_rate: 0.1,        // 10% of monthly rent for property management
  appreciation_per_year: 0.045,       // 4.5% annual appreciation rate
  max_amortization_years: 40.0,       // Maximum 40-year amortization period
  offers: {
    owner_favored: {
      appreciation_profit_fixed: 30000.0,           // Lower bound: buyer must capture ≥ $30k appreciation
      entry_fee_max_percent: 22.5,                  // Maximum 22.5% entry fee
      net_rental_yield_range: [15.0, 17.0],         // Target net rental yield: 15-17%
      balloon_period: 5,                            // 5-year balloon payment
    },
    balanced: {
      appreciation_profit_fixed: 40000.0,           // Lower bound: buyer must capture ≥ $40k appreciation
      entry_fee_max_percent: 20.0,                  // Maximum 20% entry fee
      net_rental_yield_range: [17.0, 20.0],         // Target net rental yield: 17-20%
      balloon_period: 6,                            // 6-year balloon payment
    },
    buyer_favored: {
      appreciation_profit_fixed: 60000.0,           // Lower bound: buyer must capture ≥ $60k appreciation
      entry_fee_max_percent: 20.0,                  // Maximum 20% entry fee
      net_rental_yield_range: [20.0, 30.0],         // Target net rental yield: 20-30%
      balloon_period: 7,                            // 7-year balloon payment
    },
  },
}
