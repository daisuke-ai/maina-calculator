'use client'

import { PropertyData, PropertyAPIData } from '@/lib/calculator/types'
import { formatCurrency } from '@/lib/utils'
import {
  MapPin,
  Home,
  TrendingUp,
  Receipt,
  Shield,
  Building2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react'

interface InputSummaryProps {
  propertyAPIData: PropertyAPIData
  propertyData: PropertyData
}

export function InputSummary({ propertyAPIData, propertyData }: InputSummaryProps) {
  const totalMonthlyExpenses =
    propertyData.monthly_property_tax +
    propertyData.monthly_insurance +
    propertyData.monthly_hoa_fee +
    propertyData.monthly_other_fees

  const netIncome = propertyData.monthly_rent - totalMonthlyExpenses
  const hasErrors = propertyAPIData.errors && propertyAPIData.errors.length > 0

  const SummaryRow = ({ icon: Icon, label, value, iconColor = 'text-muted-foreground' }: any) => (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-muted rounded-lg transition-colors">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Input Summary</h2>
            <p className="text-xs text-muted-foreground">Review your property details before generating investment analysis</p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Property Address */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2 pb-2 border-b border-border">
                  <MapPin className="w-4 h-4 text-accent" />
                  Property Address
                </h3>
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="text-base font-semibold text-foreground">{propertyAPIData.ADDRESS || 'N/A'}</p>
                </div>
              </div>

              {/* Pricing & Income */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2 pb-2 border-b border-border">
                  <Home className="w-4 h-4 text-accent" />
                  Pricing & Income
                </h3>
                <div className="space-y-1">
                  <SummaryRow
                    icon={Home}
                    iconColor="text-muted-foreground"
                    label="Listed Price"
                    value={formatCurrency(propertyData.listed_price)}
                  />
                  <SummaryRow
                    icon={TrendingUp}
                    iconColor="text-accent"
                    label="Monthly Rent"
                    value={formatCurrency(propertyData.monthly_rent)}
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Monthly Expenses */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2 pb-2 border-b border-border">
                  <Receipt className="w-4 h-4 text-destructive" />
                  Monthly Expenses
                </h3>
                <div className="space-y-1">
                  <SummaryRow
                    icon={Receipt}
                    iconColor="text-muted-foreground"
                    label="Property Tax"
                    value={formatCurrency(propertyData.monthly_property_tax)}
                  />
                  <SummaryRow
                    icon={Shield}
                    iconColor="text-muted-foreground"
                    label="Insurance"
                    value={formatCurrency(propertyData.monthly_insurance)}
                  />
                  <SummaryRow
                    icon={Building2}
                    iconColor="text-muted-foreground"
                    label="HOA Fee"
                    value={formatCurrency(propertyData.monthly_hoa_fee)}
                  />
                  <SummaryRow
                    icon={Plus}
                    iconColor="text-muted-foreground"
                    label="Other Fees"
                    value={formatCurrency(propertyData.monthly_other_fees)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Financial Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-accent/10 rounded-lg p-4 border border-accent">
                <p className="text-xs text-accent mb-1 font-medium">Monthly Income</p>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(propertyData.monthly_rent)}
                </p>
              </div>

              <div className="bg-destructive/10 rounded-lg p-4 border border-destructive">
                <p className="text-xs text-destructive mb-1 font-medium">Monthly Expenses</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalMonthlyExpenses)}
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4 border-2 border-border">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {formatCurrency(netIncome)}
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-4 p-4 bg-accent/10 border-l-4 border-accent rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Ready to Analyze</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click &quot;Analyze Property&quot; below to generate three investment scenarios based on these inputs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Errors Section */}
        {hasErrors && (
          <div className="p-6 bg-destructive/10 border-t border-destructive">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-destructive mb-2">API Errors Detected</p>
                <div className="space-y-1">
                  {propertyAPIData.errors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
