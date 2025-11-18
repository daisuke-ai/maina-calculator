// app/api/loi/reply/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  getEmailReplyById,
  findLOIByTrackingId,
  createOutboundReply,
} from '@/lib/supabase/email-tracking';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ReplyRequest {
  replyToEmailReplyId: string; // ID of the email_replies record we're replying to
  message: string; // HTML content of the reply
  ccAgent?: boolean; // Whether to CC the assigned agent
  senderEmail?: string; // Override default sender email
  senderName?: string; // Override default sender name
}

/**
 * Send a threaded reply to a realtor's email
 * Maintains email threading with proper In-Reply-To and References headers
 */
export async function POST(request: NextRequest) {
  try {
    const body: ReplyRequest = await request.json();

    // Validate required fields
    if (!body.replyToEmailReplyId || !body.message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: replyToEmailReplyId and message are required',
        },
        { status: 400 }
      );
    }

    console.log('[LOI Reply] Starting...', {
      replyToEmailReplyId: body.replyToEmailReplyId,
    });

    // 1. Fetch the original reply from the database
    const originalReply = await getEmailReplyById(body.replyToEmailReplyId);

    if (!originalReply) {
      return NextResponse.json(
        {
          success: false,
          error: 'Original email reply not found',
        },
        { status: 404 }
      );
    }

    // 2. Fetch the LOI details to get threading info
    const loi = await findLOIByTrackingId(originalReply.loi_tracking_id);

    if (!loi) {
      return NextResponse.json(
        {
          success: false,
          error: 'Original LOI not found',
        },
        { status: 404 }
      );
    }

    // 3. Build threading headers
    // References header should contain: [original LOI message-id, realtor's reply message-id]
    const referenceIds: string[] = [];
    if (loi.resend_message_id) {
      referenceIds.push(loi.resend_message_id);
    }
    if (originalReply.message_id) {
      referenceIds.push(originalReply.message_id);
    }

    // 4. Prepare email content
    const senderEmail =
      body.senderEmail ||
      process.env.SENDER_EMAIL ||
      'vanguardhorizon@reit.miana.com.co';
    const senderName = body.senderName || process.env.SENDER_NAME || 'Miana';

    // Build CC list
    const ccEmails: string[] = [];
    if (body.ccAgent && loi.agent_email) {
      ccEmails.push(loi.agent_email);
    }

    // Generate subject line (must maintain "Re: " prefix for threading)
    const subject = originalReply.subject?.startsWith('Re: ')
      ? originalReply.subject
      : `Re: ${originalReply.subject || 'LOI for ' + loi.property_address}`;

    // 5. Send email via Resend with threading headers
    const { data, error } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [originalReply.from_email], // Reply to the realtor
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      replyTo: senderEmail,
      subject: subject,
      html: body.message,
      headers: {
        // Critical headers for email threading
        ...(originalReply.message_id ? { 'In-Reply-To': originalReply.message_id } : {}),
        ...(referenceIds.length > 0 ? { References: referenceIds.join(' ') } : {}),
      },
      tags: [
        { name: 'type', value: 'loi_reply' },
        { name: 'loi_tracking_id', value: loi.tracking_id },
        { name: 'reply_to_id', value: body.replyToEmailReplyId },
      ],
    });

    if (error) {
      console.error('[Resend Error]', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to send reply',
        },
        { status: 500 }
      );
    }

    console.log('[Email Reply Sent]', {
      emailId: data?.id,
      to: originalReply.from_email,
      cc: ccEmails,
      inReplyTo: originalReply.message_id,
      references: referenceIds,
    });

    // 6. Store outbound reply in database
    const dbResult = await createOutboundReply({
      loiTrackingId: loi.tracking_id,
      replyToEmailReplyId: body.replyToEmailReplyId,
      fromEmail: senderEmail,
      fromName: senderName,
      toEmail: originalReply.from_email,
      toName: originalReply.from_email.split('@')[0], // Extract name from email
      ccEmails: ccEmails,
      subject: subject,
      htmlContent: body.message,
      inReplyTo: originalReply.message_id || undefined,
      referenceIds: referenceIds,
      resendEmailId: data?.id,
    });

    if (!dbResult.success) {
      console.error('[Database Error]', dbResult.error);
      // Email sent but DB failed - still return success to user with warning
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      dbRecordId: dbResult.id,
      message: 'Reply sent successfully',
      threading: {
        inReplyTo: originalReply.message_id,
        references: referenceIds,
      },
    });
  } catch (error: any) {
    console.error('[LOI Reply API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get reply details (for showing in UI before sending)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const replyId = searchParams.get('replyId');

    if (!replyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing replyId parameter',
        },
        { status: 400 }
      );
    }

    const reply = await getEmailReplyById(replyId);

    if (!reply) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reply not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error('[Get Reply Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
