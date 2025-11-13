-- LOI Email Tracking Tables

-- Table: loi_emails
-- Stores all sent LOI emails with offer details
CREATE TABLE IF NOT EXISTS loi_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id TEXT UNIQUE NOT NULL,

  -- Agent Information
  agent_id INTEGER NOT NULL,
  agent_email TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_phone TEXT,

  -- Realtor Information
  realtor_email TEXT NOT NULL,
  realtor_name TEXT,

  -- Property Details
  property_address TEXT NOT NULL,

  -- Offer Details
  offer_type TEXT NOT NULL, -- 'Owner Favored', 'Balanced', 'Buyer Favored'
  offer_price NUMERIC(12, 2) NOT NULL,
  down_payment NUMERIC(12, 2) NOT NULL,
  monthly_payment NUMERIC(12, 2) NOT NULL,
  balloon_year INTEGER NOT NULL,
  closing_costs NUMERIC(12, 2) NOT NULL,
  closing_days INTEGER NOT NULL,

  -- Email Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,

  -- Engagement Tracking
  opened BOOLEAN DEFAULT FALSE,
  open_count INTEGER DEFAULT 0,
  opened_at TIMESTAMPTZ,

  clicked BOOLEAN DEFAULT FALSE,
  click_count INTEGER DEFAULT 0,
  clicked_at TIMESTAMPTZ,

  replied BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMPTZ,

  -- Metadata
  error_message TEXT,
  resend_email_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: email_events
-- Stores detailed webhook events from Resend
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES loi_emails(id) ON DELETE CASCADE,
  tracking_id TEXT NOT NULL,

  -- Event Details
  event_type TEXT NOT NULL, -- 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', etc.
  event_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loi_emails_tracking_id ON loi_emails(tracking_id);
CREATE INDEX IF NOT EXISTS idx_loi_emails_agent_id ON loi_emails(agent_id);
CREATE INDEX IF NOT EXISTS idx_loi_emails_agent_email ON loi_emails(agent_email);
CREATE INDEX IF NOT EXISTS idx_loi_emails_property_address ON loi_emails(property_address);
CREATE INDEX IF NOT EXISTS idx_loi_emails_sent_at ON loi_emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_tracking_id ON email_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_loi_emails_updated_at
  BEFORE UPDATE ON loi_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE loi_emails IS 'Tracks all LOI emails sent to realtors with offer details and engagement metrics';
COMMENT ON TABLE email_events IS 'Stores detailed webhook events from Resend email service';
