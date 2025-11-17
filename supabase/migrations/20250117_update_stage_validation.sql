-- =====================================================
-- Migration: Update Stage Validation to Allow Backward Movement
-- Created: 2025-01-17
-- Purpose: Allow flexible stage transitions (forward and backward)
-- =====================================================

-- Drop and recreate the update_deal_stage function with relaxed validation
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

  -- Relaxed validation: Only prevent moving from won/lost states
  IF v_current_status = 'won' OR v_current_status = 'lost' THEN
    RAISE EXCEPTION 'Cannot move deals that are already won or lost';
  END IF;

  -- Prevent moving to won from non-closing stages (maintain quality control)
  IF p_new_stage = 'won' AND v_current_stage != 'closing' THEN
    RAISE EXCEPTION 'Can only mark as won from closing stage';
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
    COALESCE(p_notes, 'Stage updated via drag and drop')
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_deal_stage IS 'Update deal stage with flexible validation allowing backward and forward transitions';

-- Migration complete
DO $$
BEGIN
  RAISE NOTICE 'Updated update_deal_stage function to allow flexible stage transitions';
  RAISE NOTICE 'Deals can now move backward and forward between stages';
  RAISE NOTICE 'Restrictions: Cannot move won/lost deals, can only mark won from closing stage';
END $$;
