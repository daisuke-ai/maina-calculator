-- Add email_replies table for storing reply content
CREATE TABLE IF NOT EXISTS email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loi_tracking_id TEXT NOT NULL,

  -- Agent attribution
  agent_id INTEGER NOT NULL,
  agent_name TEXT NOT NULL,

  -- Reply details
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  html_content TEXT,
  text_content TEXT,
  message_id TEXT,

  -- Timestamp
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key reference
  CONSTRAINT fk_loi_tracking_id
    FOREIGN KEY (loi_tracking_id)
    REFERENCES loi_emails(tracking_id)
    ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_replies_loi_tracking_id ON email_replies(loi_tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_agent_id ON email_replies(agent_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_from_email ON email_replies(from_email);
CREATE INDEX IF NOT EXISTS idx_email_replies_received_at ON email_replies(received_at DESC);

-- Add index for property address case-insensitive search (for reply matching)
CREATE INDEX IF NOT EXISTS idx_loi_emails_property_address_lower
  ON loi_emails(LOWER(property_address));

-- Add index for unreplied LOIs (for faster reply matching)
CREATE INDEX IF NOT EXISTS idx_loi_emails_replied
  ON loi_emails(replied)
  WHERE replied = FALSE;

-- Update status check constraint to include new statuses
ALTER TABLE loi_emails
  DROP CONSTRAINT IF EXISTS loi_emails_status_check;

ALTER TABLE loi_emails
  ADD CONSTRAINT loi_emails_status_check
  CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'replied'));

-- Create view for agent performance analytics
CREATE OR REPLACE VIEW agent_performance AS
SELECT
  agent_id,
  agent_name,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as total_delivered,
  COUNT(*) FILTER (WHERE opened = TRUE) as total_opened,
  COUNT(*) FILTER (WHERE clicked = TRUE) as total_clicked,
  COUNT(*) FILTER (WHERE replied = TRUE) as total_replied,
  ROUND(100.0 * COUNT(*) FILTER (WHERE opened = TRUE) / NULLIF(COUNT(*), 0), 2) as open_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE clicked = TRUE) / NULLIF(COUNT(*), 0), 2) as click_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE replied = TRUE) / NULLIF(COUNT(*), 0), 2) as reply_rate,
  MIN(sent_at) as first_email_sent,
  MAX(sent_at) as last_email_sent
FROM loi_emails
WHERE status != 'failed'
GROUP BY agent_id, agent_name
ORDER BY total_sent DESC;

-- Comments
COMMENT ON TABLE email_replies IS 'Stores reply content from realtors for tracking and CRM purposes';
COMMENT ON VIEW agent_performance IS 'Analytics view showing agent performance metrics including open rates, click rates, and reply rates';
