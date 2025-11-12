import axios from 'axios'

const RENTOMETER_API_KEY = process.env.RENTOMETER_API_KEY!

export async function fetchRentometerEstimate(
  address: string, bedrooms: number, propertyType?: string, bathrooms?: number
) {
  try {
    const params: any = { api_key: RENTOMETER_API_KEY, address, bedrooms }
    
    if (propertyType) {
      if (['SINGLE_FAMILY', 'TOWNHOUSE'].includes(propertyType)) {
        params.building_type = 'house'
      } else if (['CONDO', 'APARTMENT', 'MULTI_FAMILY'].includes(propertyType)) {
        params.building_type = 'apartment'
      }
    }
    
    if (bathrooms) {
      params.baths = bathrooms === 1 ? '1' : '1.5+'
    }
    
    const response = await axios.get('https://www.rentometer.com/api/v1/summary', { params })
    return response.data.percentile_25 || null
  } catch (error) {
    console.error('Rentometer error:', error)
    return null
  }
}
