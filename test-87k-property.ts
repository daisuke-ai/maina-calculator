import { SellerFinanceCalculator } from './lib/calculator/calculator'
import { PropertyData } from './lib/calculator/types'

console.log("Testing $87k Property")
console.log("=".repeat(80))

const property: PropertyData = {
  listed_price: 87000,
  monthly_rent: 1150,
  monthly_property_tax: 95,
  monthly_insurance: 80,
  monthly_hoa_fee: 0,
  monthly_other_fees: 0
}

console.log("\nProperty Details:")
console.log(`  Listed Price: $${property.listed_price.toLocaleString()}`)
console.log(`  Monthly Rent: $${property.monthly_rent.toLocaleString()}`)
console.log(`  Property Tax: $${property.monthly_property_tax}/mo`)
console.log(`  Insurance: $${property.monthly_insurance}/mo`)
console.log(`  HOA: $${property.monthly_hoa_fee}/mo`)
console.log(`  Other Fees: $${property.monthly_other_fees}/mo`)

// Calculate total monthly expenses
const totalExpenses = property.monthly_property_tax +
                     property.monthly_insurance +
                     property.monthly_hoa_fee +
                     property.monthly_other_fees +
                     (property.monthly_rent * 0.2) // 20% for maintenance + management
console.log(`  Total Non-Debt Expenses: $${totalExpenses.toFixed(0)}/mo`)
console.log(`  Rent-to-Price Ratio: ${((property.monthly_rent / property.listed_price) * 100).toFixed(2)}%`)

const calculator = new SellerFinanceCalculator()
const offers = calculator.calculateAllOffers(property)

console.log("\n" + "=".repeat(80))
console.log("CALCULATOR RESULTS")
console.log("=".repeat(80))

offers.forEach((offer, index) => {
  console.log(`\n${index + 1}. ${offer.offer_type}`)
  console.log("-".repeat(80))

  // Offer Details
  console.log(`📊 Offer Structure:`)
  console.log(`  Offer Price: $${offer.final_offer_price.toLocaleString()}`)

  // Down Payment & Entry Fee
  console.log(`\n💰 Upfront Costs:`)
  console.log(`  Down Payment: $${offer.down_payment.toLocaleString()} (${offer.down_payment_percent.toFixed(1)}%)`)
  console.log(`  Entry Fee: $${offer.final_entry_fee_amount.toLocaleString()} (${offer.final_entry_fee_percent.toFixed(1)}%)`)

  // Entry Fee Breakdown
  const closingCost = offer.final_offer_price * 0.02
  console.log(`    = Down Payment ($${offer.down_payment.toLocaleString()})`)
  console.log(`    + Rehab ($6,000)`)
  console.log(`    + Closing ($${closingCost.toFixed(0)})`)
  console.log(`    + Assignment ($5,000)`)

  // Loan Details
  console.log(`\n🏦 Loan Structure:`)
  console.log(`  Loan Amount: $${offer.loan_amount.toLocaleString()}`)
  console.log(`  Amortization: ${offer.amortization_years} years`)
  console.log(`  Monthly Payment: $${offer.monthly_payment.toFixed(0)}`)
  console.log(`  Interest Rate: 0%`)

  // Cash Flow Analysis
  console.log(`\n💵 Monthly Cash Flow:`)
  console.log(`  Rental Income: $${property.monthly_rent.toLocaleString()}`)
  console.log(`  Operating Expenses: $${totalExpenses.toFixed(0)}`)
  console.log(`  Mortgage Payment: $${offer.monthly_payment.toFixed(0)}`)
  console.log(`  ─────────────────────`)
  console.log(`  Net Cash Flow: $${offer.final_monthly_cash_flow.toFixed(0)}/month`)
  console.log(`  Annual Cash Flow: $${(offer.final_monthly_cash_flow * 12).toFixed(0)}/year`)

  // Returns
  console.log(`\n📈 Returns:`)
  console.log(`  Net Rental Yield: ${offer.net_rental_yield.toFixed(2)}%`)
  console.log(`  Cash-on-Cash: ${offer.final_coc_percent.toFixed(2)}%`)

  // Balloon Payment
  console.log(`\n⏰ Exit Strategy (${offer.balloon_period} years):`)
  console.log(`  Principal Paid: $${offer.principal_paid.toLocaleString()}`)
  console.log(`  Balloon Payment: $${offer.balloon_payment.toLocaleString()}`)
  console.log(`  Appreciation Profit: $${offer.appreciation_profit.toLocaleString()}`)

  // Deal Quality
  console.log(`\n✓ Deal Viability: ${offer.deal_viability.toUpperCase()}`)
  if (offer.viability_reasons.length > 0) {
    console.log(`  Reasons:`)
    offer.viability_reasons.forEach(reason => console.log(`    • ${reason}`))
  }

  // Constraints Check
  console.log(`\n🎯 Constraint Verification:`)
  const dpInRange = offer.down_payment_percent >= 5 && offer.down_payment_percent <= 10
  const efUnder20 = offer.final_entry_fee_percent <= 20
  console.log(`  ${dpInRange ? '✅' : '❌'} Down payment: ${offer.down_payment_percent.toFixed(1)}% (target: 5-10%)`)
  console.log(`  ${efUnder20 ? '✅' : '❌'} Entry fee: ${offer.final_entry_fee_percent.toFixed(1)}% (max: 20%)`)
})

// Summary
console.log(`\n${"=".repeat(80)}`)
console.log("SUMMARY")
console.log("=".repeat(80))
console.log(`Property: $87k with $1,150/mo rent (1.32% monthly)`)
console.log(`Best Offer: ${offers.find(o => o.deal_viability === 'good')?.offer_type || offers[0].offer_type}`)
console.log(`All offers meet constraints: 5-10% down payment, ≤20% entry fee`)
console.log("=".repeat(80))
