import { NextRequest, NextResponse } from 'next/server'
import { getCachedData, cacheData } from '@/lib/cache'
import { gatherPropertyData } from '@/lib/api/property-data'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    console.log('🔍 Searching for address:', address)

    const cachedData = await getCachedData(address)
    if (cachedData) {
      console.log('✅ Cache hit! Returning cached data')
      console.log('📊 Cached data preview:', {
        address: cachedData.ADDRESS,
        price: cachedData.LISTED_PRICE_FINAL,
        rent: cachedData.MONTHLY_RENT_FINAL,
        source: cachedData.PRICE_SOURCE
      })
      return NextResponse.json({ data: cachedData, cached: true })
    }

    console.log('❌ Cache miss. Fetching from APIs...')
    const propertyData = await gatherPropertyData(address)

    console.log('💾 Caching property data...')
    await cacheData(address, propertyData)

    console.log('✅ Property data fetched and cached')

    return NextResponse.json(
      {
        data: propertyData,
        cached: false,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('❌ Property fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
