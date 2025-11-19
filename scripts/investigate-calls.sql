-- Investigate why we have 528 calls - seems way too high!
-- Run this in Supabase SQL Editor

-- 1. Check daily distribution to see if there's a spike
SELECT '=== DAILY CALL DISTRIBUTION ===' as section;
SELECT
  DATE(started_at) as call_date,
  COUNT(*) as calls_on_date,
  COUNT(DISTINCT agent_id) as agents_active,
  ROUND(AVG(duration), 0) as avg_duration_seconds
FROM call_logs
GROUP BY DATE(started_at)
ORDER BY call_date DESC
LIMIT 30;

-- 2. Check call types and results - maybe including failed/test calls?
SELECT '=== CALL TYPES AND RESULTS ===' as section;
SELECT
  call_type,
  call_result,
  COUNT(*) as count,
  ROUND(AVG(duration), 0) as avg_duration
FROM call_logs
GROUP BY call_type, call_result
ORDER BY count DESC;

-- 3. Check for very short calls (might be test calls or misdials)
SELECT '=== SHORT CALLS (< 10 seconds) ===' as section;
SELECT
  COUNT(*) as short_calls,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM call_logs), 1) as percent_of_total
FROM call_logs
WHERE duration < 10;

-- 4. Look at call directions
SELECT '=== CALL DIRECTIONS ===' as section;
SELECT
  direction,
  COUNT(*) as count,
  ROUND(AVG(duration), 0) as avg_duration
FROM call_logs
GROUP BY direction
ORDER BY count DESC;

-- 5. Sample of actual calls to see what they are
SELECT '=== SAMPLE OF RECENT CALLS ===' as section;
SELECT
  started_at::timestamp as time,
  COALESCE(a.name, 'Agent ' || cl.agent_id::text) as agent,
  direction,
  call_result,
  duration as seconds,
  from_number,
  to_number
FROM call_logs cl
LEFT JOIN agents a ON a.id = cl.agent_id
ORDER BY started_at DESC
LIMIT 20;

-- 6. Check for internal calls (extension to extension)
SELECT '=== INTERNAL VS EXTERNAL CALLS ===' as section;
SELECT
  CASE
    WHEN from_number LIKE '%ext%' OR to_number LIKE '%ext%' THEN 'Internal'
    WHEN from_number IS NULL OR to_number IS NULL THEN 'Missing Number'
    ELSE 'External'
  END as call_category,
  COUNT(*) as count
FROM call_logs
GROUP BY call_category;

-- 7. Calls by agent to see distribution
SELECT '=== TOP AGENTS BY CALL COUNT ===' as section;
SELECT
  COALESCE(a.name, 'Agent ' || cl.agent_id::text) as agent,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN duration >= 30 THEN 1 END) as real_calls_30s_plus,
  COUNT(CASE WHEN duration < 30 THEN 1 END) as short_calls
FROM call_logs cl
LEFT JOIN agents a ON a.id = cl.agent_id
WHERE cl.agent_id IS NOT NULL
GROUP BY cl.agent_id, a.name
ORDER BY total_calls DESC;

-- 8. Check if we're getting calls from multiple extensions/departments
SELECT '=== UNIQUE EXTENSIONS ===' as section;
SELECT
  extension_number,
  COUNT(*) as calls_from_extension
FROM call_logs
WHERE extension_number IS NOT NULL
GROUP BY extension_number
ORDER BY calls_from_extension DESC;