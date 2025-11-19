-- Script to identify and clean up duplicate call records
-- Run this in Supabase SQL Editor

-- First, let's see the extent of the problem
SELECT 'Total call records' as metric, COUNT(*) as count FROM call_logs
UNION ALL
SELECT 'Unique session_ids' as metric, COUNT(DISTINCT session_id) as count FROM call_logs
UNION ALL
SELECT 'Duplicate session_ids' as metric,
       COUNT(*) as count
FROM (
  SELECT session_id, COUNT(*) as cnt
  FROM call_logs
  GROUP BY session_id
  HAVING COUNT(*) > 1
) dupes;

-- Show sample of duplicates
SELECT
  session_id,
  COUNT(*) as duplicate_count,
  MIN(id) as first_id,
  MAX(id) as last_id,
  MIN(synced_at) as first_sync,
  MAX(synced_at) as last_sync
FROM call_logs
GROUP BY session_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- CLEANUP: Remove duplicate calls, keeping only the first occurrence of each session_id
-- Uncomment the following to execute the cleanup:

/*
-- Create temporary table with duplicates to remove
CREATE TEMP TABLE duplicates_to_remove AS
SELECT id
FROM (
  SELECT
    id,
    session_id,
    ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY synced_at ASC, id ASC) as rn
  FROM call_logs
) ranked
WHERE rn > 1;

-- Show how many records will be deleted
SELECT COUNT(*) as "Records to delete" FROM duplicates_to_remove;

-- Delete the duplicates
DELETE FROM call_logs
WHERE id IN (SELECT id FROM duplicates_to_remove);

-- Verify cleanup
SELECT
  'After cleanup - Total records' as metric,
  COUNT(*) as count
FROM call_logs
UNION ALL
SELECT
  'After cleanup - Unique sessions' as metric,
  COUNT(DISTINCT session_id) as count
FROM call_logs;
*/