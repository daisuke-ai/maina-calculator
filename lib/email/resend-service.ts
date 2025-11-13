// lib/email/resend-service.ts

import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LOIEmailRequest } from '@/types/loi';
import { generateLOIEmailHTML, generateLOIEmailText } from './loi-email-template';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Company configuration
const COMPANY_CONFIG = {
  name: 'MIANA',
  type: 'REIT (Real Estate Investment Trust)',
  senderEmail: 'mian@miana.com.co',
  senderName: 'MIANA',
  recentDeals: [
    {
      address: '1016 Sedona Pines Dr',
      city: 'Baton Rouge',
      state: 'LA',
      dealType: 'Seller Finance',
    },
    {
      address: '1824-26 Feliciana St',
      city: 'New Orleans',
      state: 'LA',
      dealType: 'Seller Finance',
    },
  ],
};

/**
 * Send LOI email with attachments
 */
export async function sendLOIEmail(
  request: LOIEmailRequest,
  trackingId: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    // Prepare email template data
    const templateData = {
      agentName: request.agentName,
      agentPhone: request.agentPhone,
      realtorName: request.realtorName,
      propertyAddress: request.propertyAddress,
      offerType: request.offerType,
      askingPrice: request.askingPrice,
      offerPrice: request.offerPrice,
      aboveAsking: request.offerPrice - request.askingPrice,
      downPayment: request.downPayment,
      monthlyPayment: request.monthlyPayment,
      balloonYear: request.balloonYear,
      closingCosts: request.closingCosts,
      closingDays: request.closingDays,
      companyName: COMPANY_CONFIG.name,
      recentDeals: COMPANY_CONFIG.recentDeals,
    };

    // Generate email content
    const htmlContent = generateLOIEmailHTML(templateData);
    const textContent = generateLOIEmailText(templateData);

    // Load PDF attachments from public/pdfs directory
    const attachments = await loadPDFAttachments();

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `${COMPANY_CONFIG.senderName} <${COMPANY_CONFIG.senderEmail}>`,
      to: [request.realtorEmail],
      cc: [request.agentEmail], // CC the agent
      replyTo: COMPANY_CONFIG.senderEmail, // Replies go to main company email
      subject: `Letter of Intent - ${request.propertyAddress}`,
      html: htmlContent,
      text: textContent,
      attachments: attachments,
      tags: [
        { name: 'type', value: 'loi' },
        { name: 'tracking_id', value: trackingId },
        { name: 'agent_id', value: request.agentId.toString() },
        { name: 'offer_type', value: request.offerType.replace(/\s+/g, '_') }, // Replace spaces with underscores
      ],
    });

    if (error) {
      console.error('[Resend Error]', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('[Email Sent]', {
      emailId: data?.id,
      trackingId,
      to: request.realtorEmail,
      cc: request.agentEmail,
    });

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error: any) {
    console.error('[sendLOIEmail Error]', error);
    return {
      success: false,
      error: error.message || 'Unexpected error sending email',
    };
  }
}

/**
 * Load PDF attachments from public/pdfs directory
 */
async function loadPDFAttachments(): Promise<
  Array<{ filename: string; content: Buffer }>
> {
  const pdfDirectory = join(process.cwd(), 'public', 'pdfs');

  const pdfFiles = [
    { filename: 'IRS_EIN_Document.pdf', path: 'IRS Ein Document.pdf' },
    { filename: 'Notarized_Buyers_BfD_Docs.pdf', path: 'Notarized Buyer\'s BfD Docs.pdf' },
    { filename: 'Vanguard_LLC_Registration.pdf', path: 'Vang LLC Registration Document.pdf' },
  ];

  const attachments: Array<{ filename: string; content: Buffer }> = [];

  for (const file of pdfFiles) {
    try {
      const filePath = join(pdfDirectory, file.path);
      const content = readFileSync(filePath);
      attachments.push({
        filename: file.filename,
        content,
      });
    } catch (error) {
      console.error(`[PDF Load Error] ${file.path}:`, error);
      // Continue loading other files even if one fails
    }
  }

  return attachments;
}

/**
 * Generate unique tracking ID
 */
export function generateTrackingId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `loi_${timestamp}_${randomStr}`;
}
