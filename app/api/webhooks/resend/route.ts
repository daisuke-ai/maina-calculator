// app/api/webhooks/resend/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  updateEmailStatus,
  updateEmailOpened,
  updateEmailClicked,
  updateEmailReplied,
  logEmailEvent,
} from '@/lib/supabase/email-tracking';

/**
 * Resend Webhook Handler
 * Receives real-time email events from Resend
 *
 * Events:
 * - email.sent
 * - email.delivered
 * - email.delivery_delayed
 * - email.bounced
 * - email.opened
 * - email.clicked
 * - email.complained (spam report)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Resend Webhook] Received:', {
      type: body.type,
      data: body.data,
    });

    // Verify webhook signature (optional but recommended for production)
    // const signature = request.headers.get('svix-signature');
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const eventType = body.type;
    const eventData = body.data;

    // Extract tracking_id from email tags
    const trackingId = extractTrackingId(eventData);

    if (!trackingId) {
      console.warn('[Resend Webhook] No tracking ID found in event');
      return NextResponse.json({ received: true });
    }

    // Log event to email_events table
    await logEmailEvent(trackingId, eventType, eventData);

    // Handle different event types
    switch (eventType) {
      case 'email.sent':
        // Email accepted by Resend (already marked as 'sent' when created)
        console.log(`[Email Sent] ${trackingId}`);
        break;

      case 'email.delivered':
        // Email successfully delivered to recipient's mail server
        await updateEmailStatus(trackingId, 'delivered');
        console.log(`[Email Delivered] ${trackingId}`);
        break;

      case 'email.delivery_delayed':
        // Temporary delivery issue
        console.log(`[Email Delayed] ${trackingId}`);
        break;

      case 'email.bounced':
        // Email bounced (invalid address, full mailbox, etc.)
        const bounceReason = eventData.bounce?.reason || 'Unknown';
        await updateEmailStatus(trackingId, 'failed', `Bounced: ${bounceReason}`);
        console.log(`[Email Bounced] ${trackingId}: ${bounceReason}`);
        break;

      case 'email.opened':
        // Recipient opened the email
        await updateEmailOpened(trackingId);
        console.log(`[Email Opened] ${trackingId}`);
        break;

      case 'email.clicked':
        // Recipient clicked a link in the email
        await updateEmailClicked(trackingId);
        console.log(`[Email Clicked] ${trackingId}`);
        break;

      case 'email.complained':
        // Recipient marked as spam
        await updateEmailStatus(trackingId, 'failed', 'Marked as spam');
        console.log(`[Email Complained] ${trackingId}`);
        break;

      default:
        console.log(`[Unknown Event] ${eventType} for ${trackingId}`);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Resend Webhook Error]', error);
    // Still return 200 to prevent Resend from retrying
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}

/**
 * Extract tracking_id from email tags
 */
function extractTrackingId(eventData: any): string | null {
  // Resend includes tags in the webhook payload
  const tags = eventData.tags || [];

  // Find the tracking_id tag
  const trackingTag = tags.find((tag: any) => tag.name === 'tracking_id');

  return trackingTag?.value || null;
}

/**
 * Verify webhook signature (optional security layer)
 * Recommended for production to ensure webhooks are from Resend
 */
function verifyWebhookSignature(body: any, signature: string | null): boolean {
  // TODO: Implement signature verification
  // Resend uses Svix for webhook signing
  // See: https://resend.com/docs/dashboard/webhooks/securing-webhooks

  // For now, accept all webhooks
  return true;
}
