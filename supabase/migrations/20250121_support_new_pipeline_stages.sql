-- =====================================================
-- Migration: Support New Pipeline Stages (Acquisition & Escrow)
-- Created: 2025-01-21
-- Purpose: Update database to support new pipeline stages for both pipeline types
-- =====================================================

-- =====================================================
-- 1. ADD PIPELINE_TYPE COLUMN
-- =====================================================

ALTER TABLE pipeline_deals
ADD COLUMN IF NOT EXISTS pipeline_type TEXT DEFAULT 'acquisition';

-- Add constraint for pipeline_type
ALTER TABLE pipeline_deals
DROP CONSTRAINT IF EXISTS valid_pipeline_type;

ALTER TABLE pipeline_deals
ADD CONSTRAINT valid_pipeline_type CHECK (pipeline_type IN ('acquisition', 'escrow'));

COMMENT ON COLUMN pipeline_deals.pipeline_type IS 'Type of pipeline: acquisition (default) or escrow';

-- =====================================================
-- 2. UPDATE STAGE VALIDATION CONSTRAINT
-- =====================================================

-- Drop existing stage constraint
ALTER TABLE pipeline_deals
DROP CONSTRAINT IF EXISTS valid_stage;

-- Add new constraint with all stages from both pipelines
ALTER TABLE pipeline_deals
ADD CONSTRAINT valid_stage CHECK (stage IN (
  -- Acquisition Pipeline
  'loi_accepted',
  'emd',
  'psa',
  'inspection',
  'title_escrow',
  'closing',
  -- Escrow Pipeline
  'offer_accepted',
  'open_escrow',
  'due_diligence',
  'clearing_contingencies',
  'final_walkthrough',
  -- Common end states
  'won',
  'lost',
  -- Legacy stages (backward compatibility)
  'contract'
));

-- =====================================================
-- 3. UPDATE update_deal_stage FUNCTION
-- =====================================================

-- Drop and recreate the update_deal_stage function with new stage support
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
  v_pipeline_type TEXT;
  v_last_transition TIMESTAMPTZ;
  v_days_in_stage INTEGER;
  v_new_status TEXT;
  v_probability INTEGER;
BEGIN
  -- Get current stage, status, and pipeline type
  SELECT stage, status, pipeline_type
  INTO v_current_stage, v_current_status, v_pipeline_type
  FROM pipeline_deals
  WHERE id = p_deal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found: %', p_deal_id;
  END IF;

  -- Check if stage is actually changing
  IF v_current_stage = p_new_stage THEN
    RETURN FALSE; -- No change needed
  END IF;

  -- Only prevent moving from won/lost states
  IF v_current_status = 'won' OR v_current_status = 'lost' THEN
    RAISE EXCEPTION 'Cannot move deals that are already won or lost';
  END IF;

  -- Get last transition time
  SELECT transitioned_at INTO v_last_transition
  FROM pipeline_stage_history
  WHERE deal_id = p_deal_id
  ORDER BY transitioned_at DESC
  LIMIT 1;

  -- Calculate days in previous stage
  v_days_in_stage := EXTRACT(EPOCH FROM (NOW() - COALESCE(v_last_transition, NOW()))) / 86400;

  -- Determine new status
  v_new_status := CASE
    WHEN p_new_stage = 'won' THEN 'won'
    WHEN p_new_stage = 'lost' THEN 'lost'
    ELSE v_current_status
  END;

  -- Calculate probability based on pipeline type and stage
  v_probability := CASE
    -- Acquisition Pipeline
    WHEN v_pipeline_type = 'acquisition' AND p_new_stage = 'loi_accepted' THEN 25
    WHEN v_pipeline_type = 'acquisition' AND p_new_stage = 'emd' THEN 40
    WHEN v_pipeline_type = 'acquisition' AND p_new_stage = 'psa' THEN 55
    WHEN v_pipeline_type = 'acquisition' AND p_new_stage = 'inspection' THEN 70
    WHEN v_pipeline_type = 'acquisition' AND p_new_stage = 'title_escrow' THEN 85
    WHEN v_pipeline_type = 'acquisition' AND p_new_stage = 'closing' THEN 95
    -- Escrow Pipeline
    WHEN v_pipeline_type = 'escrow' AND p_new_stage = 'offer_accepted' THEN 30
    WHEN v_pipeline_type = 'escrow' AND p_new_stage = 'open_escrow' THEN 45
    WHEN v_pipeline_type = 'escrow' AND p_new_stage = 'due_diligence' THEN 60
    WHEN v_pipeline_type = 'escrow' AND p_new_stage = 'clearing_contingencies' THEN 75
    WHEN v_pipeline_type = 'escrow' AND p_new_stage = 'final_walkthrough' THEN 90
    WHEN v_pipeline_type = 'escrow' AND p_new_stage = 'closing' THEN 95
    -- Common stages
    WHEN p_new_stage = 'won' THEN 100
    WHEN p_new_stage = 'lost' THEN 0
    -- Legacy stages
    WHEN p_new_stage = 'due_diligence' THEN 65
    WHEN p_new_stage = 'contract' THEN 80
    ELSE 50
  END;

  -- Update deal
  UPDATE pipeline_deals
  SET
    stage = p_new_stage,
    status = v_new_status,
    won_at = CASE WHEN p_new_stage = 'won' THEN NOW() ELSE won_at END,
    lost_at = CASE WHEN p_new_stage = 'lost' THEN NOW() ELSE lost_at END,
    actual_closing_date = CASE WHEN p_new_stage = 'won' THEN CURRENT_DATE ELSE actual_closing_date END,
    probability_to_close = v_probability,
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
    COALESCE(p_notes, 'Stage updated')
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_deal_stage IS 'Update deal stage with support for Acquisition and Escrow pipelines';

-- =====================================================
-- 4. CREATE INDEX ON PIPELINE_TYPE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pipeline_deals_pipeline_type
ON pipeline_deals(pipeline_type);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Pipeline stages migration completed successfully:';
  RAISE NOTICE '  - Added pipeline_type column';
  RAISE NOTICE '  - Updated stage CHECK constraint with new stages';
  RAISE NOTICE '  - Updated update_deal_stage function to support both pipelines';
  RAISE NOTICE '  - Added index on pipeline_type';
  RAISE NOTICE 'Supported stages:';
  RAISE NOTICE '  Acquisition: loi_accepted, emd, psa, inspection, title_escrow, closing';
  RAISE NOTICE '  Escrow: offer_accepted, open_escrow, due_diligence, clearing_contingencies, final_walkthrough, closing';
END $$;
