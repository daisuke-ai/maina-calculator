-- Add html_content and resend_message_id columns to loi_emails table
-- This allows us to store the original LOI email HTML for reference in replies

ALTER TABLE loi_emails
ADD COLUMN IF NOT EXISTS html_content TEXT;

ALTER TABLE loi_emails
ADD COLUMN IF NOT EXISTS resend_message_id TEXT;

COMMENT ON COLUMN loi_emails.html_content IS 'Original HTML content of the LOI email sent';
COMMENT ON COLUMN loi_emails.resend_message_id IS 'Message-ID header from Resend for email threading';
