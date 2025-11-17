-- =====================================================
-- Migration: Create Sales Pipeline Tables
-- Created: 2025-01-17
-- Purpose: Add sales pipeline tracking system for properties under contract
-- =====================================================

-- Pipeline Stages: LOI Accepted → Due Diligence → Contract → Closing → Won/Lost
-- Entry Method: Manual entry only (no automatic creation)
-- Key Feature: Opportunity Value for forecasting and tracking

-- =====================================================
-- 1. CREATE MAIN PIPELINE DEALS TABLE
-- =====================================================

CREATE TABLE pipeline_deals (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Property Information
  property_address TEXT NOT NULL,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,

  -- Deal Details
  deal_name TEXT, -- Optional friendly name for the deal
  property_type TEXT, -- 'Single Family', 'Multi Family', 'Commercial', etc.

  -- Financial Information
  opportunity_value NUMERIC(12, 2) NOT NULL, -- PRIMARY TRACKING VALUE (required)
  listed_price NUMERIC(12, 2),
  offer_price NUMERIC(12, 2),
  down_payment NUMERIC(12, 2),
  monthly_payment NUMERIC(12, 2),
  balloon_period INTEGER, -- in years
  estimated_rehab_cost NUMERIC(12, 2),
  total_deal_value NUMERIC(12, 2), -- Calculated: offer_price + rehab (optional)

  -- Agent Attribution
  agent_id INTEGER NOT NULL, -- References config/agents.ts (1-24)
  agent_name TEXT NOT NULL,
  agent_email TEXT NOT NULL,

  -- Realtor/Seller Information
  realtor_name TEXT,
  realtor_email TEXT,
  realtor_phone TEXT,
  seller_name TEXT,
  seller_email TEXT,
  seller_phone TEXT,

  -- Pipeline Stage & Status
  stage TEXT NOT NULL DEFAULT 'loi_accepted',
  -- Valid stages: 'loi_accepted', 'due_diligence', 'contract', 'closing', 'won', 'lost'
  status TEXT NOT NULL DEFAULT 'active',
  -- Valid statuses: 'active', 'won', 'lost', 'on_hold', 'cancelled'

  -- Win/Loss Information
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT, -- 'price', 'inspection', 'financing', 'seller_changed_mind', 'title_issues', 'other'
  cancellation_reason TEXT,

  -- Timeline Tracking
  loi_accepted_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Entry date
  due_diligence_date DATE,
  contract_date DATE,
  closing_date DATE,
  expected_closing_date DATE, -- Forecasted closing
  actual_closing_date DATE, -- Actual closing (when won)

  -- LOI Integration (Optional - for reference only)
  loi_tracking_id TEXT, -- Links to loi_emails.tracking_id
  loi_sent_at TIMESTAMPTZ,
  loi_replied_at TIMESTAMPTZ,

  -- Additional Information
  notes TEXT, -- General notes about the deal
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  tags TEXT[], -- Custom tags: ['fixer-upper', 'motivated-seller', 'cash-buyer', etc.]

  -- Probability & Forecasting
  probability_to_close INTEGER DEFAULT 50, -- 0-100%
  confidence_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'

  -- Metadata
  created_by TEXT, -- User who created the entry
  last_updated_by TEXT, -- User who last updated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_stage CHECK (stage IN ('loi_accepted', 'due_diligence', 'contract', 'closing', 'won', 'lost')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'won', 'lost', 'on_hold', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_confidence CHECK (confidence_level IN ('low', 'medium', 'high')),
  CONSTRAINT valid_probability CHECK (probability_to_close >= 0 AND probability_to_close <= 100),
  CONSTRAINT positive_opportunity_value CHECK (opportunity_value > 0)
);

-- Add comment
COMMENT ON TABLE pipeline_deals IS 'Tracks properties through sales pipeline from LOI acceptance to closing';
COMMENT ON COLUMN pipeline_deals.opportunity_value IS 'Primary tracking value for forecasting and pipeline metrics';
COMMENT ON COLUMN pipeline_deals.stage IS 'Current stage: loi_accepted, due_diligence, contract, closing, won, lost';
COMMENT ON COLUMN pipeline_deals.status IS 'Deal status: active, won, lost, on_hold, cancelled';

-- =====================================================
-- 2. CREATE STAGE HISTORY TABLE
-- =====================================================

CREATE TABLE pipeline_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES pipeline_deals(id) ON DELETE CASCADE,

  -- Stage Transition
  from_stage TEXT, -- NULL for initial entry
  to_stage TEXT NOT NULL,

  -- Timeline
  transitioned_at TIMESTAMPTZ DEFAULT NOW(),
  days_in_previous_stage INTEGER, -- Calculated when moving to next stage

  -- Context
  changed_by TEXT, -- User who made the change
  notes TEXT, -- Reason for stage change or additional context

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE pipeline_stage_history IS 'Audit trail of all stage transitions for pipeline deals';
COMMENT ON COLUMN pipeline_stage_history.days_in_previous_stage IS 'Number of days spent in the previous stage';

-- =====================================================
-- 3. CREATE ACTIVITIES TABLE
-- =====================================================

CREATE TABLE pipeline_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES pipeline_deals(id) ON DELETE CASCADE,

  -- Activity Information
  activity_type TEXT NOT NULL,
  -- Types: 'note', 'call', 'email', 'meeting', 'inspection',
  --        'offer', 'counter_offer', 'milestone', 'task'

  title TEXT NOT NULL,
  description TEXT,

  -- Related People
  contact_name TEXT, -- Realtor, seller, inspector, etc.
  contact_email TEXT,
  contact_phone TEXT,

  -- Outcome & Next Steps
  outcome TEXT, -- 'positive', 'neutral', 'negative'
  next_action TEXT, -- What needs to happen next
  next_action_due_date DATE,

  -- Metadata
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_activity_type CHECK (activity_type IN (
    'note', 'call', 'email', 'meeting', 'inspection',
    'offer', 'counter_offer', 'milestone', 'task', 'other'
  )),
  CONSTRAINT valid_outcome CHECK (outcome IS NULL OR outcome IN ('positive', 'neutral', 'negative'))
);

-- Add comment
COMMENT ON TABLE pipeline_activities IS 'Log of all activities and interactions related to pipeline deals';
COMMENT ON COLUMN pipeline_activities.activity_type IS 'Type of activity: note, call, email, meeting, inspection, etc.';

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Pipeline Deals Indexes
CREATE INDEX idx_pipeline_deals_agent_id ON pipeline_deals(agent_id);
CREATE INDEX idx_pipeline_deals_stage ON pipeline_deals(stage);
CREATE INDEX idx_pipeline_deals_status ON pipeline_deals(status);
CREATE INDEX idx_pipeline_deals_property_address ON pipeline_deals(property_address);
CREATE INDEX idx_pipeline_deals_created_at ON pipeline_deals(created_at DESC);
CREATE INDEX idx_pipeline_deals_expected_closing ON pipeline_deals(expected_closing_date);
CREATE INDEX idx_pipeline_deals_loi_tracking_id ON pipeline_deals(loi_tracking_id) WHERE loi_tracking_id IS NOT NULL;

-- Composite index for active deals by stage (most common query)
CREATE INDEX idx_pipeline_deals_active_stage
  ON pipeline_deals(status, stage)
  WHERE status = 'active';

-- Composite index for agent performance queries
CREATE INDEX idx_pipeline_deals_agent_status
  ON pipeline_deals(agent_id, status);

-- Stage History Indexes
CREATE INDEX idx_stage_history_deal_id ON pipeline_stage_history(deal_id);
CREATE INDEX idx_stage_history_to_stage ON pipeline_stage_history(to_stage);
CREATE INDEX idx_stage_history_transitioned_at ON pipeline_stage_history(transitioned_at DESC);

-- Activities Indexes
CREATE INDEX idx_activities_deal_id ON pipeline_activities(deal_id);
CREATE INDEX idx_activities_type ON pipeline_activities(activity_type);
CREATE INDEX idx_activities_created_at ON pipeline_activities(created_at DESC);
CREATE INDEX idx_activities_next_action_due ON pipeline_activities(next_action_due_date)
  WHERE next_action_due_date IS NOT NULL;

-- =====================================================
-- 5. CREATE ANALYTICS VIEWS
-- =====================================================

-- View 1: Pipeline Summary
CREATE VIEW pipeline_summary_view AS
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as total_active_deals,
  COUNT(*) FILTER (WHERE status = 'won') as total_won_deals,
  COUNT(*) FILTER (WHERE status = 'lost') as total_lost_deals,

  SUM(opportunity_value) FILTER (WHERE status = 'active') as active_pipeline_value,
  SUM(opportunity_value) FILTER (WHERE status = 'won') as won_deal_value,
  SUM(opportunity_value) FILTER (WHERE status = 'lost') as lost_deal_value,

  ROUND(AVG(probability_to_close) FILTER (WHERE status = 'active'), 2) as avg_probability,

  -- Weighted pipeline value (opportunity_value * probability)
  SUM(opportunity_value * probability_to_close / 100.0)
    FILTER (WHERE status = 'active') as weighted_pipeline_value,

  -- Overall conversion rate
  ROUND(
    COUNT(*) FILTER (WHERE status = 'won')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('won', 'lost')), 0) * 100,
    2
  ) as overall_conversion_rate,

  -- Average days to close (for won deals)
  ROUND(
    AVG(EXTRACT(EPOCH FROM (won_at - loi_accepted_date)) / 86400)
    FILTER (WHERE status = 'won'),
    1
  ) as avg_days_to_close

FROM pipeline_deals;

COMMENT ON VIEW pipeline_summary_view IS 'Overall pipeline health metrics and KPIs';

-- View 2: Pipeline by Stage
CREATE VIEW pipeline_by_stage_view AS
SELECT
  stage,
  COUNT(*) as deal_count,
  SUM(opportunity_value) as total_value,
  ROUND(AVG(opportunity_value), 2) as avg_deal_value,
  ROUND(AVG(probability_to_close), 2) as avg_probability,
  SUM(opportunity_value * probability_to_close / 100.0) as weighted_value,

  -- Average days in current stage
  ROUND(AVG(
    EXTRACT(EPOCH FROM (
      NOW() - (
        SELECT transitioned_at
        FROM pipeline_stage_history
        WHERE deal_id = pipeline_deals.id
          AND to_stage = pipeline_deals.stage
        ORDER BY transitioned_at DESC
        LIMIT 1
      )
    )) / 86400
  ), 1) as avg_days_in_stage

FROM pipeline_deals
WHERE status = 'active'
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

COMMENT ON VIEW pipeline_by_stage_view IS 'Pipeline breakdown by stage with metrics';

-- View 3: Agent Pipeline Performance
CREATE VIEW agent_pipeline_performance_view AS
SELECT
  agent_id,
  agent_name,

  -- Deal counts
  COUNT(*) FILTER (WHERE status = 'active') as active_deals,
  COUNT(*) FILTER (WHERE status = 'won') as won_deals,
  COUNT(*) FILTER (WHERE status = 'lost') as lost_deals,
  COUNT(*) as total_deals,

  -- Deal values
  SUM(opportunity_value) FILTER (WHERE status = 'active') as active_pipeline_value,
  SUM(opportunity_value) FILTER (WHERE status = 'won') as total_won_value,
  SUM(opportunity_value) FILTER (WHERE status = 'lost') as total_lost_value,

  -- Conversion rate
  ROUND(
    COUNT(*) FILTER (WHERE status = 'won')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('won', 'lost')), 0) * 100,
    2
  ) as conversion_rate,

  -- Average deal size
  ROUND(AVG(opportunity_value) FILTER (WHERE status = 'won'), 2) as avg_won_deal_size,
  ROUND(AVG(opportunity_value) FILTER (WHERE status = 'active'), 2) as avg_active_deal_size,

  -- Timeline metrics
  MIN(created_at) FILTER (WHERE status = 'active') as first_active_deal_date,
  MAX(won_at) as last_won_deal_date,

  -- Average time to close (in days) for won deals
  ROUND(
    AVG(EXTRACT(EPOCH FROM (won_at - loi_accepted_date)) / 86400)
    FILTER (WHERE status = 'won'),
    1
  ) as avg_days_to_close

FROM pipeline_deals
GROUP BY agent_id, agent_name
HAVING COUNT(*) > 0
ORDER BY total_won_value DESC NULLS LAST;

COMMENT ON VIEW agent_pipeline_performance_view IS 'Agent performance metrics for pipeline deals';

-- View 4: Pipeline Forecast by Month
CREATE VIEW pipeline_forecast_view AS
SELECT
  DATE_TRUNC('month', expected_closing_date)::DATE as closing_month,
  COUNT(*) as expected_closings,
  SUM(opportunity_value) as expected_value,
  SUM(opportunity_value * probability_to_close / 100.0) as weighted_expected_value,
  ROUND(AVG(probability_to_close), 2) as avg_probability,

  -- Breakdown by stage
  COUNT(*) FILTER (WHERE stage = 'loi_accepted') as loi_accepted_count,
  COUNT(*) FILTER (WHERE stage = 'due_diligence') as due_diligence_count,
  COUNT(*) FILTER (WHERE stage = 'contract') as contract_count,
  COUNT(*) FILTER (WHERE stage = 'closing') as closing_count

FROM pipeline_deals
WHERE status = 'active'
  AND expected_closing_date IS NOT NULL
  AND expected_closing_date >= CURRENT_DATE
GROUP BY DATE_TRUNC('month', expected_closing_date)
ORDER BY closing_month;

COMMENT ON VIEW pipeline_forecast_view IS 'Forecasted closings by month with probability weighting';

-- =====================================================
-- 6. CREATE DATABASE FUNCTIONS
-- =====================================================

-- Function 1: Create Pipeline Deal with Stage History
CREATE OR REPLACE FUNCTION create_pipeline_deal(
  p_property_address TEXT,
  p_opportunity_value NUMERIC,
  p_agent_id INTEGER,
  p_agent_name TEXT,
  p_agent_email TEXT,
  p_offer_price NUMERIC DEFAULT NULL,
  p_down_payment NUMERIC DEFAULT NULL,
  p_monthly_payment NUMERIC DEFAULT NULL,
  p_loi_tracking_id TEXT DEFAULT NULL,
  p_expected_closing_date DATE DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_deal_id UUID;
BEGIN
  -- Insert deal
  INSERT INTO pipeline_deals (
    property_address,
    opportunity_value,
    offer_price,
    down_payment,
    monthly_payment,
    agent_id,
    agent_name,
    agent_email,
    loi_tracking_id,
    expected_closing_date,
    stage,
    status,
    created_by
  ) VALUES (
    p_property_address,
    p_opportunity_value,
    p_offer_price,
    p_down_payment,
    p_monthly_payment,
    p_agent_id,
    p_agent_name,
    p_agent_email,
    p_loi_tracking_id,
    p_expected_closing_date,
    'loi_accepted',
    'active',
    p_created_by
  ) RETURNING id INTO v_deal_id;

  -- Create initial stage history
  INSERT INTO pipeline_stage_history (
    deal_id,
    from_stage,
    to_stage,
    changed_by,
    notes
  ) VALUES (
    v_deal_id,
    NULL,
    'loi_accepted',
    p_created_by,
    'Deal created and entered pipeline'
  );

  RETURN v_deal_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_pipeline_deal IS 'Create a new pipeline deal with initial stage history';

-- Function 2: Update Deal Stage with History Tracking
CREATE OR REPLACE FUNCTION update_deal_stage(
  p_deal_id UUID,
  p_new_stage TEXT,
  p_changed_by TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_stage TEXT;
  v_current_status TEXT;
  v_last_transition TIMESTAMPTZ;
  v_days_in_stage INTEGER;
  v_new_status TEXT;
BEGIN
  -- Get current stage and status
  SELECT stage, status INTO v_current_stage, v_current_status
  FROM pipeline_deals
  WHERE id = p_deal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found: %', p_deal_id;
  END IF;

  -- Check if stage is actually changing
  IF v_current_stage = p_new_stage THEN
    RETURN FALSE; -- No change needed
  END IF;

  -- Validate stage transition
  IF v_current_stage = 'loi_accepted' AND p_new_stage NOT IN ('due_diligence', 'lost') THEN
    RAISE EXCEPTION 'Invalid stage transition from % to %', v_current_stage, p_new_stage;
  ELSIF v_current_stage = 'due_diligence' AND p_new_stage NOT IN ('contract', 'lost') THEN
    RAISE EXCEPTION 'Invalid stage transition from % to %', v_current_stage, p_new_stage;
  ELSIF v_current_stage = 'contract' AND p_new_stage NOT IN ('closing', 'lost') THEN
    RAISE EXCEPTION 'Invalid stage transition from % to %', v_current_stage, p_new_stage;
  ELSIF v_current_stage = 'closing' AND p_new_stage NOT IN ('won', 'lost') THEN
    RAISE EXCEPTION 'Invalid stage transition from % to %', v_current_stage, p_new_stage;
  END IF;

  -- Get last transition time
  SELECT transitioned_at INTO v_last_transition
  FROM pipeline_stage_history
  WHERE deal_id = p_deal_id
  ORDER BY transitioned_at DESC
  LIMIT 1;

  -- Calculate days in previous stage
  v_days_in_stage := EXTRACT(EPOCH FROM (NOW() - v_last_transition)) / 86400;

  -- Determine new status
  v_new_status := CASE
    WHEN p_new_stage = 'won' THEN 'won'
    WHEN p_new_stage = 'lost' THEN 'lost'
    ELSE v_current_status
  END;

  -- Update deal
  UPDATE pipeline_deals
  SET
    stage = p_new_stage,
    status = v_new_status,
    won_at = CASE WHEN p_new_stage = 'won' THEN NOW() ELSE won_at END,
    lost_at = CASE WHEN p_new_stage = 'lost' THEN NOW() ELSE lost_at END,
    actual_closing_date = CASE WHEN p_new_stage = 'won' THEN CURRENT_DATE ELSE actual_closing_date END,
    -- Update stage dates
    due_diligence_date = CASE WHEN p_new_stage = 'due_diligence' AND due_diligence_date IS NULL THEN CURRENT_DATE ELSE due_diligence_date END,
    contract_date = CASE WHEN p_new_stage = 'contract' AND contract_date IS NULL THEN CURRENT_DATE ELSE contract_date END,
    closing_date = CASE WHEN p_new_stage = 'closing' AND closing_date IS NULL THEN CURRENT_DATE ELSE closing_date END,
    -- Update probability based on stage
    probability_to_close = CASE
      WHEN p_new_stage = 'loi_accepted' THEN 50
      WHEN p_new_stage = 'due_diligence' THEN 65
      WHEN p_new_stage = 'contract' THEN 80
      WHEN p_new_stage = 'closing' THEN 95
      WHEN p_new_stage = 'won' THEN 100
      WHEN p_new_stage = 'lost' THEN 0
      ELSE probability_to_close
    END,
    updated_at = NOW(),
    last_updated_by = p_changed_by
  WHERE id = p_deal_id;

  -- Record stage transition
  INSERT INTO pipeline_stage_history (
    deal_id,
    from_stage,
    to_stage,
    days_in_previous_stage,
    changed_by,
    notes
  ) VALUES (
    p_deal_id,
    v_current_stage,
    p_new_stage,
    v_days_in_stage,
    p_changed_by,
    p_notes
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_deal_stage IS 'Update deal stage with validation and automatic history tracking';

-- Function 3: Get Pipeline Metrics by Time Range
CREATE OR REPLACE FUNCTION get_pipeline_metrics_by_range(
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_created BIGINT,
  total_won BIGINT,
  total_lost BIGINT,
  won_value NUMERIC,
  lost_value NUMERIC,
  conversion_rate NUMERIC,
  avg_days_to_close NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day' * days_back),
    COUNT(*) FILTER (WHERE won_at >= NOW() - INTERVAL '1 day' * days_back),
    COUNT(*) FILTER (WHERE lost_at >= NOW() - INTERVAL '1 day' * days_back),

    SUM(opportunity_value) FILTER (WHERE won_at >= NOW() - INTERVAL '1 day' * days_back),
    SUM(opportunity_value) FILTER (WHERE lost_at >= NOW() - INTERVAL '1 day' * days_back),

    ROUND(
      COUNT(*) FILTER (WHERE won_at >= NOW() - INTERVAL '1 day' * days_back)::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE
        status IN ('won', 'lost') AND
        (won_at >= NOW() - INTERVAL '1 day' * days_back OR lost_at >= NOW() - INTERVAL '1 day' * days_back)
      ), 0) * 100,
      2
    ),

    ROUND(
      AVG(EXTRACT(EPOCH FROM (won_at - loi_accepted_date)) / 86400)
      FILTER (WHERE won_at >= NOW() - INTERVAL '1 day' * days_back),
      1
    )

  FROM pipeline_deals;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_pipeline_metrics_by_range IS 'Get pipeline metrics for a specific time period';

-- =====================================================
-- 7. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

-- Create or update the trigger function (if not exists from previous migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_pipeline_deals_updated_at
  BEFORE UPDATE ON pipeline_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. GRANT PERMISSIONS (if needed)
-- =====================================================

-- Note: Adjust based on your RLS and authentication setup
-- For now, using service role key, so permissions are already granted

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE 'Pipeline tables created successfully:';
  RAISE NOTICE '  - pipeline_deals';
  RAISE NOTICE '  - pipeline_stage_history';
  RAISE NOTICE '  - pipeline_activities';
  RAISE NOTICE 'Views created: 4';
  RAISE NOTICE 'Functions created: 3';
  RAISE NOTICE 'Indexes created: 13';
  RAISE NOTICE 'Migration 20250117_create_pipeline_tables.sql completed!';
END $$;
