import { supabase } from './supabase'
import crypto from 'crypto'

export function generateAddressHash(address: string): string {
  return crypto.createHash('sha256').update(address.toLowerCase().trim()).digest('hex')
}

// Migrate old cached data format to new format
function migrateOldCacheData(oldData: Record<string, any>): Record<string, any> {
  // If it already has new format, return as-is
  if (oldData.LISTED_PRICE_FINAL !== undefined) {
    return oldData
  }

  // Transform old Zillow-based format to new RentCast format
  const newData: Record<string, any> = { ...oldData }

  // Migrate property price
  newData.LISTED_PRICE_FINAL = oldData.LISTED_PRICE_ZILLOW || oldData.LAST_SALE_PRICE || 0
  newData.PRICE_SOURCE = oldData.LISTED_PRICE_ZILLOW ? 'Zillow (Legacy)' : 'Last Sale Price'

  // Migrate property type
  newData.PROPERTY_TYPE_RENTCAST = oldData.PROPERTY_TYPE_ZILLOW

  // Migrate insurance (keep Zillow values if available)
  if (oldData.ANNUAL_INSURANCE_ZILLOW !== undefined) {
    newData.ANNUAL_INSURANCE_ESTIMATED = oldData.ANNUAL_INSURANCE_ZILLOW
  }

  // Keep all existing fields for backward compatibility
  return newData
}

export async function getCachedData(address: string): Promise<Record<string, any> | null> {
  try {
    if (!supabase) {
      console.warn('⚠️ Supabase not configured. Skipping cache lookup.')
      return null
    }

    const addressHash = generateAddressHash(address)
    const { data, error } = await supabase
      .from('api_cache')
      .select('payload_json')
      .eq('address_hash', addressHash)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📭 No cache entry found for address')
        return null
      }
      console.error('❌ Cache fetch error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    const cachedData = data?.payload_json || null

    // Migrate old data format to new format
    if (cachedData) {
      console.log('✅ Cache hit! Migrating data format if needed...')
      return migrateOldCacheData(cachedData)
    }

    return null
  } catch (error: any) {
    console.error('❌ Cache error:', error.message || error)
    return null
  }
}

export async function cacheData(address: string, payload: Record<string, any>): Promise<boolean> {
  try {
    const addressHash = generateAddressHash(address)
    const { error } = await supabase.from('api_cache').insert({
      address_hash: addressHash,
      payload_json: payload
    })
    
    if (error) {
      if (error.code === '23505') {
        const { error: updateError } = await supabase
          .from('api_cache')
          .update({ payload_json: payload })
          .eq('address_hash', addressHash)
        return !updateError
      }
      return false
    }
    return true
  } catch (error) {
    console.error('Cache write error:', error)
    return false
  }
}
