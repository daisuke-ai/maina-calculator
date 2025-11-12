import { SellerFinanceCalculator } from '../lib/calculator/calculator'
import { PropertyData } from '../lib/calculator/types'

const testCases: PropertyData[] = [
  {
    listed_price: 87000,
    monthly_rent: 1150,
    monthly_property_tax: 95,
    monthly_insurance: 80,
    monthly_hoa_fee: 0,
    monthly_other_fees: 25,
  },
  {
    listed_price: 87000,
    monthly_rent: 1150,
    monthly_property_tax: 95,
    monthly_insurance: 80,
    monthly_hoa_fee: 0,
    monthly_other_fees: 0,
  },
  {
    listed_price: 99000,
    monthly_rent: 1025,
    monthly_property_tax: 130,
    monthly_insurance: 95,
    monthly_hoa_fee: 0,
    monthly_other_fees: 35,
  },
]

function runTests() {
  const calculator = new SellerFinanceCalculator()

  testCases.forEach((testCase, index) => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`TEST CASE #${index + 1}`)
    console.log(`${'='.repeat(60)}`)
    console.log('\nInput Data:')
    console.log(JSON.stringify(testCase, null, 2))

    const offers = calculator.calculateAllOffers(testCase)

    offers.forEach((offer) => {
      console.log(`\n--- ${offer.offer_type} ---`)
      console.log(`Status: ${offer.is_buyable ? '✅ Buyable' : '❌ Unbuyable'}`)

      if (!offer.is_buyable) {
        console.log(`Reason: ${offer.unbuyable_reason}`)
      } else {
        console.log(`Offer Price: $${offer.final_offer_price.toLocaleString()}`)
        console.log(`Entry Fee: ${offer.final_entry_fee_percent.toFixed(2)}% ($${offer.final_entry_fee_amount.toLocaleString()})`)
        console.log(`Monthly Cash Flow: $${offer.final_monthly_cash_flow.toFixed(2)}`)
        console.log(`Monthly Payment: $${offer.monthly_payment.toFixed(2)}`)
        console.log(`COC: ${offer.final_coc_percent.toFixed(2)}%`)
        console.log(`Down Payment: ${offer.down_payment_percent.toFixed(2)}% ($${offer.down_payment.toLocaleString()})`)
        console.log(`Amortization: ${offer.amortization_years.toFixed(1)} years`)
        console.log(`Balloon Payment: $${offer.balloon_payment.toLocaleString()}`)
      }
    })
  })

  console.log(`\n${'='.repeat(60)}`)
  console.log('✅ All tests completed!')
  console.log(`${'='.repeat(60)}\n`)
}

runTests()
