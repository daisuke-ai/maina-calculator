'use client'

import React, { useState } from 'react'
import { PropertyAPIData } from '@/lib/calculator/types'
import { Search, AlertCircle, CheckCircle2, MapPin } from 'lucide-react'

interface AddressInputProps {
  onDataFetched: (data: PropertyAPIData) => void
}

export function AddressInput({ onDataFetched }: AddressInputProps) {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFetchData = async () => {
    if (!address.trim()) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/fetch-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch property data')
      }

      setSuccess(true)
      onDataFetched(result.data)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && address.trim()) {
      handleFetchData()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Input Card */}
      <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="p-8">
          {/* Input Label */}
          <label htmlFor="property-address" className="block text-sm font-semibold text-foreground mb-3">
            Property Address
          </label>

          {/* Input Group */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className={`w-5 h-5 ${loading ? 'text-muted-foreground animate-pulse' : 'text-muted-foreground'}`} />
              </div>
              <input
                id="property-address"
                type="text"
                placeholder="e.g., 123 Main Street, Columbus, OH 43215"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className={`
                  w-full h-14 pl-12 pr-4
                  text-base font-medium text-foreground placeholder:text-muted-foreground
                  bg-background border-2 rounded-xl
                  transition-all duration-200
                  ${loading
                    ? 'border-border bg-muted cursor-not-allowed'
                    : 'border-border hover:border-ring focus:border-ring focus:ring-4 focus:ring-ring/20'
                  }
                  disabled:opacity-60
                `}
                aria-label="Property address input"
                aria-describedby="address-hint"
              />
            </div>

            <button
              onClick={handleFetchData}
              disabled={loading || !address.trim()}
              className={`
                min-w-[160px] h-14 px-8
                font-semibold text-base
                rounded-xl shadow-lg
                transition-all duration-200
                flex items-center justify-center gap-2
                ${loading || !address.trim()
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
              aria-label={loading ? 'Fetching property data' : 'Fetch property data'}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>

          {/* Helper Text */}
          <p id="address-hint" className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            Enter the complete address including street, city, state, and ZIP code for best results
          </p>
        </div>

        {/* Success Message */}
        {success && !error && (
          <div className="px-8 pb-6">
            <div className="flex items-start gap-3 p-4 bg-accent/10 border-l-4 border-accent rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Property data loaded successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Review the financial details below and click "Analyze Property" when ready.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-8 pb-6">
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">Unable to fetch property data</p>
                <p className="text-sm text-destructive/90 mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-sm font-medium text-destructive hover:text-destructive/80 underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State Details */}
        {loading && (
          <div className="px-8 pb-6">
            <div className="flex items-center gap-3 p-4 bg-muted border-l-4 border-border rounded-lg">
              <div className="w-5 h-5 border-3 border-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Fetching property data...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Gathering information from multiple sources. This may take a few seconds.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-muted rounded-xl p-4 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-secondary-foreground">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Enter Address</h3>
              <p className="text-xs text-muted-foreground mt-1">Include full street address and ZIP code</p>
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-xl p-4 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-secondary-foreground">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Review Data</h3>
              <p className="text-xs text-muted-foreground mt-1">Verify pricing and financial details</p>
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-xl p-4 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-secondary-foreground">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Get Analysis</h3>
              <p className="text-xs text-muted-foreground mt-1">View investment scenarios and ROI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
