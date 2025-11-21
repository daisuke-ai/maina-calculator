// lib/supabase/email-tracking.ts

import { createClient } from '@supabase/supabase-js';
import { LOIEmailRequest, LOIEmailRecord } from '@/types/loi';

// Initialize Supabase client with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  console.error('[Supabase Config Error] NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!supabaseServiceKey) {
  console.error('[Supabase Config Error] Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[Supabase Config Warning] Using ANON key instead of SERVICE_ROLE key. Database writes may fail due to RLS policies.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Create new LOI email record in database
 */
export async function createLOIEmailRecord(
  request: LOIEmailRequest,
  trackingId: string,
  resendEmailId?: string,
  htmlContent?: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('loi_emails')
      .insert({
        tracking_id: trackingId,
        agent_id: request.agentId,
        agent_email: request.agentEmail,
        agent_name: request.agentName,
        agent_phone: request.agentPhone,
        realtor_email: request.realtorEmail,
        realtor_name: request.realtorName,
        property_address: request.propertyAddress,
        offer_type: request.offerType,
        offer_price: request.offerPrice,
        down_payment: request.downPayment,
        monthly_payment: request.monthlyPayment,
        balloon_year: request.balloonYear,
        closing_costs: request.closingCosts,
        closing_days: request.closingDays,
        status: 'sent',
        resend_email_id: resendEmailId,
        html_content: htmlContent,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Supabase Insert Error]', error);
      return { success: false, error: error.message };
    }

    return { success: true, emailId: data.id };
  } catch (error: any) {
    console.error('[createLOIEmailRecord Error]', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update email status
 */
export async function updateEmailStatus(
  trackingId: string,
  status: 'delivered' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const updates: any = { status };

    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    await supabase
      .from('loi_emails')
      .update(updates)
      .eq('tracking_id', trackingId);
  } catch (error) {
    console.error('[updateEmailStatus Error]', error);
  }
}

/**
 * Update email opened status
 */
export async function updateEmailOpened(trackingId: string): Promise<void> {
  try {
    // Increment open count and set opened flag
    const { data: current } = await supabase
      .from('loi_emails')
      .select('open_count, opened_at')
      .eq('tracking_id', trackingId)
      .single();

    const updates: any = {
      opened: true,
      open_count: (current?.open_count || 0) + 1,
    };

    // Set opened_at timestamp only on first open
    if (!current?.opened_at) {
      updates.opened_at = new Date().toISOString();
    }

    await supabase
      .from('loi_emails')
      .update(updates)
      .eq('tracking_id', trackingId);
  } catch (error) {
    console.error('[updateEmailOpened Error]', error);
  }
}

/**
 * Update email clicked status
 */
export async function updateEmailClicked(trackingId: string): Promise<void> {
  try {
    // Increment click count
    const { data: current } = await supabase
      .from('loi_emails')
      .select('click_count, clicked_at')
      .eq('tracking_id', trackingId)
      .single();

    const updates: any = {
      clicked: true,
      click_count: (current?.click_count || 0) + 1,
    };

    if (!current?.clicked_at) {
      updates.clicked_at = new Date().toISOString();
    }

    await supabase
      .from('loi_emails')
      .update(updates)
      .eq('tracking_id', trackingId);
  } catch (error) {
    console.error('[updateEmailClicked Error]', error);
  }
}

/**
 * Update email replied status
 */
export async function updateEmailReplied(trackingId: string): Promise<void> {
  try {
    await supabase
      .from('loi_emails')
      .update({
        replied: true,
        replied_at: new Date().toISOString(),
      })
      .eq('tracking_id', trackingId);
  } catch (error) {
    console.error('[updateEmailReplied Error]', error);
  }
}

/**
 * Log email event
 */
export async function logEmailEvent(
  trackingId: string,
  eventType: string,
  eventData: Record<string, any>
): Promise<void> {
  try {
    // Get email_id from tracking_id
    const { data: email } = await supabase
      .from('loi_emails')
      .select('id')
      .eq('tracking_id', trackingId)
      .single();

    if (!email) {
      console.error('[logEmailEvent] Email not found:', trackingId);
      return;
    }

    await supabase.from('email_events').insert({
      email_id: email.id,
      tracking_id: trackingId,
      event_type: eventType,
      event_data: eventData,
    });
  } catch (error) {
    console.error('[logEmailEvent Error]', error);
  }
}

/**
 * Get all emails sent by an agent
 */
export async function getAgentEmails(agentId: number): Promise<LOIEmailRecord[]> {
  try {
    const { data, error } = await supabase
      .from('loi_emails')
      .select('*')
      .eq('agent_id', agentId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('[getAgentEmails Error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAgentEmails Error]', error);
    return [];
  }
}

/**
 * Find LOI by property address (case-insensitive)
 * Used for matching email replies back to original LOIs
 */
export async function findLOIByPropertyAddress(propertyAddress: string): Promise<any | null> {
  try {
    // First, try exact match (case-insensitive)
    // Select all fields including html_content for showing in forwarded email
    let { data, error } = await supabase
      .from('loi_emails')
      .select('*, html_content')
      .ilike('property_address', propertyAddress)
      .eq('replied', false)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is okay for fallback
      console.error('[findLOIByPropertyAddress Error]', error);
    }

    if (data) {
      return data;
    }

    // Fallback: Try partial match if exact match fails
    const { data: partialData } = await supabase
      .from('loi_emails')
      .select('*, html_content')
      .ilike('property_address', `%${propertyAddress}%`)
      .eq('replied', false)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return partialData;
  } catch (error) {
    console.error('[findLOIByPropertyAddress Error]', error);
    return null;
  }
}

/**
 * Find LOI by tracking ID
 */
export async function findLOIByTrackingId(trackingId: string) {
  try {
    const { data, error } = await supabase
      .from('loi_emails')
      .select('*')
      .eq('tracking_id', trackingId)
      .single();

    if (error) {
      console.error('[findLOIByTrackingId Error]', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[findLOIByTrackingId Error]', error);
    return null;
  }
}

/**
 * Update resend_message_id for sent LOI email
 * Called when webhook receives email.sent or email.delivered event
 */
export async function updateResendMessageId(
  trackingId: string,
  messageId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('loi_emails')
      .update({ resend_message_id: messageId })
      .eq('tracking_id', trackingId);

    if (error) {
      console.error('[updateResendMessageId Error]', error);
      throw error;
    }

    console.log('[Message ID Updated]', { trackingId, messageId });
  } catch (error) {
    console.error('[updateResendMessageId Error]', error);
    throw error;
  }
}

/**
 * Store email reply content
 */
export async function storeEmailReply(reply: {
  loiTrackingId: string;
  agentId: number;
  agentName: string;
  fromEmail: string;
  toEmail: string;
  subject: string | null;
  htmlContent: string | null;
  textContent: string | null;
  messageId: string | null;
}): Promise<{ id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('email_replies')
      .insert({
        loi_tracking_id: reply.loiTrackingId,
        agent_id: reply.agentId,
        agent_name: reply.agentName,
        from_email: reply.fromEmail,
        to_email: reply.toEmail,
        subject: reply.subject,
        html_content: reply.htmlContent,
        text_content: reply.textContent,
        message_id: reply.messageId,
        received_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[storeEmailReply Error]', error);
      throw error;
    }

    console.log('[Email Reply Stored]', reply.loiTrackingId);
    return { id: data.id };
  } catch (error: any) {
    console.error('[storeEmailReply Error]', error);
    return { error: error.message };
  }
}

/**
 * Get email reply by ID
 */
export async function getEmailReplyById(replyId: string) {
  try {
    const { data, error } = await supabase
      .from('email_replies')
      .select('*')
      .eq('id', replyId)
      .single();

    if (error) {
      console.error('[getEmailReplyById Error]', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[getEmailReplyById Error]', error);
    return null;
  }
}

/**
 * Create outbound reply record
 */
export async function createOutboundReply(reply: {
  loiTrackingId: string;
  replyToEmailReplyId?: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName?: string;
  ccEmails?: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  inReplyTo?: string;
  referenceIds?: string[];
  resendEmailId?: string;
  resendMessageId?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('loi_email_outbound_replies')
      .insert({
        loi_tracking_id: reply.loiTrackingId,
        reply_to_email_reply_id: reply.replyToEmailReplyId || null,
        from_email: reply.fromEmail,
        from_name: reply.fromName,
        to_email: reply.toEmail,
        to_name: reply.toName || null,
        cc_emails: reply.ccEmails || [],
        subject: reply.subject,
        html_content: reply.htmlContent,
        text_content: reply.textContent || null,
        in_reply_to: reply.inReplyTo || null,
        reference_ids: reply.referenceIds || [],
        resend_email_id: reply.resendEmailId || null,
        resend_message_id: reply.resendMessageId || null,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[createOutboundReply Error]', error);
      return { success: false, error: error.message };
    }

    console.log('[Outbound Reply Created]', data.id);
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('[createOutboundReply Error]', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update outbound reply status
 */
export async function updateOutboundReplyStatus(
  id: string,
  status: 'delivered' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('loi_email_outbound_replies')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('[updateOutboundReplyStatus Error]', error);
      throw error;
    }

    console.log('[Outbound Reply Status Updated]', { id, status });
  } catch (error) {
    console.error('[updateOutboundReplyStatus Error]', error);
    throw error;
  }
}
