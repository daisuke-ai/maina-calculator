// app/api/send-loi/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { LOIEmailRequestSchema } from '@/lib/validation/loi-schema';
import { sendLOIEmail, generateTrackingId } from '@/lib/email/resend-service';
import { createLOIEmailRecord } from '@/lib/supabase/email-tracking';
import { LOIEmailRequest, LOIEmailResponse } from '@/types/loi';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request data
    const validationResult = LOIEmailRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const requestData: LOIEmailRequest = validationResult.data;

    // Generate unique tracking ID
    const trackingId = generateTrackingId();

    console.log('[Send LOI] Starting...', {
      trackingId,
      agentId: requestData.agentId,
      realtorEmail: requestData.realtorEmail,
      propertyAddress: requestData.propertyAddress,
    });

    // Send email via Resend
    const emailResult = await sendLOIEmail(requestData, trackingId);

    if (!emailResult.success) {
      // Log failed attempt to database
      await createLOIEmailRecord(requestData, trackingId);

      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || 'Failed to send email',
        } as LOIEmailResponse,
        { status: 500 }
      );
    }

    // Save to database
    const dbResult = await createLOIEmailRecord(
      requestData,
      trackingId,
      emailResult.emailId,
      emailResult.htmlContent
    );

    if (!dbResult.success) {
      console.error('[Database Error]', dbResult.error);
      // Email sent but DB failed - still return success to user
    }

    console.log('[Send LOI] Success', {
      trackingId,
      emailId: emailResult.emailId,
      dbEmailId: dbResult.emailId,
    });

    return NextResponse.json({
      success: true,
      trackingId,
      emailId: emailResult.emailId,
      message: 'LOI email sent successfully',
    } as LOIEmailResponse);
  } catch (error: any) {
    console.error('[Send LOI API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      } as LOIEmailResponse,
      { status: 500 }
    );
  }
}
