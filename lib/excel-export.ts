import * as XLSX from 'xlsx'
import { OfferResult } from './calculator/types'

export function exportToExcel(offers: OfferResult[], propertyAddress: string) {
  const data = offers.map((offer) => ({
    'Offer Type': offer.offer_type,
    Buyable: offer.is_buyable ? 'Yes' : 'No',
    'Offer Price': offer.final_offer_price,
    'Entry Fee %': offer.final_entry_fee_percent,
    'Entry Fee $': offer.final_entry_fee_amount,
    'Monthly Cash Flow': offer.final_monthly_cash_flow,
    'Monthly Payment': offer.monthly_payment,
    'COC %': offer.final_coc_percent,
    'Down Payment': offer.down_payment,
    'Down Payment %': offer.down_payment_percent,
    'Loan Amount': offer.loan_amount,
    'Amortization Years': offer.amortization_years,
    'Balloon Period': offer.balloon_period,
    'Principal Paid': offer.principal_paid,
    'Balloon Payment': offer.balloon_payment,
    'Appreciation Profit': offer.appreciation_profit,
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Analysis')

  XLSX.writeFile(workbook, 'seller-finance-analysis.xlsx')
}
