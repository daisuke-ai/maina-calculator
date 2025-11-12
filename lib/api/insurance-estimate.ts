// Insurance estimation based on national averages and state risk factors

const STATE_INSURANCE_MULTIPLIERS: Record<string, number> = {
  // High-risk states (hurricanes, floods, severe weather)
  'FL': 2.5,  // Florida
  'LA': 2.2,  // Louisiana
  'TX': 1.8,  // Texas
  'OK': 1.7,  // Oklahoma (tornadoes)
  'AL': 1.6,  // Alabama
  'MS': 1.6,  // Mississippi
  'SC': 1.5,  // South Carolina
  'NC': 1.4,  // North Carolina
  'KS': 1.3,  // Kansas
  'NE': 1.2,  // Nebraska

  // Medium-risk states
  'CA': 1.3,  // California (earthquakes, fires)
  'GA': 1.2,  // Georgia
  'TN': 1.1,  // Tennessee
  'AR': 1.1,  // Arkansas
  'MO': 1.1,  // Missouri
  'AZ': 1.0,  // Arizona
  'NV': 1.0,  // Nevada
  'NY': 1.0,  // New York
  'NJ': 1.0,  // New Jersey

  // Low-risk states
  'OH': 0.9,  // Ohio
  'MI': 0.9,  // Michigan
  'PA': 0.85, // Pennsylvania
  'IN': 0.85, // Indiana
  'WI': 0.8,  // Wisconsin
  'IL': 0.9,  // Illinois
  'MA': 0.9,  // Massachusetts
  'OR': 0.8,  // Oregon
  'WA': 0.85, // Washington
  'CO': 0.85, // Colorado
  'UT': 0.7,  // Utah
  'ID': 0.7,  // Idaho
  'MT': 0.7,  // Montana
  'WY': 0.7,  // Wyoming
  'VT': 0.8,  // Vermont
  'NH': 0.8,  // New Hampshire
  'ME': 0.85, // Maine
}

const PROPERTY_TYPE_MULTIPLIERS: Record<string, number> = {
  'Single Family': 1.0,
  'Townhouse': 0.7,      // Shared walls reduce coverage
  'Condo': 0.5,          // HOA typically covers structure
  'Apartment': 0.5,      // Similar to condo
  'Multi Family': 1.2,   // More units = more coverage needed
  'Mobile': 0.6,         // Manufactured homes
}

// Zip code ranges to state mapping (simplified)
const ZIP_TO_STATE: [number, number, string][] = [
  [35000, 36999, 'AL'],
  [99500, 99999, 'AK'],
  [85000, 86999, 'AZ'],
  [71600, 72999, 'AR'],
  [90000, 96699, 'CA'],
  [80000, 81999, 'CO'],
  [6000, 6999, 'CT'],
  [19700, 19999, 'DE'],
  [32000, 34999, 'FL'],
  [30000, 31999, 'GA'],
  [96700, 96999, 'HI'],
  [83200, 83999, 'ID'],
  [60000, 62999, 'IL'],
  [46000, 47999, 'IN'],
  [50000, 52999, 'IA'],
  [66000, 67999, 'KS'],
  [40000, 42999, 'KY'],
  [70000, 71599, 'LA'],
  [3900, 4999, 'ME'],
  [20600, 21999, 'MD'],
  [1000, 2799, 'MA'],
  [48000, 49999, 'MI'],
  [55000, 56999, 'MN'],
  [38600, 39999, 'MS'],
  [63000, 65999, 'MO'],
  [59000, 59999, 'MT'],
  [68000, 69999, 'NE'],
  [88900, 89999, 'NV'],
  [3000, 3899, 'NH'],
  [7000, 8999, 'NJ'],
  [87000, 88499, 'NM'],
  [10000, 14999, 'NY'],
  [27000, 28999, 'NC'],
  [58000, 58999, 'ND'],
  [43000, 45999, 'OH'],
  [73000, 74999, 'OK'],
  [97000, 97999, 'OR'],
  [15000, 19699, 'PA'],
  [2800, 2999, 'RI'],
  [29000, 29999, 'SC'],
  [57000, 57999, 'SD'],
  [37000, 38599, 'TN'],
  [75000, 79999, 'TX'],
  [84000, 84999, 'UT'],
  [5000, 5999, 'VT'],
  [20100, 20599, 'VA'],
  [22000, 24699, 'VA'],
  [98000, 99499, 'WA'],
  [24700, 26999, 'WV'],
  [53000, 54999, 'WI'],
  [82000, 83199, 'WY'],
]

function getStateFromZip(zipCode: string): string {
  const zip = parseInt(zipCode.substring(0, 5))

  for (const [min, max, state] of ZIP_TO_STATE) {
    if (zip >= min && zip <= max) {
      return state
    }
  }

  return 'US' // Default fallback
}

export function calculateInsuranceEstimate(
  homeValue: number,
  zipCode: string,
  propertyType?: string
): number {
  // Base rate: $1,400 per $100,000 of home value (national average)
  const baseRate = 1400
  const perHundredK = homeValue / 100000
  let estimate = baseRate * perHundredK

  // Apply state multiplier based on risk factors
  const stateCode = getStateFromZip(zipCode)
  const stateMultiplier = STATE_INSURANCE_MULTIPLIERS[stateCode] || 1.0
  estimate *= stateMultiplier

  // Apply property type multiplier
  const normalizedType = normalizePropertyType(propertyType)
  const typeMultiplier = PROPERTY_TYPE_MULTIPLIERS[normalizedType] || 1.0
  estimate *= typeMultiplier

  // Round to nearest $50 for cleaner numbers
  return Math.round(estimate / 50) * 50
}

function normalizePropertyType(propertyType?: string): string {
  if (!propertyType) return 'Single Family'

  const lower = propertyType.toLowerCase()

  if (lower.includes('single') || lower.includes('sfr')) return 'Single Family'
  if (lower.includes('town')) return 'Townhouse'
  if (lower.includes('condo')) return 'Condo'
  if (lower.includes('apartment') || lower.includes('apt')) return 'Apartment'
  if (lower.includes('multi')) return 'Multi Family'
  if (lower.includes('mobile') || lower.includes('manufactured')) return 'Mobile'

  return 'Single Family' // Default
}

export function getInsuranceEstimateDetails(
  homeValue: number,
  zipCode: string,
  propertyType?: string
): {
  estimate: number
  stateCode: string
  stateMultiplier: number
  propertyTypeMultiplier: number
  baseRate: number
} {
  const stateCode = getStateFromZip(zipCode)
  const stateMultiplier = STATE_INSURANCE_MULTIPLIERS[stateCode] || 1.0
  const normalizedType = normalizePropertyType(propertyType)
  const propertyTypeMultiplier = PROPERTY_TYPE_MULTIPLIERS[normalizedType] || 1.0
  const baseRate = 1400
  const estimate = calculateInsuranceEstimate(homeValue, zipCode, propertyType)

  return {
    estimate,
    stateCode,
    stateMultiplier,
    propertyTypeMultiplier,
    baseRate
  }
}
