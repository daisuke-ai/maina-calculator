-- Find the REAL calls vs. noise in the database
-- Run this in Supabase SQL Editor to understand what's happening

-- 1. Quick Summary
SELECT '=== THE PROBLEM ===' as finding;
SELECT
  'We fetched ACCOUNT-WIDE calls, not just your team!' as issue,
  COUNT(*) as total_calls_in_db
FROM call_logs;

-- 2. Show call breakdown by duration (many might be voicemail/misdials)
SELECT '=== CALL DURATION BREAKDOWN ===' as section;
SELECT
  CASE
    WHEN duration < 5 THEN '< 5 seconds (likely misdial/voicemail)'
    WHEN duration < 30 THEN '5-30 seconds (quick call)'
    WHEN duration < 60 THEN '30-60 seconds (short call)'
    WHEN duration < 300 THEN '1-5 minutes (normal call)'
    ELSE '> 5 minutes (long call)'
  END as duration_category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM call_logs), 1) || '%' as percentage
FROM call_logs
GROUP BY duration_category
ORDER BY
  CASE duration_category
    WHEN '< 5 seconds (likely misdial/voicemail)' THEN 1
    WHEN '5-30 seconds (quick call)' THEN 2
    WHEN '30-60 seconds (short call)' THEN 3
    WHEN '1-5 minutes (normal call)' THEN 4
    ELSE 5
  END;

-- 3. Show extensions that have calls (you probably only recognize a few)
SELECT '=== ALL EXTENSIONS WITH CALLS ===' as section;
SELECT
  COALESCE(extension_number, 'No Extension') as extension,
  COUNT(*) as call_count
FROM call_logs
GROUP BY extension_number
ORDER BY call_count DESC;

-- 4. Likely REAL business calls (over 30 seconds, successful)
SELECT '=== LIKELY REAL CALLS ===' as section;
SELECT
  COUNT(*) as real_call_count,
  COUNT(DISTINCT DATE(started_at)) as days_with_calls,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT DATE(started_at)), 1) as avg_calls_per_day
FROM call_logs
WHERE duration >= 30
  AND call_result IN ('Call connected', 'Accepted', 'Success', 'Hang up', 'Voicemail');

-- 5. Show which agents actually have calls
SELECT '=== YOUR MAPPED AGENTS ===' as section;
SELECT
  a.name as agent_name,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN cl.duration >= 30 THEN 1 END) as real_calls_30s_plus,
  COUNT(CASE WHEN cl.duration < 30 THEN 1 END) as short_calls
FROM call_logs cl
JOIN agents a ON a.id = cl.agent_id
GROUP BY a.name
ORDER BY total_calls DESC;

-- 6. Sample of recent calls to see what they actually are
SELECT '=== SAMPLE OF RECENT CALLS ===' as section;
SELECT
  DATE(started_at) as date,
  to_char(started_at::time, 'HH24:MI') as time,
  direction,
  duration || 's' as duration,
  call_result,
  CASE
    WHEN from_number IS NOT NULL THEN SUBSTR(from_number, 1, 6) || '****'
    ELSE 'N/A'
  END as from_partial,
  CASE
    WHEN to_number IS NOT NULL THEN SUBSTR(to_number, 1, 6) || '****'
    ELSE 'N/A'
  END as to_partial
FROM call_logs
ORDER BY started_at DESC
LIMIT 20;

-- 7. The bottom line - what you probably actually care about
SELECT '=== BOTTOM LINE ===' as section;
SELECT
  (SELECT COUNT(*) FROM call_logs) as total_fetched,
  (SELECT COUNT(*) FROM call_logs WHERE duration >= 30) as calls_over_30_seconds,
  (SELECT COUNT(*) FROM call_logs WHERE agent_id IS NOT NULL AND duration >= 30) as your_team_real_calls,
  (SELECT COUNT(DISTINCT extension_number) FROM call_logs WHERE extension_number IS NOT NULL) as unique_extensions_found;