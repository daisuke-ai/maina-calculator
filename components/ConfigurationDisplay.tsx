'use client'

import { useState } from 'react'
import { CONFIG } from '@/lib/calculator/config'
import { formatPercentage, formatCurrency } from '@/lib/utils'
import { ChevronDown, ChevronUp, Settings2, TrendingUp, Percent, DollarSign, Home, Users, Wrench } from 'lucide-react'

export function ConfigurationDisplay() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOpen = () => setIsOpen(!isOpen)

  const ConfigRow = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-muted rounded-lg transition-colors">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )

  return (
    <div className="w-full max-w-6xl mx-auto mt-6">
      {/* Header */}
      <div className="mb-3">
        <button
          onClick={toggleOpen}
          className="w-full flex items-center justify-between p-4 bg-card rounded-xl shadow-md border border-border hover:shadow-lg transition-all duration-200 hover:border-ring"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-foreground">Calculation Configuration</h2>
              <p className="text-xs text-muted-foreground">View model parameters and offer settings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {isOpen ? 'Hide' : 'Show'} Details
            </span>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Parameters */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2 pb-2 border-b border-border">
                  <DollarSign className="w-4 h-4 text-accent" />
                  Financial Parameters
                </h3>
                <ConfigRow
                  icon={Percent}
                  label="Annual Interest Rate"
                  value={formatPercentage(CONFIG.annual_interest_rate * 100)}
                />
                <ConfigRow
                  icon={DollarSign}
                  label="Assignment Fee"
                  value={formatCurrency(CONFIG.assignment_fee)}
                />
                <ConfigRow
                  icon={Percent}
                  label="Closing Cost % of Offer"
                  value={formatPercentage(CONFIG.closing_cost_percent_of_offer * 100)}
                />
                <ConfigRow
                  icon={TrendingUp}
                  label="Appreciation Per Year"
                  value={formatPercentage(CONFIG.appreciation_per_year * 100)}
                />
                <ConfigRow
                  icon={Home}
                  label="Max Amortization Years"
                  value={`${CONFIG.max_amortization_years} years`}
                />
              </div>

              {/* Monthly Expense Rates */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2 pb-2 border-b border-border">
                  <Percent className="w-4 h-4 text-destructive" />
                  Monthly Expense Rates
                </h3>
                <ConfigRow
                  icon={Wrench}
                  label="Maintenance Rate"
                  value={formatPercentage(CONFIG.monthly_maintenance_rate * 100)}
                />
                <ConfigRow
                  icon={Users}
                  label="Property Management"
                  value={formatPercentage(CONFIG.monthly_prop_mgmt_rate * 100)}
                />
              </div>
            </div>

            {/* Offer Types Section */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Offer Strategy Parameters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Owner Favored */}
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <h4 className="font-bold text-sm text-foreground mb-3">Owner Favored</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Appreciation Profit Min</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(CONFIG.offers.owner_favored.appreciation_profit_fixed)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Entry Fee Max</span>
                      <span className="font-semibold text-foreground">
                        {formatPercentage(CONFIG.offers.owner_favored.entry_fee_max_percent)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Net Rental Yield Range</span>
                      <span className="font-semibold text-foreground">
                        {formatPercentage(CONFIG.offers.owner_favored.net_rental_yield_range[0])}-{formatPercentage(CONFIG.offers.owner_favored.net_rental_yield_range[1])}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Balloon Period</span>
                      <span className="font-semibold text-foreground">
                        {CONFIG.offers.owner_favored.balloon_period} years
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balanced */}
                <div className="bg-accent/10 rounded-lg p-4 border border-accent">
                  <h4 className="font-bold text-sm text-foreground mb-3">Balanced</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Appreciation Profit Min</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(CONFIG.offers.balanced.appreciation_profit_fixed)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Entry Fee Max</span>
                      <span className="font-semibold text-foreground">
                        {formatPercentage(CONFIG.offers.balanced.entry_fee_max_percent)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Net Rental Yield Range</span>
                      <span className="font-semibold text-foreground">
                        {formatPercentage(CONFIG.offers.balanced.net_rental_yield_range[0])}-{formatPercentage(CONFIG.offers.balanced.net_rental_yield_range[1])}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Balloon Period</span>
                      <span className="font-semibold text-foreground">
                        {CONFIG.offers.balanced.balloon_period} years
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buyer Favored */}
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <h4 className="font-bold text-sm text-foreground mb-3">Buyer Favored</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Appreciation Profit Min</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(CONFIG.offers.buyer_favored.appreciation_profit_fixed)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Entry Fee Max</span>
                      <span className="font-semibold text-foreground">
                        {formatPercentage(CONFIG.offers.buyer_favored.entry_fee_max_percent)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Net Rental Yield Range</span>
                      <span className="font-semibold text-foreground">
                        {formatPercentage(CONFIG.offers.buyer_favored.net_rental_yield_range[0])}-{formatPercentage(CONFIG.offers.buyer_favored.net_rental_yield_range[1])}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Balloon Period</span>
                      <span className="font-semibold text-foreground">
                        {CONFIG.offers.buyer_favored.balloon_period} years
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
