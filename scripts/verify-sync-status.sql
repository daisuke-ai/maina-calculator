-- Quick verification of sync status
-- Run this in Supabase SQL Editor

-- 1. Overall Summary
SELECT '=== SYNC STATUS SUMMARY ===' as section;

SELECT
  'Total Call Records' as metric,
  COUNT(*) as value
FROM call_logs
UNION ALL
SELECT
  'Calls with Agent Mapping' as metric,
  COUNT(*) as value
FROM call_logs
WHERE agent_id IS NOT NULL
UNION ALL
SELECT
  'Accuracy Rate' as metric,
  ROUND(COUNT(CASE WHEN agent_id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) || '%' as value
FROM call_logs
UNION ALL
SELECT
  'Unique Sessions' as metric,
  COUNT(DISTINCT session_id)::text as value
FROM call_logs
UNION ALL
SELECT
  'Duplicate Sessions' as metric,
  COUNT(*)::text as value
FROM (
  SELECT session_id
  FROM call_logs
  GROUP BY session_id
  HAVING COUNT(*) > 1
) dupes;

-- 2. Calls by Agent (Should be reasonable numbers, not 500+)
SELECT '=== CALLS PER AGENT ===' as section;

SELECT
  COALESCE(a.name, 'Unknown Agent ' || cl.agent_id::text) as agent_name,
  COUNT(*) as total_calls,
  MIN(cl.started_at)::date as first_call,
  MAX(cl.started_at)::date as last_call,
  COUNT(DISTINCT DATE(cl.started_at)) as active_days,
  ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT DATE(cl.started_at)), 0), 1) as avg_calls_per_day
FROM call_logs cl
LEFT JOIN agents a ON a.id = cl.agent_id
WHERE cl.agent_id IS NOT NULL
GROUP BY cl.agent_id, a.name
ORDER BY total_calls DESC
LIMIT 10;

-- 3. Recent Sync Activity
SELECT '=== SYNC TIMELINE ===' as section;

SELECT
  DATE(synced_at) as sync_date,
  COUNT(*) as records_synced,
  MIN(started_at)::date as earliest_call,
  MAX(started_at)::date as latest_call
FROM call_logs
GROUP BY DATE(synced_at)
ORDER BY sync_date DESC
LIMIT 5;

-- 4. Data Quality Check
SELECT '=== DATA QUALITY CHECK ===' as section;

SELECT
  CASE
    WHEN COUNT(*) = 528 THEN '✅ PASS: Expected record count matches'
    ELSE '⚠️  CHECK: Expected 528, got ' || COUNT(*)
  END as record_count_check,
  CASE
    WHEN COUNT(DISTINCT session_id) = COUNT(*) THEN '✅ PASS: No duplicate sessions'
    ELSE '❌ FAIL: Found ' || (COUNT(*) - COUNT(DISTINCT session_id)) || ' duplicates'
  END as duplicate_check,
  CASE
    WHEN MAX(CAST(COUNT(*) as numeric)) <= 100 THEN '✅ PASS: No inflated agent counts'
    ELSE '⚠️  CHECK: Some agents have > 100 calls'
  END as inflation_check
FROM call_logs
GROUP BY agent_id;