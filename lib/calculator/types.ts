// Core data types
export interface PropertyData {
  listed_price: number
  monthly_rent: number
  monthly_property_tax: number
  monthly_insurance: number
  monthly_hoa_fee: number
  monthly_other_fees: number
}

export type DealViability = 'not_viable' | 'marginal' | 'good'

export interface OfferResult {
  offer_type: 'Max Owner Favored' | 'Balanced' | 'Max Buyer Favored'
  is_buyable: boolean
  unbuyable_reason: string
  deal_viability: DealViability
  viability_reasons: string[]
  final_offer_price: number
  rehab_cost: number
  final_entry_fee_percent: number
  final_entry_fee_amount: number
  down_payment: number
  down_payment_percent: number
  loan_amount: number
  monthly_payment: number
  amortization_years: number
  final_monthly_cash_flow: number
  final_coc_percent: number
  net_rental_yield: number
  balloon_period: number
  principal_paid: number
  balloon_payment: number
  appreciation_profit: number
}

export interface CalculatorConfig {
  annual_interest_rate: number
  assignment_fee: number
  closing_cost_percent_of_offer: number
  monthly_maintenance_rate: number
  monthly_prop_mgmt_rate: number
  appreciation_per_year: number
  max_amortization_years: number
  offers: {
    owner_favored: {
      appreciation_profit_fixed: number
      entry_fee_max_percent: number
      net_rental_yield_range: [number, number]
      balloon_period: number
    }
    balanced: {
      appreciation_profit_fixed: number
      entry_fee_max_percent: number
      net_rental_yield_range: [number, number]
      balloon_period: number
    }
    buyer_favored: {
      appreciation_profit_fixed: number
      entry_fee_max_percent: number
      net_rental_yield_range: [number, number]
      balloon_period: number
    }
  }
}

// API Response Types
export interface PropertyAPIData {
  // Address & Location
  ADDRESS: string
  zipCode: string

  // Property Details
  PROPERTY_TYPE_RENTCAST?: string
  BEDROOMS: number
  BATHROOMS: number
  SQUARE_FOOTAGE?: number
  LOT_SIZE?: number
  YEAR_BUILT?: number

  // Pricing (Multiple Sources)
  LISTED_PRICE_ACTIVE?: number        // From active MLS listing
  ESTIMATED_VALUE_AVM?: number        // From RentCast AVM
  VALUE_RANGE_LOW?: number            // AVM range
  VALUE_RANGE_HIGH?: number           // AVM range
  LAST_SALE_PRICE?: number            // Historical sale
  LAST_SALE_DATE?: string             // Historical sale date
  LISTED_PRICE_FINAL: number          // Final price used (priority: active > AVM > last sale)
  PRICE_SOURCE?: string               // Transparency: which source was used

  // Listing Info (if actively listed)
  DAYS_ON_MARKET?: number
  MLS_NUMBER?: string
  LISTING_STATUS?: string

  // Financial Data - RentCast
  MONTHLY_HOA_FEE_RENTCAST?: number
  ANNUAL_TAX_RENTCAST_LATEST?: number
  PROPERTY_TAXES_RENTCAST?: Array<{
    year: number
    assessedValue: number
    total: number
  }>

  // Financial Data - Final Values
  MONTHLY_HOA_FEE_FINAL?: number
  ANNUAL_TAX_FINAL?: number
  ANNUAL_TAX_FINAL_MONTHLY?: number

  // Insurance (Estimated)
  ANNUAL_INSURANCE_ESTIMATED?: number
  ANNUAL_INSURANCE_FINAL_MONTHLY?: number

  // Rent Estimates
  MONTHLY_RENT_RENTCAST_AVM?: number
  MONTHLY_RENT_RENTOMETER_P25?: number
  MONTHLY_RENT_FINAL: number

  // Errors & Warnings
  errors: string[]
}
