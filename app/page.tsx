'use client'

import React, { useState } from 'react'
import { AddressInput } from '@/components/AddressInput'
import { FinancialDetailsForm } from '@/components/FinancialDetailsForm'
import { ConfigurationDisplay } from '@/components/ConfigurationDisplay'
import { ResultsTable } from '@/components/ResultsTable'
import { InputSummary } from '@/components/InputSummary'
import { PropertyAPIData, PropertyData, OfferResult } from '@/lib/calculator/types'
import { TrendingUp, RotateCcw, AlertCircle, Calculator } from 'lucide-react'

export default function Home() {
  const [propertyAPIData, setPropertyAPIData] = useState<PropertyAPIData | null>(null)
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [offers, setOffers] = useState<OfferResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDataFetched = React.useCallback((data: PropertyAPIData) => {
    setPropertyAPIData(data)
    setPropertyData({
      listed_price: data.LISTED_PRICE_FINAL || 0,
      monthly_rent: data.MONTHLY_RENT_FINAL || 0,
      monthly_property_tax: data.ANNUAL_TAX_FINAL_MONTHLY || 0,
      monthly_insurance: data.ANNUAL_INSURANCE_FINAL_MONTHLY || 0,
      monthly_hoa_fee: data.MONTHLY_HOA_FEE_FINAL || 0,
      monthly_other_fees: 150,
    })
    setOffers([])
    setError(null)
  }, [])

  const handleFormChange = React.useCallback((data: PropertyData) => {
    setPropertyData(data)
  }, [])

  const handleAnalyze = async () => {
    if (!propertyData) return

    setLoading(true)
    setError(null)
    setOffers([])
    try {
      const response = await fetch('/api/calculate-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to calculate offers')
      }

      setOffers(result.offers)

      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section')
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setPropertyAPIData(null)
    setPropertyData(null)
    setOffers([])
    setLoading(false)
    setError(null)

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        {!propertyAPIData && (
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted shadow-lg mb-6">
              <Calculator className="w-10 h-10 text-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-4">
              Miana Seller Finance Tool
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Analyze real estate investment opportunities with comprehensive financial modeling.
              Get three detailed offer scenarios instantly based on actual market data.
            </p>
          </div>
        )}

        {/* Step 1: Address Input */}
        <AddressInput onDataFetched={handleDataFetched} />

        {/* Step 2: Financial Details & Configuration */}
        {propertyAPIData && propertyData && (
          <>
            <FinancialDetailsForm
              propertyAPIData={propertyAPIData}
              onFormChange={handleFormChange}
            />

            <ConfigurationDisplay />

            {/* Action Buttons */}
            <div className="w-full max-w-4xl mx-auto mt-8">
              <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                    <TrendingUp className="w-6 h-6 text-accent" />
                    Ready to Analyze
                  </h3>
                  <p className="text-muted-foreground">
                    Generate three investment scenarios: Owner Favored, Balanced, and Buyer Favored
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || !propertyData}
                    className={`
                      flex-1 h-14 px-8
                      font-bold text-lg
                      rounded-xl shadow-lg
                      transition-all duration-200
                      flex items-center justify-center gap-3
                      ${loading || !propertyData
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                      }
                    `}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Calculating Offers...</span>
                      </>
                    ) : (
                      <>
                        <Calculator className="w-5 h-5" />
                        <span>Analyze Property</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleClear}
                    disabled={loading}
                    className={`
                      flex-1 sm:flex-none h-14 px-8
                      font-semibold text-base
                      rounded-xl
                      transition-all duration-200
                      flex items-center justify-center gap-2
                      ${loading
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-secondary text-secondary-foreground border-2 border-border hover:bg-secondary/80 hover:border-border/80'
                      }
                    `}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Start Over</span>
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-destructive">Analysis Error</p>
                        <p className="text-sm text-destructive/90 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Results */}
            {offers.length > 0 && (
              <div id="results-section" className="scroll-mt-8">
                <InputSummary
                  propertyAPIData={propertyAPIData}
                  propertyData={propertyData}
                />
                <ResultsTable
                  offers={offers}
                  propertyAddress={propertyAPIData.ADDRESS}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
