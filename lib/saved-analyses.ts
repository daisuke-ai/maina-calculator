import { supabase } from './supabase'
import { OfferResult } from './calculator/types'

export interface SavedAnalysis {
  id: string
  user_id: string
  property_address: string
  property_data: Record<string, any>
  offers: OfferResult[]
  created_at: string
}

export async function saveAnalysis(
  propertyAddress: string,
  propertyData: Record<string, any>,
  offers: OfferResult[]
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('saved_analyses')
      .insert({
        property_address: propertyAddress,
        property_data: propertyData,
        offers: offers,
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  } catch (error) {
    console.error('Error saving analysis:', error)
    return null
  }
}

export async function loadAnalyses(): Promise<SavedAnalysis[]> {
  try {
    const { data, error } = await supabase
      .from('saved_analyses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error loading analyses:', error)
    return []
  }
}
