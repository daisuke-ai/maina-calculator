import axios from 'axios'

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY!

export async function fetchRentCastProperty(address: string) {
  try {
    const response = await axios.get('https://api.rentcast.io/v1/properties', {
      headers: { 'X-Api-Key': RENTCAST_API_KEY },
      params: { address },
    })
    return response.data?.[0] || null
  } catch (error) {
    console.error('RentCast property error:', error)
    return null
  }
}

export async function fetchRentCastRentEstimate(
  address: string, propertyType?: string, bedrooms?: number, bathrooms?: number
) {
  try {
    const params: any = { address }
    if (propertyType) params.propertyType = propertyType
    if (bedrooms) params.bedrooms = bedrooms
    if (bathrooms) params.bathrooms = bathrooms

    const response = await axios.get('https://api.rentcast.io/v1/avm/rent/long-term', {
      headers: { 'X-Api-Key': RENTCAST_API_KEY },
      params,
    })
    return response.data.rent || null
  } catch (error) {
    console.error('RentCast rent error:', error)
    return null
  }
}

export async function fetchRentCastValueEstimate(address: string) {
  try {
    const response = await axios.get('https://api.rentcast.io/v1/avm/value', {
      headers: { 'X-Api-Key': RENTCAST_API_KEY },
      params: { address },
    })
    return response.data || null
  } catch (error) {
    console.error('RentCast value estimate error:', error)
    return null
  }
}

export async function fetchRentCastSaleListing(address: string) {
  try {
    const response = await axios.get('https://api.rentcast.io/v1/listings/sale', {
      headers: { 'X-Api-Key': RENTCAST_API_KEY },
      params: {
        address,
        status: 'Active',
        limit: 1
      },
    })
    return response.data?.[0] || null
  } catch (error) {
    console.error('RentCast sale listing error:', error)
    return null
  }
}
