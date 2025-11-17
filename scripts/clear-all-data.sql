-- ================================================
-- CLEAR ALL DATA FROM DATABASE
-- ================================================
-- WARNING: This will delete ALL data from all tables
-- This operation CANNOT be undone!
-- ================================================

-- Disable triggers temporarily to avoid conflicts
SET session_replication_role = replica;

-- Clear all tables in the correct order (respecting foreign key dependencies)

-- Step 1: Clear dependent tables first
TRUNCATE TABLE pipeline_activities CASCADE;
TRUNCATE TABLE pipeline_stage_history CASCADE;
TRUNCATE TABLE email_events CASCADE;
TRUNCATE TABLE email_replies CASCADE;
TRUNCATE TABLE loi_email_outbound_replies CASCADE;

-- Step 2: Clear main tables
TRUNCATE TABLE pipeline_deals CASCADE;
TRUNCATE TABLE loi_emails CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify tables are empty
SELECT
  'pipeline_deals' as table_name,
  COUNT(*) as row_count
FROM pipeline_deals
UNION ALL
SELECT 'pipeline_activities', COUNT(*) FROM pipeline_activities
UNION ALL
SELECT 'pipeline_stage_history', COUNT(*) FROM pipeline_stage_history
UNION ALL
SELECT 'loi_emails', COUNT(*) FROM loi_emails
UNION ALL
SELECT 'email_events', COUNT(*) FROM email_events
UNION ALL
SELECT 'email_replies', COUNT(*) FROM email_replies
UNION ALL
SELECT 'loi_email_outbound_replies', COUNT(*) FROM loi_email_outbound_replies;
