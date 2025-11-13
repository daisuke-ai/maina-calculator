// lib/email/loi-email-template.ts

import { LOIEmailTemplateData } from '@/types/loi';
import { formatCurrency } from '@/lib/utils';

/**
 * Generates HTML email template for LOI
 */
export function generateLOIEmailHTML(data: LOIEmailTemplateData): string {
  const {
    agentName,
    agentPhone,
    propertyAddress,
    offerType,
    askingPrice,
    offerPrice,
    aboveAsking,
    downPayment,
    monthlyPayment,
    balloonYear,
    closingCosts,
    closingDays,
    companyName,
    recentDeals,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Letter of Intent - ${propertyAddress}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 650px;
      margin: 0 auto;
      padding: 20px;
    }
  </style>
</head>
<body>
<p>Hi ${agentName},</p>

<p>This is ${agentName}, we just spoke. We're looking to burn some capital gains and are ready to close on the property within ${closingDays} days, if the seller is prepared.</p>

<p><strong>Offer Type: Seller Financing / Owner Financing</strong></p>

<p><strong>Property: ${propertyAddress}</strong></p>

<p><strong>Purchase Price:</strong> ${formatCurrency(offerPrice)}${aboveAsking > 0 ? ` (${formatCurrency(aboveAsking)} above asking price)` : ''}</p>

<p><strong>Down Payment:</strong> ${formatCurrency(downPayment)}</p>

<p><strong>Monthly Payment:</strong> ${formatCurrency(monthlyPayment)}</p>

<p><strong>Balloon Payment Year:</strong> ${balloonYear}</p>

<p><strong>Closing Costs:</strong> We will cover the title closing costs: ${formatCurrency(closingCosts)}</p>

<p><strong>Insurance & Taxes:</strong> Covered by us, we will use an Escrow company that you choose to send receipts of payments.</p>

<p>We've included a "Deed in Lieu of Foreclosure" clause: if two payments are missed, the property reverts to the seller no foreclosure process needed.</p>

<p>All terms are outlined in the attached Letter of Intent. If your client is ready to move forward feel free to draft a purchase agreement or we can send one for review.</p>

<p>Here are a few recent deals that we closed, you may contact the title company or realtor for our credibility as a REIT (Real Estate Investment Trust).</p>

<p>1016 Sedona Pines Dr, Baton Rouge, LA (Seller Finance)</p>
<p>1824-26 Feliciana St, New Orleans, LA (Seller Finance)</p>

<p><strong>Attached:</strong></p>
<p>Letter of Intent<br>
Articles of Organization<br>
Recent HUD Statement<br>
Tax EIN</p>

<p>If you have other seller-financed properties, we'd love to take a look.</p>

<p>Best regards,<br>
${agentName}${agentPhone ? `<br>Personal Cell: ${agentPhone}` : ''}</p>
</body>
</html>
  `.trim();
}

/**
 * Generates plain text version of the email
 */
export function generateLOIEmailText(data: LOIEmailTemplateData): string {
  const {
    agentName,
    agentPhone,
    propertyAddress,
    offerType,
    offerPrice,
    aboveAsking,
    downPayment,
    monthlyPayment,
    balloonYear,
    closingCosts,
    closingDays,
    companyName,
    recentDeals,
  } = data;

  return `
Hi ${agentName},

This is ${agentName}, we just spoke. We're looking to burn some capital gains and are ready to close on the property within ${closingDays} days, if the seller is prepared.

Offer Type: Seller Financing / Owner Financing

Property: ${propertyAddress}

Purchase Price: ${formatCurrency(offerPrice)}${aboveAsking > 0 ? ` (${formatCurrency(aboveAsking)} above asking price)` : ''}

Down Payment: ${formatCurrency(downPayment)}

Monthly Payment: ${formatCurrency(monthlyPayment)}

Balloon Payment Year: ${balloonYear}

Closing Costs: We will cover the title closing costs: ${formatCurrency(closingCosts)}

Insurance & Taxes: Covered by us, we will use an Escrow company that you choose to send receipts of payments.

We've included a "Deed in Lieu of Foreclosure" clause: if two payments are missed, the property reverts to the seller no foreclosure process needed.

All terms are outlined in the attached Letter of Intent. If your client is ready to move forward feel free to draft a purchase agreement or we can send one for review.

Here are a few recent deals that we closed, you may contact the title company or realtor for our credibility as a REIT (Real Estate Investment Trust).

1016 Sedona Pines Dr, Baton Rouge, LA (Seller Finance)
1824-26 Feliciana St, New Orleans, LA (Seller Finance)

Attached:
Letter of Intent
Articles of Organization
Recent HUD Statement
Tax EIN

If you have other seller-financed properties, we'd love to take a look.

Best regards,
${agentName}
${agentPhone ? `Personal Cell: ${agentPhone}` : ''}
  `.trim();
}
