-- Script to DELETE ALL call data and start fresh
-- ⚠️  WARNING: This will permanently delete all call records!
-- Run this in Supabase SQL Editor

-- Show current state before deletion
SELECT
  'BEFORE DELETE - Total Records' as status,
  COUNT(*) as count
FROM call_logs;

-- DELETE ALL CALL RECORDS
-- Uncomment the line below to execute the deletion
-- DELETE FROM call_logs;

-- After running the DELETE, verify it worked:
/*
SELECT
  'AFTER DELETE - Total Records' as status,
  COUNT(*) as count
FROM call_logs;
*/

-- Alternative: If you want to keep table structure but reset auto-increment:
/*
TRUNCATE TABLE call_logs RESTART IDENTITY;
*/