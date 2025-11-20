'use client'

import React, { useState, useEffect } from 'react'
import { PropertyData, OfferResult } from '@/lib/calculator/types'
import { DynamicCalculator, DynamicOfferData } from '@/lib/calculator/dynamic-calculator'
import { Lock, Unlock, Calculator, TrendingUp, DollarSign } from 'lucide-react'

interface DynamicResultsTableProps {
  propertyData: PropertyData
  initialOffers: OfferResult[]
}

export default function DynamicResultsTable({ propertyData, initialOffers }: DynamicResultsTableProps) {
  const calculator = new DynamicCalculator()

  // Initialize dynamic offers for each type
  const [ownerOffer, setOwnerOffer] = useState<DynamicOfferData>(
    calculator.createDynamicOffer(propertyData, 'owner_favored')
  )
  const [balancedOffer, setBalancedOffer] = useState<DynamicOfferData>(
    calculator.createDynamicOffer(propertyData, 'balanced')
  )
  const [buyerOffer, setBuyerOffer] = useState<DynamicOfferData>(
    calculator.createDynamicOffer(propertyData, 'buyer_favored')
  )

  // Track which fields are being edited
  const [editingField, setEditingField] = useState<{ offer: string; field: string } | null>(null)
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set())

  // Handle field updates
  const handleFieldChange = (
    offerType: 'owner' | 'balanced' | 'buyer',
    field: keyof DynamicOfferData,
    value: number
  ) => {
    const currentOffer = offerType === 'owner' ? ownerOffer :
                        offerType === 'balanced' ? balancedOffer : buyerOffer
    const setOffer = offerType === 'owner' ? setOwnerOffer :
                     offerType === 'balanced' ? setBalancedOffer : setBuyerOffer

    const updated = calculator.updateField(currentOffer, field, value, propertyData)
    setOffer(updated)
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Format percent
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Render editable field
  const renderEditableField = (
    offerType: 'owner' | 'balanced' | 'buyer',
    field: keyof DynamicOfferData,
    value: number,
    format: 'currency' | 'percent' | 'number' = 'currency',
    constraints?: { min?: number; max?: number; step?: number }
  ) => {
    const offer = offerType === 'owner' ? ownerOffer :
                  offerType === 'balanced' ? balancedOffer : buyerOffer
    const isEditing = editingField?.offer === offerType && editingField?.field === field
    const isLocked = lockedFields.has(`${offerType}-${field}`)

    if (isEditing && !isLocked) {
      return (
        <div className="flex items-center space-x-1">
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(offerType, field, parseFloat(e.target.value) || 0)}
            onBlur={() => setEditingField(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditingField(null)
            }}
            min={constraints?.min}
            max={constraints?.max}
            step={constraints?.step || 0.1}
            className="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={() => setEditingField(null)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ✓
          </button>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-between group">
        <span className={`${!offer.is_valid && 'text-red-600'}`}>
          {format === 'currency' ? formatCurrency(value) :
           format === 'percent' ? formatPercent(value) :
           value.toFixed(0)}
        </span>
        <button
          onClick={() => {
            if (isLocked) {
              setLockedFields(prev => {
                const next = new Set(prev)
                next.delete(`${offerType}-${field}`)
                return next
              })
            } else {
              setEditingField({ offer: offerType, field: field as string })
            }
          }}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </div>
    )
  }

  // Render validation errors
  const renderValidationErrors = (offer: DynamicOfferData) => {
    if (offer.validation_errors.length === 0) return null

    return (
      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
        {offer.validation_errors.map((error, i) => (
          <div key={i} className="text-red-600">• {error}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">✨ Dynamic Calculator</h3>
        <p className="text-sm text-blue-700">
          Click any underlined value to edit it. All related fields will automatically update!
        </p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border p-3 text-left">Metric</th>
            <th className="border p-3 text-center">
              Owner Favored
              <div className="text-xs text-gray-500 font-normal">10% above list</div>
            </th>
            <th className="border p-3 text-center">
              Balanced
              <div className="text-xs text-gray-500 font-normal">5% above list</div>
            </th>
            <th className="border p-3 text-center">
              Buyer Favored
              <div className="text-xs text-gray-500 font-normal">Listed price</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Offer Price */}
          <tr className="hover:bg-gray-50">
            <td className="border p-3 font-medium">
              <div className="flex items-center">
                <DollarSign size={16} className="mr-2 text-gray-500" />
                Offer Price
              </div>
            </td>
            <td className="border p-3 text-center">
              {renderEditableField('owner', 'offer_price', ownerOffer.offer_price)}
            </td>
            <td className="border p-3 text-center">
              {renderEditableField('balanced', 'offer_price', balancedOffer.offer_price)}
            </td>
            <td className="border p-3 text-center">
              {renderEditableField('buyer', 'offer_price', buyerOffer.offer_price)}
            </td>
          </tr>

          {/* Down Payment */}
          <tr className="hover:bg-gray-50">
            <td className="border p-3 font-medium">Down Payment</td>
            <td className="border p-3 text-center">
              <div>
                {renderEditableField('owner', 'down_payment', ownerOffer.down_payment)}
                <div className="text-xs text-gray-500 mt-1">
                  {renderEditableField('owner', 'down_payment_percent', ownerOffer.down_payment_percent, 'percent', { min: 5, max: 10, step: 0.5 })}
                </div>
              </div>
            </td>
            <td className="border p-3 text-center">
              <div>
                {renderEditableField('balanced', 'down_payment', balancedOffer.down_payment)}
                <div className="text-xs text-gray-500 mt-1">
                  {renderEditableField('balanced', 'down_payment_percent', balancedOffer.down_payment_percent, 'percent', { min: 5, max: 10, step: 0.5 })}
                </div>
              </div>
            </td>
            <td className="border p-3 text-center">
              <div>
                {renderEditableField('buyer', 'down_payment', buyerOffer.down_payment)}
                <div className="text-xs text-gray-500 mt-1">
                  {renderEditableField('buyer', 'down_payment_percent', buyerOffer.down_payment_percent, 'percent', { min: 5, max: 10, step: 0.5 })}
                </div>
              </div>
            </td>
          </tr>

          {/* Entry Fee */}
          <tr className="hover:bg-gray-50">
            <td className="border p-3 font-medium">Entry Fee</td>
            <td className="border p-3 text-center">
              <div>
                {renderEditableField('owner', 'entry_fee_amount', ownerOffer.entry_fee_amount)}
                <div className="text-xs text-gray-500 mt-1">
                  {renderEditableField('owner', 'entry_fee_percent', ownerOffer.entry_fee_percent, 'percent', { max: 20, step: 0.5 })}
                </div>
              </div>
            </td>
            <td className="border p-3 text-center">
              <div>
                {renderEditableField('balanced', 'entry_fee_amount', balancedOffer.entry_fee_amount)}
                <div className="text-xs text-gray-500 mt-1">
                  {renderEditableField('balanced', 'entry_fee_percent', balancedOffer.entry_fee_percent, 'percent', { max: 20, step: 0.5 })}
                </div>
              </div>
            </td>
            <td className="border p-3 text-center">
              <div>
                {renderEditableField('buyer', 'entry_fee_amount', buyerOffer.entry_fee_amount)}
                <div className="text-xs text-gray-500 mt-1">
                  {renderEditableField('buyer', 'entry_fee_percent', buyerOffer.entry_fee_percent, 'percent', { max: 20, step: 0.5 })}
                </div>
              </div>
            </td>
          </tr>

          {/* Entry Fee Breakdown */}
          <tr className="bg-gray-50">
            <td className="border p-3 text-sm italic pl-8">→ Down Payment</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(ownerOffer.down_payment)}</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(balancedOffer.down_payment)}</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(buyerOffer.down_payment)}</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="border p-3 text-sm italic pl-8">→ Rehab Cost</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(ownerOffer.rehab_cost)}</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(balancedOffer.rehab_cost)}</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(buyerOffer.rehab_cost)}</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="border p-3 text-sm italic pl-8">→ Closing Cost</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(ownerOffer.closing_cost)}</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(balancedOffer.closing_cost)}</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(buyerOffer.closing_cost)}</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="border p-3 text-sm italic pl-8">→ Assignment Fee</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(ownerOffer.assignment_fee)}</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(balancedOffer.assignment_fee)}</td>
            <td className="border p-3 text-center text-sm">{formatCurrency(buyerOffer.assignment_fee)}</td>
          </tr>

          {/* Loan Amount */}
          <tr className="hover:bg-gray-50">
            <td className="border p-3 font-medium">Loan Amount</td>
            <td className="border p-3 text-center">{formatCurrency(ownerOffer.loan_amount)}</td>
            <td className="border p-3 text-center">{formatCurrency(balancedOffer.loan_amount)}</td>
            <td className="border p-3 text-center">{formatCurrency(buyerOffer.loan_amount)}</td>
          </tr>

          {/* Amortization */}
          <tr className="hover:bg-gray-50">
            <td className="border p-3 font-medium">Amortization</td>
            <td className="border p-3 text-center">
              {renderEditableField('owner', 'amortization_years', ownerOffer.amortization_years, 'number', { min: 1, max: 40, step: 1 })}
              <span className="ml-1 text-sm text-gray-500">years</span>
            </td>
            <td className="border p-3 text-center">
              {renderEditableField('balanced', 'amortization_years', balancedOffer.amortization_years, 'number', { min: 1, max: 40, step: 1 })}
              <span className="ml-1 text-sm text-gray-500">years</span>
            </td>
            <td className="border p-3 text-center">
              {renderEditableField('buyer', 'amortization_years', buyerOffer.amortization_years, 'number', { min: 1, max: 40, step: 1 })}
              <span className="ml-1 text-sm text-gray-500">years</span>
            </td>
          </tr>

          {/* Monthly Payment */}
          <tr className="hover:bg-gray-50">
            <td className="border p-3 font-medium">Monthly Payment</td>
            <td className="border p-3 text-center">
              {renderEditableField('owner', 'monthly_payment', ownerOffer.monthly_payment)}
            </td>
            <td className="border p-3 text-center">
              {renderEditableField('balanced', 'monthly_payment', balancedOffer.monthly_payment)}
            </td>
            <td className="border p-3 text-center">
              {renderEditableField('buyer', 'monthly_payment', buyerOffer.monthly_payment)}
            </td>
          </tr>

          {/* Monthly Cash Flow */}
          <tr className="hover:bg-gray-50">
            <td className="border p-3 font-medium">
              <div className="flex items-center">
                <TrendingUp size={16} className="mr-2 text-green-500" />
                Monthly Cash Flow
              </div>
            </td>
            <td className={`border p-3 text-center font-semibold ${ownerOffer.monthly_cash_flow >= 200 ? 'text-green-600' : 'text-amber-600'}`}>
              {formatCurrency(ownerOffer.monthly_cash_flow)}
            </td>
            <td className={`border p-3 text-center font-semibold ${balancedOffer.monthly_cash_flow >= 200 ? 'text-green-600' : 'text-amber-600'}`}>
              {formatCurrency(balancedOffer.monthly_cash_flow)}
            </td>
            <td className={`border p-3 text-center font-semibold ${buyerOffer.monthly_cash_flow >= 200 ? 'text-green-600' : 'text-amber-600'}`}>
              {formatCurrency(buyerOffer.monthly_cash_flow)}
            </td>
          </tr>

          {/* Net Rental Yield */}
          <tr className="hover:bg-gray-50">
            <td className="border p-3 font-medium">
              <div className="flex items-center">
                <Calculator size={16} className="mr-2 text-blue-500" />
                Net Rental Yield
              </div>
            </td>
            <td className={`border p-3 text-center font-semibold ${ownerOffer.net_rental_yield >= 15 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(ownerOffer.net_rental_yield)}
            </td>
            <td className={`border p-3 text-center font-semibold ${balancedOffer.net_rental_yield >= 17 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(balancedOffer.net_rental_yield)}
            </td>
            <td className={`border p-3 text-center font-semibold ${buyerOffer.net_rental_yield >= 20 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(buyerOffer.net_rental_yield)}
            </td>
          </tr>

          {/* Balloon Period */}
          <tr className="hover:bg-gray-50">
            <td className="border p-3 font-medium">Balloon Period</td>
            <td className="border p-3 text-center">
              {renderEditableField('owner', 'balloon_period', ownerOffer.balloon_period, 'number', { min: 1, max: 10, step: 1 })}
              <span className="ml-1 text-sm text-gray-500">years</span>
            </td>
            <td className="border p-3 text-center">
              {renderEditableField('balanced', 'balloon_period', balancedOffer.balloon_period, 'number', { min: 1, max: 10, step: 1 })}
              <span className="ml-1 text-sm text-gray-500">years</span>
            </td>
            <td className="border p-3 text-center">
              {renderEditableField('buyer', 'balloon_period', buyerOffer.balloon_period, 'number', { min: 1, max: 10, step: 1 })}
              <span className="ml-1 text-sm text-gray-500">years</span>
            </td>
          </tr>

          {/* Balloon Payment */}
          <tr className="hover:bg-gray-50">
            <td className="border p-3 font-medium">Balloon Payment</td>
            <td className="border p-3 text-center">{formatCurrency(ownerOffer.balloon_payment)}</td>
            <td className="border p-3 text-center">{formatCurrency(balancedOffer.balloon_payment)}</td>
            <td className="border p-3 text-center">{formatCurrency(buyerOffer.balloon_payment)}</td>
          </tr>

          {/* Validation Status */}
          <tr className="bg-gray-50">
            <td className="border p-3 font-medium">Status</td>
            <td className="border p-3">
              <div className="text-center">
                {ownerOffer.is_valid ?
                  <span className="text-green-600 font-semibold">✓ Valid</span> :
                  <span className="text-red-600 font-semibold">✗ Invalid</span>
                }
              </div>
              {renderValidationErrors(ownerOffer)}
            </td>
            <td className="border p-3">
              <div className="text-center">
                {balancedOffer.is_valid ?
                  <span className="text-green-600 font-semibold">✓ Valid</span> :
                  <span className="text-red-600 font-semibold">✗ Invalid</span>
                }
              </div>
              {renderValidationErrors(balancedOffer)}
            </td>
            <td className="border p-3">
              <div className="text-center">
                {buyerOffer.is_valid ?
                  <span className="text-green-600 font-semibold">✓ Valid</span> :
                  <span className="text-red-600 font-semibold">✗ Invalid</span>
                }
              </div>
              {renderValidationErrors(buyerOffer)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
        <h4 className="font-semibold mb-2">How to Use Dynamic Calculator:</h4>
        <ul className="space-y-1 text-gray-700">
          <li>• Click any value to edit it directly</li>
          <li>• Related fields update automatically (e.g., changing down payment % updates entry fee)</li>
          <li>• Red values indicate constraint violations</li>
          <li>• Green values indicate targets are met</li>
          <li>• All relationships are bidirectional - edit any field!</li>
        </ul>
      </div>
    </div>
  )
}