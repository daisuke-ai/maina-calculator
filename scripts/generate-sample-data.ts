import crypto from 'crypto'

function generateAddressHash(address: string): string {
  return crypto.createHash('sha256').update(address.toLowerCase().trim()).digest('hex')
}

// Sample addresses with realistic data
const sampleProperties = [
  {
    address: '123 Main Street, Columbus, OH 43215',
    data: {
      ADDRESS: '123 Main Street, Columbus, OH 43215',
      ZPID: '34567890',
      zipCode: '43215',
      PROPERTY_TYPE_ZILLOW: 'SINGLE_FAMILY',
      BEDROOMS: 3,
      BATHROOMS: 2,
      LISTED_PRICE_ZILLOW: 87000,
      MONTHLY_HOA_FEE_ZILLOW: 0,
      ANNUAL_TAX_ZILLOW: 1140,
      ANNUAL_INSURANCE_ZILLOW: 960,
      MONTHLY_HOA_FEE_RENTCAST: 0,
      ANNUAL_TAX_RENTCAST_LATEST: 1140,
      MONTHLY_RENT_ZILLOW_COMPS: 1150,
      MONTHLY_RENT_RENTCAST_AVM: 1200,
      MONTHLY_RENT_RENTOMETER_P25: 1100,
      MONTHLY_RENT_FINAL: 1150,
      MONTHLY_HOA_FEE_FINAL: 0,
      ANNUAL_TAX_FINAL: 1140,
      ANNUAL_TAX_FINAL_MONTHLY: 95,
      ANNUAL_INSURANCE_FINAL_MONTHLY: 80,
      PROPERTY_TAXES_RENTCAST: [
        { year: 2024, assessedValue: 75000, total: 1140 },
        { year: 2023, assessedValue: 72000, total: 1080 }
      ],
      TAX_ASSESSMENTS_RENTCAST: [
        { year: 2024, assessedValue: 75000, landValue: 20000, improvementsValue: 55000 }
      ],
      BEDROOMS_RENTCAST: 3,
      BATHROOMS_RENTCAST: 2,
      errors: []
    }
  },
  {
    address: '456 Oak Avenue, Indianapolis, IN 46203',
    data: {
      ADDRESS: '456 Oak Avenue, Indianapolis, IN 46203',
      ZPID: '45678901',
      zipCode: '46203',
      PROPERTY_TYPE_ZILLOW: 'SINGLE_FAMILY',
      BEDROOMS: 3,
      BATHROOMS: 2.5,
      LISTED_PRICE_ZILLOW: 99000,
      MONTHLY_HOA_FEE_ZILLOW: 0,
      ANNUAL_TAX_ZILLOW: 1560,
      ANNUAL_INSURANCE_ZILLOW: 1140,
      MONTHLY_HOA_FEE_RENTCAST: 0,
      ANNUAL_TAX_RENTCAST_LATEST: 1560,
      MONTHLY_RENT_ZILLOW_COMPS: 1025,
      MONTHLY_RENT_RENTCAST_AVM: 1050,
      MONTHLY_RENT_RENTOMETER_P25: 1000,
      MONTHLY_RENT_FINAL: 1025,
      MONTHLY_HOA_FEE_FINAL: 0,
      ANNUAL_TAX_FINAL: 1560,
      ANNUAL_TAX_FINAL_MONTHLY: 130,
      ANNUAL_INSURANCE_FINAL_MONTHLY: 95,
      PROPERTY_TAXES_RENTCAST: [
        { year: 2024, assessedValue: 85000, total: 1560 },
        { year: 2023, assessedValue: 82000, total: 1500 }
      ],
      TAX_ASSESSMENTS_RENTCAST: [
        { year: 2024, assessedValue: 85000, landValue: 22000, improvementsValue: 63000 }
      ],
      BEDROOMS_RENTCAST: 3,
      BATHROOMS_RENTCAST: 2.5,
      errors: []
    }
  },
  {
    address: '789 Pine Street, Cleveland, OH 44102',
    data: {
      ADDRESS: '789 Pine Street, Cleveland, OH 44102',
      ZPID: '56789012',
      zipCode: '44102',
      PROPERTY_TYPE_ZILLOW: 'SINGLE_FAMILY',
      BEDROOMS: 4,
      BATHROOMS: 2,
      LISTED_PRICE_ZILLOW: 125000,
      MONTHLY_HOA_FEE_ZILLOW: 0,
      ANNUAL_TAX_ZILLOW: 2100,
      ANNUAL_INSURANCE_ZILLOW: 1320,
      MONTHLY_HOA_FEE_RENTCAST: 0,
      ANNUAL_TAX_RENTCAST_LATEST: 2100,
      MONTHLY_RENT_ZILLOW_COMPS: 1400,
      MONTHLY_RENT_RENTCAST_AVM: 1450,
      MONTHLY_RENT_RENTOMETER_P25: 1350,
      MONTHLY_RENT_FINAL: 1400,
      MONTHLY_HOA_FEE_FINAL: 0,
      ANNUAL_TAX_FINAL: 2100,
      ANNUAL_TAX_FINAL_MONTHLY: 175,
      ANNUAL_INSURANCE_FINAL_MONTHLY: 110,
      PROPERTY_TAXES_RENTCAST: [
        { year: 2024, assessedValue: 105000, total: 2100 },
        { year: 2023, assessedValue: 100000, total: 2000 }
      ],
      TAX_ASSESSMENTS_RENTCAST: [
        { year: 2024, assessedValue: 105000, landValue: 30000, improvementsValue: 75000 }
      ],
      BEDROOMS_RENTCAST: 4,
      BATHROOMS_RENTCAST: 2,
      errors: []
    }
  },
  {
    address: '321 Elm Drive, Detroit, MI 48205',
    data: {
      ADDRESS: '321 Elm Drive, Detroit, MI 48205',
      ZPID: '67890123',
      zipCode: '48205',
      PROPERTY_TYPE_ZILLOW: 'SINGLE_FAMILY',
      BEDROOMS: 3,
      BATHROOMS: 1.5,
      LISTED_PRICE_ZILLOW: 65000,
      MONTHLY_HOA_FEE_ZILLOW: 0,
      ANNUAL_TAX_ZILLOW: 900,
      ANNUAL_INSURANCE_ZILLOW: 780,
      MONTHLY_HOA_FEE_RENTCAST: 0,
      ANNUAL_TAX_RENTCAST_LATEST: 900,
      MONTHLY_RENT_ZILLOW_COMPS: 950,
      MONTHLY_RENT_RENTCAST_AVM: 975,
      MONTHLY_RENT_RENTOMETER_P25: 925,
      MONTHLY_RENT_FINAL: 950,
      MONTHLY_HOA_FEE_FINAL: 0,
      ANNUAL_TAX_FINAL: 900,
      ANNUAL_TAX_FINAL_MONTHLY: 75,
      ANNUAL_INSURANCE_FINAL_MONTHLY: 65,
      PROPERTY_TAXES_RENTCAST: [
        { year: 2024, assessedValue: 55000, total: 900 },
        { year: 2023, assessedValue: 53000, total: 875 }
      ],
      TAX_ASSESSMENTS_RENTCAST: [
        { year: 2024, assessedValue: 55000, landValue: 15000, improvementsValue: 40000 }
      ],
      BEDROOMS_RENTCAST: 3,
      BATHROOMS_RENTCAST: 1.5,
      errors: []
    }
  },
  {
    address: '555 Maple Court, Cincinnati, OH 45202',
    data: {
      ADDRESS: '555 Maple Court, Cincinnati, OH 45202',
      ZPID: '78901234',
      zipCode: '45202',
      PROPERTY_TYPE_ZILLOW: 'TOWNHOUSE',
      BEDROOMS: 2,
      BATHROOMS: 2.5,
      LISTED_PRICE_ZILLOW: 145000,
      MONTHLY_HOA_FEE_ZILLOW: 150,
      ANNUAL_TAX_ZILLOW: 2400,
      ANNUAL_INSURANCE_ZILLOW: 1200,
      MONTHLY_HOA_FEE_RENTCAST: 150,
      ANNUAL_TAX_RENTCAST_LATEST: 2400,
      MONTHLY_RENT_ZILLOW_COMPS: 1650,
      MONTHLY_RENT_RENTCAST_AVM: 1700,
      MONTHLY_RENT_RENTOMETER_P25: 1600,
      MONTHLY_RENT_FINAL: 1650,
      MONTHLY_HOA_FEE_FINAL: 150,
      ANNUAL_TAX_FINAL: 2400,
      ANNUAL_TAX_FINAL_MONTHLY: 200,
      ANNUAL_INSURANCE_FINAL_MONTHLY: 100,
      PROPERTY_TAXES_RENTCAST: [
        { year: 2024, assessedValue: 125000, total: 2400 },
        { year: 2023, assessedValue: 120000, total: 2300 }
      ],
      TAX_ASSESSMENTS_RENTCAST: [
        { year: 2024, assessedValue: 125000, landValue: 35000, improvementsValue: 90000 }
      ],
      BEDROOMS_RENTCAST: 2,
      BATHROOMS_RENTCAST: 2.5,
      errors: []
    }
  }
]

// Generate SQL INSERT statements
console.log('-- ============================================')
console.log('-- Sample Data for api_cache table')
console.log('-- Generated on:', new Date().toISOString())
console.log('-- ============================================\n')

sampleProperties.forEach((property, index) => {
  const addressHash = generateAddressHash(property.address)
  const payloadJson = JSON.stringify(property.data)

  console.log(`-- Sample Property ${index + 1}: ${property.address}`)
  console.log(`INSERT INTO api_cache (address_hash, payload_json) VALUES (`)
  console.log(`  '${addressHash}',`)
  console.log(`  '${payloadJson}'::jsonb`)
  console.log(`)`)
  console.log(`ON CONFLICT (address_hash) DO UPDATE`)
  console.log(`SET payload_json = EXCLUDED.payload_json;\n`)
})

console.log('-- ============================================')
console.log('-- Quick Reference: Test Addresses')
console.log('-- ============================================')
console.log('/*')
sampleProperties.forEach((property, index) => {
  console.log(`${index + 1}. ${property.address}`)
  console.log(`   - Listed Price: $${property.data.LISTED_PRICE_ZILLOW.toLocaleString()}`)
  console.log(`   - Monthly Rent: $${property.data.MONTHLY_RENT_FINAL.toLocaleString()}`)
  console.log(`   - Bedrooms: ${property.data.BEDROOMS}, Bathrooms: ${property.data.BATHROOMS}`)
  console.log(`   - Property Type: ${property.data.PROPERTY_TYPE_ZILLOW}`)
  console.log('')
})
console.log('*/')
