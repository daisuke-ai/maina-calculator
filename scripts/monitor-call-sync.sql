-- Monitoring script to verify call sync accuracy
-- Run this periodically in Supabase SQL Editor to monitor data quality

-- 1. Overall Call Statistics
SELECT
  'Total Calls' as metric,
  COUNT(*) as value
FROM call_logs
UNION ALL
SELECT
  'Mapped Calls (with agent_id)' as metric,
  COUNT(*) as value
FROM call_logs
WHERE agent_id IS NOT NULL
UNION ALL
SELECT
  'Unmapped Calls' as metric,
  COUNT(*) as value
FROM call_logs
WHERE agent_id IS NULL
UNION ALL
SELECT
  'Unique Sessions' as metric,
  COUNT(DISTINCT session_id) as value
FROM call_logs;

-- 2. Calls by Agent (Top 10)
SELECT
  COALESCE(a.name, 'Agent ' || cl.agent_id::text) as agent_name,
  cl.agent_id,
  COUNT(*) as total_calls,
  COUNT(DISTINCT DATE(cl.started_at)) as active_days,
  ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT DATE(cl.started_at)), 0), 1) as avg_calls_per_day,
  MIN(cl.started_at)::date as first_call,
  MAX(cl.started_at)::date as last_call
FROM call_logs cl
LEFT JOIN agents a ON a.id = cl.agent_id
WHERE cl.agent_id IS NOT NULL
GROUP BY cl.agent_id, a.name
ORDER BY total_calls DESC
LIMIT 10;

-- 3. Data Quality Checks
SELECT
  'Duplicate Session IDs' as check_name,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL: ' || COUNT(*) || ' duplicates found'
  END as status
FROM (
  SELECT session_id
  FROM call_logs
  GROUP BY session_id
  HAVING COUNT(*) > 1
) dupes
UNION ALL
SELECT
  'Accuracy Rate' as check_name,
  CASE
    WHEN (COUNT(CASE WHEN agent_id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) >= 80
    THEN '✅ PASS: ' || ROUND(COUNT(CASE WHEN agent_id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) || '%'
    ELSE '⚠️  LOW: ' || ROUND(COUNT(CASE WHEN agent_id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) || '%'
  END as status
FROM call_logs
UNION ALL
SELECT
  'Recent Sync Activity' as check_name,
  CASE
    WHEN MAX(synced_at) > NOW() - INTERVAL '12 hours'
    THEN '✅ ACTIVE: Last sync ' || AGE(NOW(), MAX(synced_at))::text || ' ago'
    ELSE '⚠️  STALE: Last sync ' || AGE(NOW(), MAX(synced_at))::text || ' ago'
  END as status
FROM call_logs;

-- 4. Daily Call Volume (Last 7 Days)
SELECT
  DATE(started_at) as date,
  COUNT(*) as total_calls,
  COUNT(DISTINCT agent_id) as active_agents,
  COUNT(CASE WHEN agent_id IS NOT NULL THEN 1 END) as mapped_calls,
  COUNT(CASE WHEN agent_id IS NULL THEN 1 END) as unmapped_calls,
  ROUND(COUNT(CASE WHEN agent_id IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as accuracy_percent
FROM call_logs
WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- 5. Extensions Without Agent Mapping
SELECT
  extension_number,
  COUNT(*) as unmapped_calls,
  MIN(started_at)::date as first_seen,
  MAX(started_at)::date as last_seen
FROM call_logs
WHERE agent_id IS NULL
  AND extension_number IS NOT NULL
GROUP BY extension_number
ORDER BY unmapped_calls DESC
LIMIT 10;