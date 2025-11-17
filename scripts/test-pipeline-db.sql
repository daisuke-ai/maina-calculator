-- =====================================================
-- Test Script: Pipeline Database Verification
-- Purpose: Verify pipeline tables, views, and functions
-- =====================================================

-- =====================================================
-- 1. VERIFY TABLES EXIST
-- =====================================================

SELECT 'Checking tables...' as status;

SELECT table_name,
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('pipeline_deals', 'pipeline_stage_history', 'pipeline_activities')
ORDER BY table_name;

-- =====================================================
-- 2. VERIFY VIEWS EXIST
-- =====================================================

SELECT 'Checking views...' as status;

SELECT table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'pipeline%'
ORDER BY table_name;

-- =====================================================
-- 3. VERIFY FUNCTIONS EXIST
-- =====================================================

SELECT 'Checking functions...' as status;

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('create_pipeline_deal', 'update_deal_stage', 'get_pipeline_metrics_by_range')
ORDER BY routine_name;

-- =====================================================
-- 4. VERIFY INDEXES
-- =====================================================

SELECT 'Checking indexes...' as status;

SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'pipeline%'
ORDER BY tablename, indexname;

-- =====================================================
-- 5. CREATE TEST DATA
-- =====================================================

SELECT 'Creating test data...' as status;

-- Test Deal 1: Active deal in LOI Accepted stage (Agent: Ammar)
SELECT create_pipeline_deal(
  '123 Main St, Indianapolis, IN 46201',  -- property_address
  250000,                                   -- opportunity_value
  1,                                        -- agent_id (Ammar)
  'Ammar',                                  -- agent_name
  'ammar@miana.com.co',                    -- agent_email
  240000,                                   -- offer_price
  0,                                        -- down_payment
  1500,                                     -- monthly_payment
  NULL,                                     -- loi_tracking_id
  '2025-03-15'::DATE,                      -- expected_closing_date
  'system_test'                            -- created_by
) as test_deal_1;

-- Test Deal 2: Deal in Due Diligence stage (Agent: Ada)
DO $$
DECLARE
  v_deal_id UUID;
BEGIN
  -- Create deal
  SELECT create_pipeline_deal(
    '456 Oak Ave, Fort Wayne, IN 46802',
    185000,
    2,
    'Ada',
    'ada@miana.com.co',
    180000,
    0,
    1200,
    NULL,
    '2025-02-28'::DATE,
    'system_test'
  ) INTO v_deal_id;

  -- Move to Due Diligence
  PERFORM update_deal_stage(
    v_deal_id,
    'due_diligence',
    'system_test',
    'Inspection scheduled for next week'
  );
END $$;

-- Test Deal 3: Deal in Contract stage (Agent: Elif)
DO $$
DECLARE
  v_deal_id UUID;
BEGIN
  SELECT create_pipeline_deal(
    '789 Elm St, South Bend, IN 46601',
    320000,
    3,
    'Elif',
    'elif@miana.com.co',
    310000,
    0,
    1800,
    NULL,
    '2025-04-10'::DATE,
    'system_test'
  ) INTO v_deal_id;

  -- Move through stages
  PERFORM update_deal_stage(v_deal_id, 'due_diligence', 'system_test', 'Started DD');
  PERFORM update_deal_stage(v_deal_id, 'contract', 'system_test', 'Contract signed');
END $$;

-- Test Deal 4: Won Deal (Agent: Aylin)
DO $$
DECLARE
  v_deal_id UUID;
BEGIN
  SELECT create_pipeline_deal(
    '321 Pine Dr, Bloomington, IN 47401',
    195000,
    4,
    'Aylin',
    'aylin@miana.com.co',
    190000,
    0,
    1100,
    NULL,
    '2025-01-20'::DATE,
    'system_test'
  ) INTO v_deal_id;

  -- Move through all stages to Won
  PERFORM update_deal_stage(v_deal_id, 'due_diligence', 'system_test', 'DD completed');
  PERFORM update_deal_stage(v_deal_id, 'contract', 'system_test', 'Contract executed');
  PERFORM update_deal_stage(v_deal_id, 'closing', 'system_test', 'Closing scheduled');
  PERFORM update_deal_stage(v_deal_id, 'won', 'system_test', 'Deal closed successfully!');
END $$;

-- Test Deal 5: Lost Deal (Agent: Farhat)
DO $$
DECLARE
  v_deal_id UUID;
BEGIN
  SELECT create_pipeline_deal(
    '555 Maple Ln, Evansville, IN 47708',
    175000,
    5,
    'Farhat',
    'farhat@miana.com.co',
    170000,
    0,
    1000,
    NULL,
    '2025-02-15'::DATE,
    'system_test'
  ) INTO v_deal_id;

  -- Move to Due Diligence then Lost
  PERFORM update_deal_stage(v_deal_id, 'due_diligence', 'system_test', 'Started inspection');
  PERFORM update_deal_stage(v_deal_id, 'lost', 'system_test', 'Inspection revealed major issues');

  -- Add lost reason
  UPDATE pipeline_deals
  SET lost_reason = 'inspection'
  WHERE id = v_deal_id;
END $$;

-- Add some activities to test deals
INSERT INTO pipeline_activities (deal_id, activity_type, title, description, outcome, created_by)
SELECT
  id,
  'call',
  'Initial call with seller',
  'Discussed terms and timeline. Seller seems motivated.',
  'positive',
  'system_test'
FROM pipeline_deals
WHERE property_address = '123 Main St, Indianapolis, IN 46201';

INSERT INTO pipeline_activities (deal_id, activity_type, title, description, outcome, created_by)
SELECT
  id,
  'inspection',
  'Property inspection completed',
  'Inspector found minor issues with roof. Est repair cost $5k.',
  'neutral',
  'system_test'
FROM pipeline_deals
WHERE property_address = '456 Oak Ave, Fort Wayne, IN 46802';

-- =====================================================
-- 6. TEST QUERIES
-- =====================================================

SELECT 'Testing queries...' as status;

-- Test 1: Count deals by status
SELECT 'Deal counts by status:' as test;
SELECT status, COUNT(*) as count
FROM pipeline_deals
GROUP BY status
ORDER BY status;

-- Test 2: Count deals by stage
SELECT 'Deal counts by stage:' as test;
SELECT stage, COUNT(*) as count
FROM pipeline_deals
GROUP BY stage
ORDER BY
  CASE stage
    WHEN 'loi_accepted' THEN 1
    WHEN 'due_diligence' THEN 2
    WHEN 'contract' THEN 3
    WHEN 'closing' THEN 4
    WHEN 'won' THEN 5
    WHEN 'lost' THEN 6
  END;

-- Test 3: Pipeline Summary View
SELECT 'Pipeline summary:' as test;
SELECT * FROM pipeline_summary_view;

-- Test 4: Pipeline by Stage View
SELECT 'Pipeline by stage:' as test;
SELECT * FROM pipeline_by_stage_view;

-- Test 5: Agent Pipeline Performance View
SELECT 'Agent performance:' as test;
SELECT * FROM agent_pipeline_performance_view
ORDER BY total_won_value DESC NULLS LAST;

-- Test 6: Pipeline Forecast View
SELECT 'Pipeline forecast:' as test;
SELECT * FROM pipeline_forecast_view;

-- Test 7: Stage History
SELECT 'Stage history for active deals:' as test;
SELECT
  d.property_address,
  h.from_stage,
  h.to_stage,
  h.days_in_previous_stage,
  h.transitioned_at
FROM pipeline_stage_history h
JOIN pipeline_deals d ON h.deal_id = d.id
WHERE d.status = 'active'
ORDER BY d.property_address, h.transitioned_at;

-- Test 8: Activities
SELECT 'Recent activities:' as test;
SELECT
  d.property_address,
  a.activity_type,
  a.title,
  a.outcome,
  a.created_at
FROM pipeline_activities a
JOIN pipeline_deals d ON a.deal_id = d.id
ORDER BY a.created_at DESC;

-- Test 9: Get metrics for last 30 days
SELECT 'Metrics for last 30 days:' as test;
SELECT * FROM get_pipeline_metrics_by_range(30);

-- Test 10: Active pipeline value
SELECT 'Active pipeline value:' as test;
SELECT
  COUNT(*) as active_deals,
  SUM(opportunity_value) as total_value,
  SUM(opportunity_value * probability_to_close / 100.0) as weighted_value
FROM pipeline_deals
WHERE status = 'active';

-- =====================================================
-- 7. SUMMARY
-- =====================================================

SELECT 'Test complete!' as status;

SELECT
  'Total Deals Created: ' || COUNT(*) as summary
FROM pipeline_deals
UNION ALL
SELECT
  'Active Deals: ' || COUNT(*)
FROM pipeline_deals WHERE status = 'active'
UNION ALL
SELECT
  'Won Deals: ' || COUNT(*)
FROM pipeline_deals WHERE status = 'won'
UNION ALL
SELECT
  'Lost Deals: ' || COUNT(*)
FROM pipeline_deals WHERE status = 'lost'
UNION ALL
SELECT
  'Total Pipeline Value: $' || COALESCE(SUM(opportunity_value), 0)::TEXT
FROM pipeline_deals WHERE status = 'active'
UNION ALL
SELECT
  'Total Activities: ' || COUNT(*)
FROM pipeline_activities
UNION ALL
SELECT
  'Total Stage Transitions: ' || COUNT(*)
FROM pipeline_stage_history;

-- =====================================================
-- CLEANUP (OPTIONAL - UNCOMMENT TO REMOVE TEST DATA)
-- =====================================================

-- To remove test data, uncomment below:
-- DELETE FROM pipeline_deals WHERE created_by = 'system_test';
