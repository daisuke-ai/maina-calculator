-- Add message threading support for email replies
-- This migration adds the resend_message_id field to enable proper email threading

-- Add resend_message_id column to loi_emails
-- This stores the Message-ID header from Resend, which is needed for threading replies
ALTER TABLE loi_emails
ADD COLUMN IF NOT EXISTS resend_message_id TEXT;

-- Add index for faster lookups when threading replies
CREATE INDEX IF NOT EXISTS idx_loi_emails_resend_message_id ON loi_emails(resend_message_id);

-- Add comment for documentation
COMMENT ON COLUMN loi_emails.resend_message_id IS 'Message-ID header from Resend used for email threading (In-Reply-To and References headers)';

-- Create table for outbound replies sent from CRM
CREATE TABLE IF NOT EXISTS loi_email_outbound_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to original LOI and realtor's reply
  loi_tracking_id TEXT NOT NULL REFERENCES loi_emails(tracking_id) ON DELETE CASCADE,
  reply_to_email_reply_id UUID REFERENCES email_replies(id) ON DELETE SET NULL,

  -- Sender (usually comms specialist or agent)
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,

  -- Recipient (realtor)
  to_email TEXT NOT NULL,
  to_name TEXT,

  -- CC (optional - can CC the assigned agent)
  cc_emails TEXT[], -- Array of email addresses

  -- Email content
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,

  -- Threading headers (for email thread continuity)
  in_reply_to TEXT, -- Message-ID of the email we're replying to
  reference_ids TEXT[], -- Array of Message-IDs in the thread

  -- Resend tracking
  resend_email_id TEXT, -- Resend's email ID
  resend_message_id TEXT, -- Message-ID header from Resend

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_outbound_replies_loi_tracking_id ON loi_email_outbound_replies(loi_tracking_id);
CREATE INDEX IF NOT EXISTS idx_outbound_replies_reply_to_email_reply_id ON loi_email_outbound_replies(reply_to_email_reply_id);
CREATE INDEX IF NOT EXISTS idx_outbound_replies_status ON loi_email_outbound_replies(status);
CREATE INDEX IF NOT EXISTS idx_outbound_replies_sent_at ON loi_email_outbound_replies(sent_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_outbound_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_outbound_replies_updated_at
  BEFORE UPDATE ON loi_email_outbound_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_outbound_replies_updated_at();

-- Comments for documentation
COMMENT ON TABLE loi_email_outbound_replies IS 'Tracks outbound replies sent from the CRM back to realtors, maintaining email thread continuity';
COMMENT ON COLUMN loi_email_outbound_replies.in_reply_to IS 'Message-ID of the email being replied to (for email threading)';
COMMENT ON COLUMN loi_email_outbound_replies.reference_ids IS 'Chain of Message-IDs in the conversation thread';
