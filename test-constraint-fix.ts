import { SellerFinanceCalculator } from './lib/calculator/calculator'
import { PropertyData } from './lib/calculator/types'

console.log("Testing Constraint Fix for Low-Priced Properties")
console.log("=".repeat(80))

// Test property data from user ($79,900 property)
const propertyData: PropertyData = {
  listed_price: 79900,
  monthly_rent: 1514,
  monthly_property_tax: 0,
  monthly_insurance: 91.67,
  monthly_hoa_fee: 0,
  monthly_other_fees: 150
}

const calculator = new SellerFinanceCalculator()
const offers = calculator.calculateAllOffers(propertyData)

console.log("\nProperty Details:")
console.log(`  Listed Price: $${propertyData.listed_price.toLocaleString()}`)
console.log(`  Monthly Rent: $${propertyData.monthly_rent}`)
console.log(`  Monthly Expenses: $${(propertyData.monthly_property_tax + propertyData.monthly_insurance + propertyData.monthly_hoa_fee + propertyData.monthly_other_fees).toFixed(2)}`)

console.log("\n" + "=".repeat(80))
console.log("OWNER FAVORED OFFER (10% above list)")
console.log("=".repeat(80))
const ownerOffer = offers[0]
console.log(`  Offer Price: $${ownerOffer.final_offer_price.toLocaleString()}`)
console.log(`  Is Buyable: ${ownerOffer.is_buyable ? '✅ YES' : '❌ NO'}`)
if (!ownerOffer.is_buyable) {
  console.log(`  Reason: ${ownerOffer.unbuyable_reason}`)
} else {
  console.log(`  Down Payment: $${ownerOffer.down_payment.toLocaleString()} (${ownerOffer.down_payment_percent.toFixed(1)}%)`)
  console.log(`  Entry Fee: $${ownerOffer.final_entry_fee_amount.toLocaleString()} (${ownerOffer.final_entry_fee_percent.toFixed(1)}%)`)
  console.log(`  Monthly Cash Flow: $${ownerOffer.final_monthly_cash_flow.toFixed(0)}`)
  console.log(`  Net Rental Yield: ${ownerOffer.net_rental_yield.toFixed(2)}%`)
}

console.log("\n" + "=".repeat(80))
console.log("BALANCED OFFER (5% above list)")
console.log("=".repeat(80))
const balancedOffer = offers[1]
console.log(`  Offer Price: $${balancedOffer.final_offer_price.toLocaleString()}`)
console.log(`  Is Buyable: ${balancedOffer.is_buyable ? '✅ YES' : '❌ NO'}`)
if (!balancedOffer.is_buyable) {
  console.log(`  Reason: ${balancedOffer.unbuyable_reason}`)
} else {
  console.log(`  Down Payment: $${balancedOffer.down_payment.toLocaleString()} (${balancedOffer.down_payment_percent.toFixed(1)}%)`)
  console.log(`  Entry Fee: $${balancedOffer.final_entry_fee_amount.toLocaleString()} (${balancedOffer.final_entry_fee_percent.toFixed(1)}%)`)
  console.log(`  Monthly Cash Flow: $${balancedOffer.final_monthly_cash_flow.toFixed(0)}`)
  console.log(`  Net Rental Yield: ${balancedOffer.net_rental_yield.toFixed(2)}%`)
}

console.log("\n" + "=".repeat(80))
console.log("BUYER FAVORED OFFER (at list price)")
console.log("=".repeat(80))
const buyerOffer = offers[2]
console.log(`  Offer Price: $${buyerOffer.final_offer_price.toLocaleString()}`)
console.log(`  Is Buyable: ${buyerOffer.is_buyable ? '✅ YES' : '❌ NO'}`)
if (!buyerOffer.is_buyable) {
  console.log(`  Reason: ${buyerOffer.unbuyable_reason}`)
} else {
  console.log(`  Down Payment: $${buyerOffer.down_payment.toLocaleString()} (${buyerOffer.down_payment_percent.toFixed(1)}%)`)
  console.log(`  Entry Fee: $${buyerOffer.final_entry_fee_amount.toLocaleString()} (${buyerOffer.final_entry_fee_percent.toFixed(1)}%)`)
  console.log(`  Monthly Cash Flow: $${buyerOffer.final_monthly_cash_flow.toFixed(0)}`)
  console.log(`  Net Rental Yield: ${buyerOffer.net_rental_yield.toFixed(2)}%`)
}

console.log("\n" + "=".repeat(80))
console.log("CONSTRAINT ANALYSIS")
console.log("=".repeat(80))

// Show why constraints fail for each offer
const checkConstraints = (offerPrice: number, offerName: string) => {
  console.log(`\n${offerName} ($${offerPrice.toLocaleString()}):`)

  const minDownPayment = offerPrice * 0.05
  const maxDownPayment = offerPrice * 0.10
  const closingCost = offerPrice * 0.02
  const fixedCosts = 6000 + 5000 // rehab + assignment

  console.log(`  Min Down Payment (5%): $${minDownPayment.toLocaleString()}`)
  console.log(`  Fixed Costs: $${fixedCosts.toLocaleString()} (Rehab + Assignment)`)
  console.log(`  Closing Cost (2%): $${closingCost.toLocaleString()}`)

  const minEntryFee = minDownPayment + fixedCosts + closingCost
  const minEntryFeePercent = (minEntryFee / offerPrice) * 100

  console.log(`  Min Entry Fee: $${minEntryFee.toLocaleString()} (${minEntryFeePercent.toFixed(1)}%)`)

  if (minEntryFeePercent > 20) {
    console.log(`  ❌ CONSTRAINT VIOLATION: Min entry fee exceeds 20% limit!`)
    console.log(`     - Even with 5% down payment, entry fee would be ${minEntryFeePercent.toFixed(1)}%`)
    console.log(`     - Need at least $${(offerPrice * 0.20).toLocaleString()} max entry fee`)
    console.log(`     - But minimum entry fee is $${minEntryFee.toLocaleString()}`)
  } else {
    console.log(`  ✅ Constraints can be satisfied`)
  }
}

checkConstraints(ownerOffer.final_offer_price, "Owner Favored")
checkConstraints(balancedOffer.final_offer_price, "Balanced")
checkConstraints(buyerOffer.final_offer_price, "Buyer Favored")

console.log("\n" + "=".repeat(80))
