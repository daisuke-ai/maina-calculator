import { NextRequest, NextResponse } from 'next/server'
import { SellerFinanceCalculator } from '@/lib/calculator/calculator'
import { PropertyData } from '@/lib/calculator/types'

export async function POST(request: NextRequest) {
  try {
    const propertyData: PropertyData = await request.json()

    if (!propertyData.listed_price || !propertyData.monthly_rent) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const calculator = new SellerFinanceCalculator()
    const offers = calculator.calculateAllOffers(propertyData)

    return NextResponse.json({ offers })
  } catch (error) {
    console.error('Calculation error:', error)
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
  }
}
