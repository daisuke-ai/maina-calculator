// app/api/webhooks/resend/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  updateEmailStatus,
  updateEmailOpened,
  updateEmailClicked,
  updateEmailReplied,
  logEmailEvent,
  storeEmailReply,
  findLOIByPropertyAddress,
  updateResendMessageId,
} from '@/lib/supabase/email-tracking';
import { Resend } from 'resend';

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
      console.warn('[Resend Webhook] No tracking ID found in event:', eventType);
      // For email.received events without tracking (external emails), still try to handle
      if (eventType === 'email.received') {
        await handleEmailReply(eventData);
      }
      return NextResponse.json({ received: true });
    }

    // Log event to email_events table
    await logEmailEvent(trackingId, eventType, eventData);

    // Handle different event types
    switch (eventType) {
      case 'email.sent':
        // Email accepted by Resend (already marked as 'sent' when created)
        // Capture Message-ID for email threading
        const sentMessageId = eventData.message_id || eventData.headers?.['message-id'];
        if (sentMessageId) {
          await updateResendMessageId(trackingId, sentMessageId);
        }
        console.log(`[Email Sent] ${trackingId}`, { messageId: sentMessageId });
        break;

      case 'email.delivered':
        // Email successfully delivered to recipient's mail server
        await updateEmailStatus(trackingId, 'delivered');
        // Also capture Message-ID if not already captured
        const deliveredMessageId = eventData.message_id || eventData.headers?.['message-id'];
        if (deliveredMessageId) {
          await updateResendMessageId(trackingId, deliveredMessageId);
        }
        console.log(`[Email Delivered] ${trackingId}`, { messageId: deliveredMessageId });
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

      case 'email.received':
        // Email reply received - this is the most important event for CRM
        console.log(`[Email Reply Received] Email ID:`, eventData.email_id);
        console.log(`[Email Reply Received] Full webhook payload:`, JSON.stringify(eventData, null, 2));

        // Fetch full email content from Resend API
        // Webhooks don't include HTML/text body - must fetch separately
        const resendClient = new Resend(process.env.RESEND_API_KEY);
        let fullEmailData = eventData;

        try {
          console.log(`[Email Reply Received] Fetching content from Resend API...`);
          // Use .receiving.get() for inbound emails, not .get()
          const emailResponse = await resendClient.emails.receiving.get(eventData.email_id);
          console.log(`[Email Reply Received] API Response:`, JSON.stringify(emailResponse, null, 2));

          const emailData = emailResponse.data;
          console.log(`[Email Reply Received] emailData:`, emailData ? 'exists' : 'null/undefined');
          console.log(`[Email Reply Received] emailData.html:`, emailData?.html ? `${emailData.html.length} chars` : 'undefined');
          console.log(`[Email Reply Received] emailData.text:`, emailData?.text ? `${emailData.text.length} chars` : 'undefined');

          if (emailData?.html || emailData?.text) {
            // Merge webhook metadata with fetched content
            fullEmailData = {
              ...eventData,
              html: emailData.html,
              text: emailData.text,
            };
            console.log(`[Email Reply Received] Successfully merged content`);
          } else {
            console.log(`[Email Reply Received] No html or text in API response`);
          }
        } catch (fetchError: any) {
          console.error('[Email Reply Received] Error fetching content:', fetchError.message);
          console.error('[Email Reply Received] Error details:', JSON.stringify(fetchError, null, 2));
        }

        await handleEmailReply(fullEmailData);
        console.log(`[Email Reply Received] Processed - html: ${fullEmailData.html ? 'yes' : 'no'}, text: ${fullEmailData.text ? 'yes' : 'no'}`);
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
  try {
    // Resend includes tags in the webhook payload
    const tags = eventData.tags;

    if (!tags) {
      return null;
    }

    // Tags can be an array or an object
    if (Array.isArray(tags)) {
      const trackingTag = tags.find((tag: any) => tag.name === 'tracking_id');
      return trackingTag?.value || null;
    }

    // If tags is an object, try to access directly
    if (typeof tags === 'object') {
      return tags.tracking_id || null;
    }

    return null;
  } catch (error) {
    console.error('[extractTrackingId Error]', error);
    return null;
  }
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

/**
 * Handle email reply from realtor
 * This is the core function that maps replies back to agents via property address
 */
async function handleEmailReply(inboundEmail: any) {
  try {
    // Extract property address from subject line
    // Subject format: "Re: LOI for 123 Main St, City, State"
    const subject = inboundEmail.subject || '';
    const match = subject.match(/LOI for (.+)/i);

    if (!match) {
      console.error('[Reply Handler] Could not extract property address from subject:', subject);
      // Still forward to communications specialist for manual handling
      await forwardToCommsSpecialist(inboundEmail, null);
      return;
    }

    const propertyAddress = match[1].trim();
    console.log('[Reply Handler] Property address extracted:', propertyAddress);

    // Find original LOI by property address
    const loi = await findLOIByPropertyAddress(propertyAddress);

    if (!loi) {
      console.error('[Reply Handler] Could not find LOI for property:', propertyAddress);
      // Still forward to communications specialist for manual handling
      await forwardToCommsSpecialist(inboundEmail, null);
      return;
    }

    console.log('[Reply Handler] Matched to LOI:', {
      trackingId: loi.tracking_id,
      agentName: loi.agent_name,
      propertyAddress: loi.property_address,
    });

    // Update LOI status
    await updateEmailReplied(loi.tracking_id);

    // Store reply content
    await storeEmailReply({
      loiTrackingId: loi.tracking_id,
      agentId: loi.agent_id,
      agentName: loi.agent_name,
      fromEmail: inboundEmail.from,
      toEmail: inboundEmail.to?.[0] || '',
      subject: inboundEmail.subject,
      htmlContent: inboundEmail.html,
      textContent: inboundEmail.text,
      messageId: inboundEmail.message_id,
    });

    // Log event
    await logEmailEvent(loi.tracking_id, 'replied', {
      from: inboundEmail.from,
      subject: inboundEmail.subject,
      receivedAt: new Date().toISOString(),
    });

    // Forward to communications specialist
    await forwardToCommsSpecialist(inboundEmail, loi);

    console.log('[Reply Handler] Successfully processed reply');
  } catch (error) {
    console.error('[Reply Handler Error]', error);
    throw error;
  }
}

/**
 * Forward reply to communications specialist
 */
async function forwardToCommsSpecialist(inboundEmail: any, loi: any | null) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const commsEmail = process.env.COMMS_SPECIALIST_EMAIL || 'vanguardhorizon.reit-a@miana.com.co';

    const responseTime = loi ? calculateResponseTime(loi.sent_at) : 'Unknown';

    const subject = loi
      ? `[${loi.agent_name}] ${inboundEmail.subject}`
      : `[Unmatched] ${inboundEmail.subject}`;

    const htmlBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .info-table { width: 100%; border-collapse: collapse; }
            .info-table td { padding: 8px; border-bottom: 1px solid #e0e0e0; }
            .info-table td:first-child { font-weight: bold; width: 150px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .reply-content { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .original-loi { background: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff; }
            .actions { margin: 20px 0; }
            .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>📧 New LOI Reply Received</h2>
          </div>

          ${loi ? `
            <table class="info-table">
              <tr>
                <td>Agent:</td>
                <td><strong>${loi.agent_name}</strong></td>
              </tr>
              <tr>
                <td>Property:</td>
                <td>${loi.property_address}</td>
              </tr>
              <tr>
                <td>Offer Price:</td>
                <td>$${loi.offer_price?.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Realtor:</td>
                <td>${inboundEmail.from}</td>
              </tr>
              <tr>
                <td>LOI Sent:</td>
                <td>${new Date(loi.sent_at).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Response Time:</td>
                <td>${responseTime}</td>
              </tr>
            </table>
          ` : `
            <div class="warning">
              <strong>⚠️ Warning:</strong> Could not match this reply to an original LOI.
              Please review and assign manually.
            </div>
          `}

          <div class="reply-content">
            <h3>📥 Reply Message:</h3>
            ${inboundEmail.html || `<pre>${inboundEmail.text}</pre>`}
          </div>

          ${loi && loi.html_content ? `
            <div class="original-loi">
              <h3>📄 Original LOI Sent:</h3>
              <div style="background: white; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto;">
                ${loi.html_content}
              </div>
            </div>
          ` : ''}

          <div class="actions">
            <a href="mailto:${inboundEmail.from}" class="btn">📧 Reply to Realtor</a>
            ${loi ? `
              <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/default/editor?table=loi_emails&filter=tracking_id%3Deq%3A${loi.tracking_id}" class="btn">📊 View in CRM</a>
            ` : ''}
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

          <p style="font-size: 12px; color: #666;">
            ${loi ? `
              <strong>Tracking ID:</strong> ${loi.tracking_id}<br>
              This reply has been logged and attributed to ${loi.agent_name}.
            ` : `
              This reply could not be automatically matched. Please review manually.
            `}
          </p>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'LOI Reply System <noreply@reit.miana.com.co>',
      to: commsEmail,
      replyTo: inboundEmail.from,
      subject: subject,
      html: htmlBody,
      attachments: inboundEmail.attachments?.map((att: any) => ({
        filename: att.filename,
        content: att.content,
      })) || [],
    });

    console.log('[Forwarded to Comms Specialist]', commsEmail);
  } catch (error) {
    console.error('[Forward Error]', error);
    throw error;
  }
}

/**
 * Calculate human-readable response time
 */
function calculateResponseTime(sentAt: string): string {
  const sent = new Date(sentAt);
  const now = new Date();
  const hours = Math.floor((now.getTime() - sent.getTime()) / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return 'Less than 1 hour';
}
