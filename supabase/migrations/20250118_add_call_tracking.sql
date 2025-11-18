-- Migration: Add RingCentral Call Tracking
-- Created: 2025-01-18
-- Description: Tables and views for tracking RingCentral call analytics

-- =====================================================
-- 1. Create agents table (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY,
  real_name TEXT NOT NULL,
  alias_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert agents data
INSERT INTO agents (id, real_name, alias_name, email, phone) VALUES
  (1, 'Ammar', 'Ammar', 'ammar@miana.com.co', '(406) 229-9301'),
  (2, 'Ayesha', 'Ada', 'ada@miana.com.co', '(406) 229-9302'),
  (3, 'Eman', 'Elif', 'elif@miana.com.co', '(406) 229-9303'),
  (4, 'Momina', 'Aylin', 'aylin@miana.com.co', '(406) 229-9304'),
  (5, 'Farhat', 'Farhat', 'farhat@miana.com.co', '(406) 229-9305'),
  (6, 'Maasomah', 'Lina', 'lina@miana.com.co', '(406) 229-9306'),
  (7, 'Faizan', 'Fazil', 'fazil@miana.com.co', '(406) 229-9307'),
  (8, 'Mahrukh', 'Mina', 'mina@miana.com.co', '(406) 229-9308'),
  (9, 'Awais', 'Ozan', 'ozan@miana.com.co', '(406) 229-9309'),
  (10, 'Tayyab', 'Burakh', 'burakh@miana.com.co', '(406) 229-9310'),
  (11, 'Abdullah', 'Noyaan', 'noyaan@miana.com.co', '(406) 229-9311'),
  (12, 'Amir', 'Emir', 'emir@miana.com.co', '(406) 229-9312'),
  (13, 'Sadia', 'Sara', 'sara@miana.com.co', '(406) 229-9313'),
  (14, 'Asif', 'Mehmet', 'mehmet@miana.com.co', '(406) 229-9314'),
  (15, 'Talha', 'Tabeeb', 'tabeeb@miana.com.co', '(406) 229-9315'),
  (16, 'Fatima', 'Eleena', 'eleena@miana.com.co', '(406) 229-9316'),
  (17, 'Rameen', 'Ayla', 'ayla@miana.com.co', '(406) 229-9317'),
  (18, 'Ahmed', 'Arda', 'arda@miana.com.co', '(406) 229-9318'),
  (19, 'Hannan', 'Hannan', 'hannan@miana.com.co', '(406) 229-9319'),
  (20, 'Mishaal', 'Anna', 'anna@miana.com.co', '(406) 229-9320'),
  (21, 'Laiba', 'Eda', 'eda@miana.com.co', '(406) 229-9321'),
  (22, 'Team A', 'Team A', 'vanguardhorizon.reit-a@miana.com.co', '(406) 229-9322'),
  (23, 'Team B', 'Team B', 'vanguardhorizon.reit-b@miana.com.co', '(406) 229-9323'),
  (24, 'Team C', 'Team C', 'vanguardhorizon.reit-c@miana.com.co', '(406) 229-9324'),
  (25, 'Mian', 'Mian', 'mian@miana.com.co', '(661) 605-0329'),
  (26, 'Ifaf', 'Ifaf Shahab', 'ifaf@miana.com.co', '(559) 421-2021'),
  (27, 'Shahab', 'Shahab Javed', 'shahabjaved99@gmail.com', '(559) 570-0778'),
  (28, 'Support', 'English Issue', 'abdullah31615@gmail.com', '(559) 206-7202')
ON CONFLICT (id) DO UPDATE SET
  real_name = EXCLUDED.real_name,
  alias_name = EXCLUDED.alias_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- =====================================================
-- 2. Create call_logs table
-- =====================================================

CREATE TABLE IF NOT EXISTS call_logs (
  -- Primary identifiers
  id TEXT PRIMARY KEY,  -- RingCentral call ID
  session_id TEXT NOT NULL,

  -- Agent association
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  extension_id TEXT,
  extension_number TEXT,

  -- Call details
  direction TEXT NOT NULL CHECK (direction IN ('Inbound', 'Outbound')),
  call_type TEXT NOT NULL DEFAULT 'Voice' CHECK (call_type IN ('Voice', 'Fax')),
  call_result TEXT NOT NULL,  -- Accepted, Missed, Voicemail, Rejected, etc.
  call_action TEXT,  -- Phone Call, VoIP Call, etc.

  -- Contact information
  from_number TEXT,
  to_number TEXT,
  from_name TEXT,
  to_name TEXT,
  from_location TEXT,
  to_location TEXT,

  -- Call metrics
  duration INTEGER NOT NULL DEFAULT 0,  -- seconds
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,  -- Calculated field

  -- Recording information
  recording_id TEXT,
  recording_uri TEXT,
  recording_type TEXT,
  recording_content_uri TEXT,

  -- Additional metadata
  transport TEXT CHECK (transport IN ('PSTN', 'VoIP')),
  reason TEXT,
  reason_description TEXT,

  -- Sync tracking
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_time TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_id ON call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_direction ON call_logs(direction);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_result ON call_logs(call_result);
CREATE INDEX IF NOT EXISTS idx_call_logs_from_number ON call_logs(from_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_to_number ON call_logs(to_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_session_id ON call_logs(session_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_started ON call_logs(agent_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_agent_direction ON call_logs(agent_id, direction);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_call_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Calculate ended_at if not provided
  IF NEW.ended_at IS NULL AND NEW.duration > 0 THEN
    NEW.ended_at = NEW.started_at + (NEW.duration || ' seconds')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_call_logs_updated_at
  BEFORE UPDATE ON call_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_call_logs_updated_at();

-- Also calculate ended_at on insert
CREATE TRIGGER trigger_calculate_call_logs_ended_at
  BEFORE INSERT ON call_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_call_logs_updated_at();

-- =====================================================
-- 2. Create agent_call_performance view
-- =====================================================

CREATE OR REPLACE VIEW agent_call_performance AS
SELECT
  a.id AS agent_id,
  a.alias_name AS agent_name,

  -- Call counts
  COUNT(cl.id) AS total_calls,
  COUNT(cl.id) FILTER (WHERE cl.direction = 'Inbound') AS inbound_calls,
  COUNT(cl.id) FILTER (WHERE cl.direction = 'Outbound') AS outbound_calls,
  COUNT(cl.id) FILTER (WHERE cl.call_result IN ('Accepted', 'Call connected')) AS answered_calls,
  COUNT(cl.id) FILTER (WHERE cl.call_result = 'Missed') AS missed_calls,
  COUNT(cl.id) FILTER (WHERE cl.call_result = 'Voicemail') AS voicemail_calls,

  -- Duration metrics
  COALESCE(SUM(cl.duration), 0) AS total_duration,
  COALESCE(ROUND(AVG(cl.duration)), 0) AS avg_duration,

  -- Rates (percentages)
  CASE
    WHEN COUNT(cl.id) > 0 THEN
      ROUND(
        (COUNT(cl.id) FILTER (WHERE cl.call_result IN ('Accepted', 'Call connected'))::DECIMAL / COUNT(cl.id)) * 100,
        2
      )
    ELSE 0
  END AS answer_rate,

  -- Timestamps
  MIN(cl.started_at) AS first_call,
  MAX(cl.started_at) AS last_call

FROM agents a
LEFT JOIN call_logs cl ON a.id = cl.agent_id
GROUP BY a.id, a.alias_name
ORDER BY total_calls DESC;

-- =====================================================
-- 3. Create daily_call_volume view
-- =====================================================

CREATE OR REPLACE VIEW daily_call_volume AS
SELECT
  DATE(started_at) AS date,

  -- Call counts
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE direction = 'Inbound') AS inbound_calls,
  COUNT(*) FILTER (WHERE direction = 'Outbound') AS outbound_calls,
  COUNT(*) FILTER (WHERE call_result IN ('Accepted', 'Call connected')) AS answered_calls,
  COUNT(*) FILTER (WHERE call_result = 'Missed') AS missed_calls,
  COUNT(*) FILTER (WHERE call_result = 'Voicemail') AS voicemail_calls,

  -- Duration metrics
  COALESCE(SUM(duration), 0) AS total_duration,
  COALESCE(ROUND(AVG(duration)), 0) AS avg_duration,

  -- Active agents
  COUNT(DISTINCT agent_id) FILTER (WHERE agent_id IS NOT NULL) AS active_agents

FROM call_logs
WHERE started_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- =====================================================
-- 4. Create agent_call_activity_30d view
-- =====================================================

CREATE OR REPLACE VIEW agent_call_activity_30d AS
SELECT
  a.id AS agent_id,
  a.alias_name AS agent_name,

  -- 30-day call counts
  COUNT(cl.id) AS calls_30d,
  COUNT(cl.id) FILTER (WHERE cl.direction = 'Inbound') AS inbound_calls_30d,
  COUNT(cl.id) FILTER (WHERE cl.direction = 'Outbound') AS outbound_calls_30d,
  COUNT(cl.id) FILTER (WHERE cl.call_result IN ('Accepted', 'Call connected')) AS answered_calls_30d,
  COUNT(cl.id) FILTER (WHERE cl.call_result = 'Missed') AS missed_calls_30d,

  -- Duration
  COALESCE(SUM(cl.duration), 0) AS total_duration_30d,
  COALESCE(ROUND(AVG(cl.duration)), 0) AS avg_duration_30d,

  -- Answer rate
  CASE
    WHEN COUNT(cl.id) > 0 THEN
      ROUND(
        (COUNT(cl.id) FILTER (WHERE cl.call_result IN ('Accepted', 'Call connected'))::DECIMAL / COUNT(cl.id)) * 100,
        2
      )
    ELSE 0
  END AS answer_rate_30d

FROM agents a
LEFT JOIN call_logs cl ON a.id = cl.agent_id
  AND cl.started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY a.id, a.alias_name
ORDER BY calls_30d DESC;

-- =====================================================
-- 5. Create function to get call performance by range
-- =====================================================

CREATE OR REPLACE FUNCTION get_agent_call_activity_by_range(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  agent_id INTEGER,
  agent_name TEXT,
  total_calls BIGINT,
  inbound_calls BIGINT,
  outbound_calls BIGINT,
  answered_calls BIGINT,
  missed_calls BIGINT,
  total_duration BIGINT,
  avg_duration NUMERIC,
  answer_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS agent_id,
    a.alias_name AS agent_name,

    COUNT(cl.id) AS total_calls,
    COUNT(cl.id) FILTER (WHERE cl.direction = 'Inbound') AS inbound_calls,
    COUNT(cl.id) FILTER (WHERE cl.direction = 'Outbound') AS outbound_calls,
    COUNT(cl.id) FILTER (WHERE cl.call_result IN ('Accepted', 'Call connected')) AS answered_calls,
    COUNT(cl.id) FILTER (WHERE cl.call_result = 'Missed') AS missed_calls,

    COALESCE(SUM(cl.duration), 0) AS total_duration,
    COALESCE(ROUND(AVG(cl.duration)), 0) AS avg_duration,

    CASE
      WHEN COUNT(cl.id) > 0 THEN
        ROUND(
          (COUNT(cl.id) FILTER (WHERE cl.call_result IN ('Accepted', 'Call connected'))::DECIMAL / COUNT(cl.id)) * 100,
          2
        )
      ELSE 0
    END AS answer_rate

  FROM agents a
  LEFT JOIN call_logs cl ON a.id = cl.agent_id
    AND cl.started_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY a.id, a.alias_name
  ORDER BY total_calls DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Create function to get daily call volume by range
-- =====================================================

CREATE OR REPLACE FUNCTION get_daily_call_volume_by_range(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  total_calls BIGINT,
  inbound_calls BIGINT,
  outbound_calls BIGINT,
  answered_calls BIGINT,
  missed_calls BIGINT,
  total_duration BIGINT,
  avg_duration NUMERIC,
  active_agents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(started_at) AS date,

    COUNT(*) AS total_calls,
    COUNT(*) FILTER (WHERE direction = 'Inbound') AS inbound_calls,
    COUNT(*) FILTER (WHERE direction = 'Outbound') AS outbound_calls,
    COUNT(*) FILTER (WHERE call_result IN ('Accepted', 'Call connected')) AS answered_calls,
    COUNT(*) FILTER (WHERE call_result = 'Missed') AS missed_calls,

    COALESCE(SUM(duration), 0) AS total_duration,
    COALESCE(ROUND(AVG(duration)), 0) AS avg_duration,

    COUNT(DISTINCT agent_id) FILTER (WHERE agent_id IS NOT NULL) AS active_agents

  FROM call_logs
  WHERE started_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY DATE(started_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Grant permissions
-- =====================================================

-- Grant access to service role (for API calls)
GRANT ALL ON call_logs TO service_role;
GRANT SELECT ON agent_call_performance TO service_role;
GRANT SELECT ON daily_call_volume TO service_role;
GRANT SELECT ON agent_call_activity_30d TO service_role;
GRANT EXECUTE ON FUNCTION get_agent_call_activity_by_range TO service_role;
GRANT EXECUTE ON FUNCTION get_daily_call_volume_by_range TO service_role;

-- Grant access to authenticated users (if needed)
GRANT SELECT ON agent_call_performance TO authenticated;
GRANT SELECT ON daily_call_volume TO authenticated;
GRANT SELECT ON agent_call_activity_30d TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE call_logs IS 'Stores call log data synced from RingCentral';
COMMENT ON VIEW agent_call_performance IS 'All-time call performance metrics by agent';
COMMENT ON VIEW daily_call_volume IS 'Daily call volume for the last 90 days';
COMMENT ON VIEW agent_call_activity_30d IS 'Agent call activity for the last 30 days';
COMMENT ON FUNCTION get_agent_call_activity_by_range IS 'Get agent call activity for a custom time range';
COMMENT ON FUNCTION get_daily_call_volume_by_range IS 'Get daily call volume for a custom time range';
