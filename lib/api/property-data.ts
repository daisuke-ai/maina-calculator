import { PropertyAPIData } from '@/lib/calculator/types'
import {
  fetchRentCastProperty,
  fetchRentCastRentEstimate,
  fetchRentCastValueEstimate,
  fetchRentCastSaleListing
} from './rentcast'
import { fetchRentometerEstimate } from './rentometer'
import { calculateInsuranceEstimate } from './insurance-estimate'

export async function gatherPropertyData(address: string): Promise<PropertyAPIData> {
  const results: Partial<PropertyAPIData> = { errors: [] }

  // === STEP 1: Get Property Records from RentCast ===
  const rentcastData = await fetchRentCastProperty(address)
  if (rentcastData) {
    // Address formatting
    results.ADDRESS = rentcastData.formattedAddress ||
      `${rentcastData.addressLine1}, ${rentcastData.city}, ${rentcastData.state} ${rentcastData.zipCode}`
    results.zipCode = rentcastData.zipCode

    // Property details
    results.PROPERTY_TYPE_RENTCAST = rentcastData.propertyType
    results.BEDROOMS = rentcastData.bedrooms
    results.BATHROOMS = rentcastData.bathrooms
    results.SQUARE_FOOTAGE = rentcastData.squareFootage
    results.LOT_SIZE = rentcastData.lotSize
    results.YEAR_BUILT = rentcastData.yearBuilt

    // Financial data
    results.MONTHLY_HOA_FEE_RENTCAST = rentcastData.hoa?.fee || 0
    results.LAST_SALE_PRICE = rentcastData.lastSalePrice
    results.LAST_SALE_DATE = rentcastData.lastSaleDate

    // Tax data
    if (rentcastData.propertyTaxes) {
      const taxes = Object.values(rentcastData.propertyTaxes).sort((a: any, b: any) => b.year - a.year)
      results.PROPERTY_TAXES_RENTCAST = taxes as any
      if (taxes.length > 0) {
        results.ANNUAL_TAX_RENTCAST_LATEST = (taxes[0] as any).total
      }
    }
  } else {
    results.errors!.push('RentCast property records failed')
  }

  // === STEP 2: Try to Get Active Listing Price ===
  const activeListing = await fetchRentCastSaleListing(address)
  if (activeListing && activeListing.status === 'Active') {
    results.LISTED_PRICE_ACTIVE = activeListing.price
    results.DAYS_ON_MARKET = activeListing.daysOnMarket
    results.MLS_NUMBER = activeListing.mlsNumber
    results.LISTING_STATUS = activeListing.status

    // Update property type from listing if not already set
    if (!results.PROPERTY_TYPE_RENTCAST && activeListing.propertyType) {
      results.PROPERTY_TYPE_RENTCAST = activeListing.propertyType
    }
  } else {
    // No active listing found
    results.errors!.push('No active listing found')
  }

  // === STEP 3: Get Value Estimate (AVM) as Fallback ===
  if (!results.LISTED_PRICE_ACTIVE) {
    const valueEstimate = await fetchRentCastValueEstimate(address)
    if (valueEstimate) {
      results.ESTIMATED_VALUE_AVM = valueEstimate.price
      results.VALUE_RANGE_LOW = valueEstimate.priceRangeLow
      results.VALUE_RANGE_HIGH = valueEstimate.priceRangeHigh
    } else {
      results.errors!.push('RentCast value estimate failed')
    }
  }

  // === STEP 4: Determine Final Listed Price ===
  // Priority: Active Listing > AVM Estimate > Last Sale Price
  results.LISTED_PRICE_FINAL =
    results.LISTED_PRICE_ACTIVE ||
    results.ESTIMATED_VALUE_AVM ||
    results.LAST_SALE_PRICE ||
    0

  if (results.LISTED_PRICE_FINAL === 0) {
    results.errors!.push('CRITICAL: No price data available from any source')
  }

  // Store price source for transparency
  if (results.LISTED_PRICE_ACTIVE) {
    results.PRICE_SOURCE = 'Active MLS Listing'
  } else if (results.ESTIMATED_VALUE_AVM) {
    results.PRICE_SOURCE = 'RentCast AVM Estimate'
  } else if (results.LAST_SALE_PRICE) {
    results.PRICE_SOURCE = 'Last Sale Price'
  }

  // === STEP 5: Calculate Insurance Estimate ===
  if (results.LISTED_PRICE_FINAL && results.zipCode) {
    const insuranceEstimate = calculateInsuranceEstimate(
      results.LISTED_PRICE_FINAL,
      results.zipCode,
      results.PROPERTY_TYPE_RENTCAST
    )
    results.ANNUAL_INSURANCE_ESTIMATED = insuranceEstimate
    results.ANNUAL_INSURANCE_FINAL_MONTHLY = insuranceEstimate / 12
  } else {
    results.errors!.push('Cannot estimate insurance: missing price or zipCode')
  }

  // === STEP 6: Property Tax Monthly ===
  if (results.ANNUAL_TAX_RENTCAST_LATEST !== undefined) {
    results.ANNUAL_TAX_FINAL = results.ANNUAL_TAX_RENTCAST_LATEST
    results.ANNUAL_TAX_FINAL_MONTHLY = results.ANNUAL_TAX_FINAL / 12
  } else {
    results.errors!.push('No property tax data available')
  }

  // === STEP 7: HOA Fee ===
  results.MONTHLY_HOA_FEE_FINAL = results.MONTHLY_HOA_FEE_RENTCAST || 0

  // === STEP 8: Rent Estimates ===
  const finalBedrooms = results.BEDROOMS!
  const finalBathrooms = results.BATHROOMS!
  const propertyType = results.PROPERTY_TYPE_RENTCAST

  // RentCast Rent AVM
  const rentcastRent = await fetchRentCastRentEstimate(
    address, propertyType, finalBedrooms, finalBathrooms
  )
  if (rentcastRent) {
    results.MONTHLY_RENT_RENTCAST_AVM = rentcastRent
  } else {
    results.errors!.push('RentCast rent estimate failed')
  }

  // Rentometer (optional secondary source)
  const rentometerRent = await fetchRentometerEstimate(
    address, finalBedrooms, propertyType, finalBathrooms
  )
  if (rentometerRent) {
    results.MONTHLY_RENT_RENTOMETER_P25 = rentometerRent
  } else {
    results.errors!.push('Rentometer unavailable (optional)')
  }

  // === STEP 9: Calculate Final Rent (Average of 2 sources) ===
  const rentValues = [
    results.MONTHLY_RENT_RENTCAST_AVM,
    results.MONTHLY_RENT_RENTOMETER_P25,
  ].filter((v): v is number => v !== undefined && v !== null)

  results.MONTHLY_RENT_FINAL = rentValues.length > 0
    ? rentValues.reduce((a, b) => a + b, 0) / rentValues.length
    : 0

  if (results.MONTHLY_RENT_FINAL === 0) {
    results.errors!.push('CRITICAL: No rent data available from any source')
  }

  return results as PropertyAPIData
}
