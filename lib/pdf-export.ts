import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { OfferResult } from './calculator/types'
import { formatCurrency, formatPercentage } from './utils'

export function exportToPDF(offers: OfferResult[], propertyAddress: string) {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text('Seller Finance Deal Analysis', 14, 22)

  // Property Address
  doc.setFontSize(12)
  doc.text(`Property: ${propertyAddress}`, 14, 32)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40)

  // Offers Table
  const tableData = offers.map((offer) => [
    offer.offer_type,
    offer.is_buyable ? 'Yes' : 'No',
    formatCurrency(offer.final_offer_price),
    formatPercentage(offer.final_entry_fee_percent),
    formatCurrency(offer.final_monthly_cash_flow),
    formatPercentage(offer.final_coc_percent),
  ])

  autoTable(doc, {
    startY: 50,
    head: [['Offer Type', 'Buyable', 'Offer Price', 'Entry Fee %', 'Cash Flow', 'COC %']],
    body: tableData,
  })

  // Save
  doc.save('seller-finance-analysis.pdf')
}
