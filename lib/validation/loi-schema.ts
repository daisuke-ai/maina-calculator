// lib/validation/loi-schema.ts

import { z } from 'zod';

/**
 * Validation schema for LOI email request
 */
export const LOIEmailRequestSchema = z.object({
  // Agent Information
  agentId: z.number().int().positive('Agent must be selected'),
  agentEmail: z.string().email('Valid agent email required'),
  agentName: z.string().min(2, 'Agent name required'),
  agentPhone: z.string().optional(),

  // Realtor Information
  realtorEmail: z.string().email('Valid realtor email required'),
  realtorName: z.string().optional(),

  // Property Details
  propertyAddress: z.string().min(5, 'Property address required'),

  // Offer Type (matches OfferResult.offer_type values)
  offerType: z.enum(['Max Owner Favored', 'Balanced', 'Max Buyer Favored'], {
    message: 'Invalid offer type',
  }),

  // Financial Details
  offerPrice: z.number().positive('Offer price must be positive'),
  downPayment: z.number().nonnegative('Down payment must be non-negative'),
  monthlyPayment: z.number().positive('Monthly payment must be positive'),
  balloonYear: z.number().int().min(1).max(40, 'Balloon year must be between 1-40'),
  closingCosts: z.number().nonnegative('Closing costs must be non-negative'),

  // Timeline
  closingDays: z.number().int().min(1).max(180, 'Closing days must be between 1-180').default(20),

  // Additional details
  askingPrice: z.number().positive('Asking price must be positive'),
  monthlyRent: z.number().nonnegative('Monthly rent must be non-negative'),
});

export type LOIEmailRequestValidated = z.infer<typeof LOIEmailRequestSchema>;
