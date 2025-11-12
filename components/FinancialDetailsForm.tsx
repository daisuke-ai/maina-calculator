'use client'

import React from 'react'
import { PropertyData, PropertyAPIData } from '@/lib/calculator/types'
import { formatCurrency } from '@/lib/utils'
import {
  DollarSign,
  Home,
  Receipt,
  Shield,
  Building2,
  Plus,
  Info,
  TrendingUp
} from 'lucide-react'

interface FinancialDetailsFormProps {
  propertyAPIData: PropertyAPIData
  onFormChange: (data: PropertyData) => void
}

interface InputFieldProps {
  icon: any
  label: string
  name: keyof PropertyData
  value: number
  apiValue: number
  apiLabel: string
  tooltip?: string
  onChange: (name: keyof PropertyData, value: number) => void
  showTooltip: string | null
  setShowTooltip: (name: string | null) => void
}

const InputField = React.memo(({
  icon: Icon,
  label,
  name,
  value,
  apiValue,
  apiLabel,
  tooltip,
  onChange,
  showTooltip,
  setShowTooltip
}: InputFieldProps) => {
  const [localValue, setLocalValue] = React.useState(value.toString())
  const [isFocused, setIsFocused] = React.useState(false)

  // Sync with parent only when value changes externally
  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toString())
    }
  }, [value, isFocused])

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    // Update parent state with parsed number
    const numValue = newValue === '' ? 0 : parseFloat(newValue)
    if (!isNaN(numValue)) {
      onChange(name, numValue)
    }
  }

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => {
    setIsFocused(false)
    // Clean up the display value on blur
    const numValue = parseFloat(localValue)
    if (!isNaN(numValue)) {
      setLocalValue(numValue.toString())
    } else {
      setLocalValue('0')
    }
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center gap-2 min-w-[140px]">
        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <label htmlFor={name} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {tooltip && (
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(name)}
            onMouseLeave={() => setShowTooltip(null)}
            className="relative text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="w-3 h-3" />
            {showTooltip === name && (
              <div className="absolute left-0 top-6 w-64 p-3 bg-card border border-border text-foreground text-xs rounded-lg shadow-xl z-10">
                {tooltip}
                <div className="absolute -top-1 left-4 w-2 h-2 bg-card border-l border-t border-border transform rotate-45" />
              </div>
            )}
          </button>
        )}
      </div>

      <div className="text-xs text-muted-foreground min-w-[100px]">
        {formatCurrency(apiValue)}
      </div>

      <div className="relative flex-1 max-w-[150px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <input
          id={name}
          name={name}
          type="number"
          value={localValue}
          onChange={handleLocalChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full h-9 pl-7 pr-3 text-sm font-semibold text-foreground bg-background border-2 border-border rounded-lg transition-all duration-200 hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none"
        />
      </div>
    </div>
  )
})

InputField.displayName = 'InputField'

export function FinancialDetailsForm({
  propertyAPIData,
  onFormChange,
}: FinancialDetailsFormProps) {
  const [formData, setFormData] = React.useState<PropertyData>({
    listed_price: propertyAPIData.LISTED_PRICE_FINAL || 0,
    monthly_rent: propertyAPIData.MONTHLY_RENT_FINAL || 0,
    monthly_property_tax: propertyAPIData.ANNUAL_TAX_FINAL_MONTHLY || 0,
    monthly_insurance: propertyAPIData.ANNUAL_INSURANCE_FINAL_MONTHLY || 0,
    monthly_hoa_fee: propertyAPIData.MONTHLY_HOA_FEE_FINAL || 0,
    monthly_other_fees: 150,
  })

  const [showTooltip, setShowTooltip] = React.useState<string | null>(null)

  React.useEffect(() => {
    onFormChange(formData)
  }, [formData])

  const handleFieldChange = React.useCallback((name: keyof PropertyData, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const calculateMonthlyExpenses = () => {
    return (
      formData.monthly_property_tax +
      formData.monthly_insurance +
      formData.monthly_hoa_fee +
      formData.monthly_other_fees
    )
  }

  const calculateNetIncome = () => {
    return formData.monthly_rent - calculateMonthlyExpenses()
  }


  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Financial Details</h2>
            <p className="text-xs text-muted-foreground">Review and adjust property financials</p>
          </div>
        </div>

        {/* Summary Inline */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-lg font-bold text-accent">{formatCurrency(formData.monthly_rent)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-lg font-bold text-destructive">{formatCurrency(calculateMonthlyExpenses())}</p>
          </div>
          <div className="text-right px-4 py-2 bg-muted rounded-lg border-2 border-border">
            <p className="text-xs text-muted-foreground">Net Cash Flow</p>
            <p className={`text-lg font-bold ${calculateNetIncome() >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {formatCurrency(calculateNetIncome())}
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="p-6">
          {/* All Fields in Compact Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Left Column */}
            <div className="space-y-1 pb-4 lg:pb-0">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Home className="w-4 h-4 text-accent" />
                Property & Income
              </h3>
              <InputField
                icon={DollarSign}
                label="Listed Price"
                name="listed_price"
                value={formData.listed_price}
                apiValue={propertyAPIData.LISTED_PRICE_FINAL || 0}
                apiLabel={`${propertyAPIData.PRICE_SOURCE || 'RentCast'}`}
                tooltip="The purchase price or current market value of the property"
                onChange={handleFieldChange}
                showTooltip={showTooltip}
                setShowTooltip={setShowTooltip}
              />
              <InputField
                icon={TrendingUp}
                label="Monthly Rent"
                name="monthly_rent"
                value={formData.monthly_rent}
                apiValue={propertyAPIData.MONTHLY_RENT_FINAL || 0}
                apiLabel="Market avg"
                tooltip="Estimated monthly rental income based on market comparables"
                onChange={handleFieldChange}
                showTooltip={showTooltip}
                setShowTooltip={setShowTooltip}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-1 pt-4 lg:pt-0 lg:pl-8">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-destructive" />
                Monthly Expenses
              </h3>
              <InputField
                icon={Receipt}
                label="Property Tax"
                name="monthly_property_tax"
                value={formData.monthly_property_tax}
                apiValue={propertyAPIData.ANNUAL_TAX_FINAL_MONTHLY || 0}
                apiLabel="From annual"
                tooltip="Monthly property tax based on assessed value"
                onChange={handleFieldChange}
                showTooltip={showTooltip}
                setShowTooltip={setShowTooltip}
              />
              <InputField
                icon={Shield}
                label="Insurance"
                name="monthly_insurance"
                value={formData.monthly_insurance}
                apiValue={propertyAPIData.ANNUAL_INSURANCE_FINAL_MONTHLY || 0}
                apiLabel="Estimated"
                tooltip="Homeowners insurance premium, estimated or actual"
                onChange={handleFieldChange}
                showTooltip={showTooltip}
                setShowTooltip={setShowTooltip}
              />
              <InputField
                icon={Building2}
                label="HOA Fee"
                name="monthly_hoa_fee"
                value={formData.monthly_hoa_fee}
                apiValue={propertyAPIData.MONTHLY_HOA_FEE_FINAL || 0}
                apiLabel="HOA/Condo"
                tooltip="Monthly HOA or condo association fees"
                onChange={handleFieldChange}
                showTooltip={showTooltip}
                setShowTooltip={setShowTooltip}
              />
              <InputField
                icon={Plus}
                label="Other Fees"
                name="monthly_other_fees"
                value={formData.monthly_other_fees}
                apiValue={0}
                apiLabel="Additional"
                tooltip="Other recurring monthly expenses (utilities, maintenance, etc.)"
                onChange={handleFieldChange}
                showTooltip={showTooltip}
                setShowTooltip={setShowTooltip}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
