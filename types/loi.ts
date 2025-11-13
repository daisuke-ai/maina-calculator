// types/loi.ts

import { Agent } from '@/config/agents';
import { OfferResult } from '@/lib/calculator/types';

/**
 * LOI Email Request Data
 * Data submitted from the modal form to send LOI email
 */
export interface LOIEmailRequest {
  // Agent Information
  agentId: number;
  agentEmail: string;
  agentName: string;
  agentPhone?: string;

  // Realtor Information
  realtorEmail: string;
  realtorName?: string;

  // Property & Offer Details
  propertyAddress: string;
  offerType: 'Max Owner Favored' | 'Balanced' | 'Max Buyer Favored';

  // Offer Financial Details (from OfferResult)
  offerPrice: number;
  downPayment: number;
  monthlyPayment: number;
  balloonYear: number;
  closingCosts: number;

  // Timeline
  closingDays: number; // Default: 20

  // Additional property details
  askingPrice: number;
  monthlyRent: number;
}

/**
 * LOI Email Response
 * Response from the send-loi API endpoint
 */
export interface LOIEmailResponse {
  success: boolean;
  trackingId?: string;
  emailId?: string;
  message: string;
  error?: string;
}

/**
 * Database Record: loi_emails table
 */
export interface LOIEmailRecord {
  id: string;
  tracking_id: string;

  agent_id: number;
  agent_email: string;
  agent_name: string;
  agent_phone?: string;

  realtor_email: string;
  realtor_name?: string;

  property_address: string;

  offer_type: string;
  offer_price: number;
  down_payment: number;
  monthly_payment: number;
  balloon_year: number;
  closing_costs: number;
  closing_days: number;

  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at: string;
  delivered_at?: string;

  opened: boolean;
  open_count: number;
  opened_at?: string;

  clicked: boolean;
  click_count: number;
  clicked_at?: string;

  replied: boolean;
  replied_at?: string;

  error_message?: string;
  resend_email_id?: string;

  created_at: string;
  updated_at: string;
}

/**
 * Email Event Record: email_events table
 */
export interface EmailEventRecord {
  id: string;
  email_id: string;
  tracking_id: string;
  event_type: string;
  event_data: Record<string, any>;
  created_at: string;
}

/**
 * Modal Form State
 */
export interface LOIModalFormData {
  selectedAgent: Agent | null;
  realtorEmail: string;
  realtorName: string;
  closingDays: number;
}

/**
 * Email Template Data
 * Data used to populate the email template
 */
export interface LOIEmailTemplateData {
  agentName: string;
  agentPhone?: string;
  realtorName?: string;
  propertyAddress: string;
  offerType: 'Max Owner Favored' | 'Balanced' | 'Max Buyer Favored';
  askingPrice: number;
  offerPrice: number;
  aboveAsking: number; // offerPrice - askingPrice
  downPayment: number;
  monthlyPayment: number;
  balloonYear: number;
  closingCosts: number;
  closingDays: number;
  companyName: string;
  recentDeals: Array<{
    address: string;
    city: string;
    state: string;
    dealType: string;
  }>;
}
