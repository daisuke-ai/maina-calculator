import { DynamicRecalculator } from './lib/calculator/dynamic-recalculator'
import { OfferResult, PropertyData } from './lib/calculator/types'

console.log("Testing Dynamic Calculator - Edit Offer Price & Down Payment")
console.log("=".repeat(80))

// Test property data
const propertyData: PropertyData = {
  listed_price: 139000,
  monthly_rent: 1632,
  monthly_property_tax: 120,
  monthly_insurance: 292,
  monthly_hoa_fee: 0,
  monthly_other_fees: 150
}

// Create a sample offer (Owner Favored)
const originalOffer: OfferResult = {
  offer_type: 'Max Owner Favored',
  is_buyable: true,
  unbuyable_reason: '',
  deal_viability: 'marginal',
  viability_reasons: [],
  final_offer_price: 152900,
  down_payment: 7645,
  down_payment_percent: 5.0,
  final_entry_fee_amount: 21703,
  final_entry_fee_percent: 14.2,
  loan_amount: 145255,
  monthly_payment: 576,
  amortization_years: 21,
  final_monthly_cash_flow: 167,
  net_rental_yield: 9.24,
  final_coc_percent: 9.24,
  balloon_period: 5,
  principal_paid: 34560,
  balloon_payment: 110695,
  appreciation_profit: 12717,
  rehab_cost: 6000
}

const recalculator = new DynamicRecalculator()

console.log("\nOriginal Offer:")
console.log(`  Offer Price: $${originalOffer.final_offer_price.toLocaleString()}`)
console.log(`  Down Payment: $${originalOffer.down_payment.toLocaleString()} (${originalOffer.down_payment_percent}%)`)
console.log(`  Entry Fee: $${originalOffer.final_entry_fee_amount.toLocaleString()} (${originalOffer.final_entry_fee_percent}%)`)
console.log(`  Loan Amount: $${originalOffer.loan_amount.toLocaleString()}`)
console.log(`  Monthly Cash Flow: $${originalOffer.final_monthly_cash_flow}`)
console.log(`  Net Rental Yield: ${originalOffer.net_rental_yield}%`)

console.log("\n" + "=".repeat(80))
console.log("TEST 1: Edit Offer Price to $160,000")
console.log("=".repeat(80))

const afterPriceEdit = recalculator.recalculateFromOfferPrice(
  originalOffer,
  160000,
  propertyData
)

console.log("After editing offer price to $160,000:")
console.log(`  Offer Price: $${afterPriceEdit.final_offer_price.toLocaleString()} ✓`)
console.log(`  Down Payment: $${afterPriceEdit.down_payment.toLocaleString()} (${afterPriceEdit.down_payment_percent.toFixed(1)}%) [maintains same %]`)
console.log(`  Entry Fee: $${afterPriceEdit.final_entry_fee_amount.toLocaleString()} (${afterPriceEdit.final_entry_fee_percent.toFixed(1)}%) [recalculated]`)
console.log(`  Loan Amount: $${afterPriceEdit.loan_amount.toLocaleString()} [recalculated]`)
console.log(`  Monthly Payment: $${afterPriceEdit.monthly_payment.toFixed(0)} [recalculated]`)
console.log(`  Monthly Cash Flow: $${afterPriceEdit.final_monthly_cash_flow} [recalculated]`)
console.log(`  Net Rental Yield: ${afterPriceEdit.net_rental_yield.toFixed(2)}% [recalculated]`)
console.log(`  Deal Viability: ${afterPriceEdit.deal_viability} [updated]`)

// Show what changed
console.log("\nChanges from original:")
console.log(`  Offer Price: +$${(afterPriceEdit.final_offer_price - originalOffer.final_offer_price).toLocaleString()}`)
console.log(`  Down Payment: +$${(afterPriceEdit.down_payment - originalOffer.down_payment).toLocaleString()}`)
console.log(`  Entry Fee: +$${(afterPriceEdit.final_entry_fee_amount - originalOffer.final_entry_fee_amount).toLocaleString()}`)
console.log(`  Loan Amount: +$${(afterPriceEdit.loan_amount - originalOffer.loan_amount).toLocaleString()}`)
console.log(`  Monthly Payment: +$${(afterPriceEdit.monthly_payment - originalOffer.monthly_payment).toFixed(0)}`)
console.log(`  Cash Flow: ${afterPriceEdit.final_monthly_cash_flow - originalOffer.final_monthly_cash_flow > 0 ? '+' : ''}$${(afterPriceEdit.final_monthly_cash_flow - originalOffer.final_monthly_cash_flow).toFixed(0)}`)

console.log("\n" + "=".repeat(80))
console.log("TEST 2: Edit Down Payment to $15,290 (10%)")
console.log("=".repeat(80))

const afterDownPaymentEdit = recalculator.recalculateFromDownPayment(
  originalOffer,
  15290,
  propertyData
)

console.log("After editing down payment to $15,290 (10%):")
console.log(`  Offer Price: $${afterDownPaymentEdit.final_offer_price.toLocaleString()} [unchanged]`)
console.log(`  Down Payment: $${afterDownPaymentEdit.down_payment.toLocaleString()} (${afterDownPaymentEdit.down_payment_percent.toFixed(1)}%) ✓`)
console.log(`  Entry Fee: $${afterDownPaymentEdit.final_entry_fee_amount.toLocaleString()} (${afterDownPaymentEdit.final_entry_fee_percent.toFixed(1)}%) [recalculated]`)
console.log(`  Loan Amount: $${afterDownPaymentEdit.loan_amount.toLocaleString()} [recalculated]`)
console.log(`  Monthly Payment: $${afterDownPaymentEdit.monthly_payment.toFixed(0)} [recalculated]`)
console.log(`  Monthly Cash Flow: $${afterDownPaymentEdit.final_monthly_cash_flow} [recalculated]`)
console.log(`  Net Rental Yield: ${afterDownPaymentEdit.net_rental_yield.toFixed(2)}% [recalculated]`)
console.log(`  Deal Viability: ${afterDownPaymentEdit.deal_viability} [updated]`)

// Show what changed
console.log("\nChanges from original:")
console.log(`  Down Payment: +$${(afterDownPaymentEdit.down_payment - originalOffer.down_payment).toLocaleString()}`)
console.log(`  Down Payment %: +${(afterDownPaymentEdit.down_payment_percent - originalOffer.down_payment_percent).toFixed(1)}%`)
console.log(`  Entry Fee: +$${(afterDownPaymentEdit.final_entry_fee_amount - originalOffer.final_entry_fee_amount).toLocaleString()}`)
console.log(`  Loan Amount: -$${(originalOffer.loan_amount - afterDownPaymentEdit.loan_amount).toLocaleString()}`)
console.log(`  Monthly Payment: -$${(originalOffer.monthly_payment - afterDownPaymentEdit.monthly_payment).toFixed(0)}`)
console.log(`  Cash Flow: +$${(afterDownPaymentEdit.final_monthly_cash_flow - originalOffer.final_monthly_cash_flow).toFixed(0)}`)

console.log("\n" + "=".repeat(80))
console.log("VALIDATION CHECK")
console.log("=".repeat(80))

// Test constraint validation
const constraints = recalculator.validateConstraints(afterDownPaymentEdit)
if (constraints.length === 0) {
  console.log("✅ All constraints met:")
  console.log("  - Down payment between 5-10%")
  console.log("  - Entry fee ≤ 20%")
  console.log("  - Monthly cash flow positive")
} else {
  console.log("❌ Constraint violations:")
  constraints.forEach(error => console.log(`  - ${error}`))
}

// Test entry fee breakdown
console.log("\n" + "=".repeat(80))
console.log("ENTRY FEE BREAKDOWN")
console.log("=".repeat(80))

const breakdown = recalculator.getEntryFeeBreakdown(afterDownPaymentEdit)
console.log(`Down Payment:    $${breakdown.downPayment.toLocaleString()}`)
console.log(`Rehab Cost:      $${breakdown.rehabCost.toLocaleString()}`)
console.log(`Closing Cost:    $${breakdown.closingCost.toLocaleString()}`)
console.log(`Assignment Fee:  $${breakdown.assignmentFee.toLocaleString()}`)
console.log("───────────────────────")
console.log(`Total Entry Fee: $${breakdown.total.toLocaleString()}`)

console.log("\n" + "=".repeat(80))
console.log("HOW IT WORKS")
console.log("=".repeat(80))
console.log("1. When OFFER PRICE is edited:")
console.log("   - Down payment % stays the same")
console.log("   - Down payment amount recalculates")
console.log("   - Entry fee recalculates (DP + Rehab + Closing + Assignment)")
console.log("   - Loan amount, payments, cash flow all update")
console.log("")
console.log("2. When DOWN PAYMENT is edited:")
console.log("   - Offer price stays the same")
console.log("   - Down payment % recalculates")
console.log("   - Entry fee recalculates")
console.log("   - Loan amount, payments, cash flow all update")
console.log("")
console.log("3. All constraints are enforced:")
console.log("   - Down payment: 5-10% of offer price")
console.log("   - Entry fee: max 20% of offer price")
console.log("   - Cash flow: must be positive")
console.log("=".repeat(80))