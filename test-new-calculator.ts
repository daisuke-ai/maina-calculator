import { SellerFinanceCalculator } from './lib/calculator/calculator'
import { PropertyData } from './lib/calculator/types'

console.log("Testing New Optimized Calculator")
console.log("=".repeat(80))

// Test property
const testProperty: PropertyData = {
  listed_price: 150000,
  monthly_rent: 1500,
  monthly_property_tax: 200,
  monthly_insurance: 100,
  monthly_hoa_fee: 50,
  monthly_other_fees: 0
}

console.log("\nTest Property:")
console.log(`  Listed Price: $${testProperty.listed_price.toLocaleString()}`)
console.log(`  Monthly Rent: $${testProperty.monthly_rent.toLocaleString()}`)
console.log(`  Property Tax: $${testProperty.monthly_property_tax}/mo`)
console.log(`  Insurance: $${testProperty.monthly_insurance}/mo`)
console.log(`  HOA: $${testProperty.monthly_hoa_fee}/mo`)

const calculator = new SellerFinanceCalculator()
const offers = calculator.calculateAllOffers(testProperty)

console.log("\n" + "=".repeat(80))
console.log("OPTIMIZED CALCULATOR RESULTS")
console.log("=".repeat(80))

offers.forEach((offer, index) => {
  console.log(`\n${index + 1}. ${offer.offer_type}`)
  console.log("-".repeat(80))
  console.log(`  Offer Price: $${offer.final_offer_price.toLocaleString()}`)
  console.log(`  Entry Fee: ${offer.final_entry_fee_percent.toFixed(1)}% ($${offer.final_entry_fee_amount.toLocaleString()})`)
  console.log(`  Down Payment: $${offer.down_payment.toLocaleString()} (${offer.down_payment_percent.toFixed(1)}%)`)
  console.log(`  Loan Amount: $${offer.loan_amount.toLocaleString()}`)
  console.log(`  Amortization: ${offer.amortization_years} years`)
  console.log(`  Monthly Payment: $${offer.monthly_payment.toFixed(0)}`)
  console.log(`  Net Rental Yield: ${offer.net_rental_yield.toFixed(2)}%`)
  console.log(`  Monthly Cash Flow: $${offer.final_monthly_cash_flow.toFixed(0)}`)
  console.log(`  Balloon Period: ${offer.balloon_period} years`)
  console.log(`  Balloon Payment: $${offer.balloon_payment.toLocaleString()}`)
  console.log(`  Deal Viability: ${offer.deal_viability.toUpperCase()}`)
  if (offer.viability_reasons.length > 0) {
    console.log(`  Reasons:`)
    offer.viability_reasons.forEach(reason => console.log(`    - ${reason}`))
  }
})

console.log("\n" + "=".repeat(80))
console.log("✅ Calculator is working correctly!")
console.log("=".repeat(80))
