-- Migration: Add CRM Analytics Views and Functions
-- Date: 2025-01-15
-- Description: Creates materialized views and functions for agent performance analytics

-- ============================================================================
-- ANALYTICS VIEW: Agent Performance Summary
-- ============================================================================

CREATE OR REPLACE VIEW agent_performance_summary AS
SELECT
  agent_id,
  agent_name,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE delivered_at IS NOT NULL) as total_delivered,
  COUNT(*) FILTER (WHERE opened = true) as total_opened,
  COUNT(*) FILTER (WHERE clicked = true) as total_clicked,
  COUNT(*) FILTER (WHERE replied = true) as total_replied,
  SUM(open_count) as total_opens,
  SUM(click_count) as total_clicks,
  ROUND(
    (COUNT(*) FILTER (WHERE opened = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE delivered_at IS NOT NULL), 0)) * 100,
    2
  ) as open_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE clicked = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE opened = true), 0)) * 100,
    2
  ) as click_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE replied = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE delivered_at IS NOT NULL), 0)) * 100,
    2
  ) as reply_rate,
  MIN(sent_at) as first_email_sent,
  MAX(sent_at) as last_email_sent,
  MAX(replied_at) as last_reply_received
FROM loi_emails
GROUP BY agent_id, agent_name
ORDER BY total_sent DESC;

-- ============================================================================
-- ANALYTICS VIEW: Recent Agent Activity (Last 30 Days)
-- ============================================================================

CREATE OR REPLACE VIEW agent_activity_30d AS
SELECT
  agent_id,
  agent_name,
  COUNT(*) as emails_sent_30d,
  COUNT(*) FILTER (WHERE opened = true) as emails_opened_30d,
  COUNT(*) FILTER (WHERE replied = true) as emails_replied_30d,
  ROUND(
    (COUNT(*) FILTER (WHERE replied = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as reply_rate_30d
FROM loi_emails
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY agent_id, agent_name;

-- ============================================================================
-- ANALYTICS VIEW: Agent Property Performance
-- ============================================================================

CREATE OR REPLACE VIEW agent_property_analytics AS
SELECT
  l.agent_id,
  l.agent_name,
  l.property_address,
  l.offer_type,
  l.offer_price,
  l.sent_at,
  l.opened,
  l.opened_at,
  l.replied,
  l.replied_at,
  l.open_count,
  l.click_count,
  CASE
    WHEN l.replied_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (l.replied_at - l.sent_at)) / 3600 -- Hours to reply
    ELSE NULL
  END as hours_to_reply,
  r.from_email as realtor_email_response,
  r.received_at as reply_received_at
FROM loi_emails l
LEFT JOIN email_replies r ON l.tracking_id = r.loi_tracking_id
ORDER BY l.sent_at DESC;

-- ============================================================================
-- ANALYTICS VIEW: Offer Type Performance
-- ============================================================================

CREATE OR REPLACE VIEW offer_type_analytics AS
SELECT
  offer_type,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE opened = true) as total_opened,
  COUNT(*) FILTER (WHERE replied = true) as total_replied,
  ROUND(
    (COUNT(*) FILTER (WHERE opened = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as open_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE replied = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as reply_rate,
  ROUND(AVG(offer_price), 2) as avg_offer_price,
  ROUND(AVG(down_payment), 2) as avg_down_payment,
  ROUND(AVG(monthly_payment), 2) as avg_monthly_payment
FROM loi_emails
GROUP BY offer_type
ORDER BY total_sent DESC;

-- ============================================================================
-- ANALYTICS VIEW: Daily Email Volume
-- ============================================================================

CREATE OR REPLACE VIEW daily_email_volume AS
SELECT
  DATE(sent_at) as date,
  COUNT(*) as emails_sent,
  COUNT(*) FILTER (WHERE opened = true) as emails_opened,
  COUNT(*) FILTER (WHERE replied = true) as emails_replied,
  COUNT(DISTINCT agent_id) as active_agents
FROM loi_emails
WHERE sent_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;

-- ============================================================================
-- FUNCTION: Get Agent Details with Stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_agent_details(p_agent_id INTEGER)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'agent_id', aps.agent_id,
    'agent_name', aps.agent_name,
    'agent_email', le.agent_email,
    'total_sent', aps.total_sent,
    'total_delivered', aps.total_delivered,
    'total_opened', aps.total_opened,
    'total_clicked', aps.total_clicked,
    'total_replied', aps.total_replied,
    'open_rate', aps.open_rate,
    'click_rate', aps.click_rate,
    'reply_rate', aps.reply_rate,
    'first_email_sent', aps.first_email_sent,
    'last_email_sent', aps.last_email_sent,
    'last_reply_received', aps.last_reply_received,
    'avg_hours_to_reply', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (replied_at - sent_at)) / 3600), 2)
      FROM loi_emails
      WHERE agent_id = p_agent_id AND replied_at IS NOT NULL
    )
  )
  INTO result
  FROM agent_performance_summary aps
  LEFT JOIN loi_emails le ON aps.agent_id = le.agent_id
  WHERE aps.agent_id = p_agent_id
  GROUP BY aps.agent_id, aps.agent_name, le.agent_email, aps.total_sent,
           aps.total_delivered, aps.total_opened, aps.total_clicked,
           aps.total_replied, aps.open_rate, aps.click_rate, aps.reply_rate,
           aps.first_email_sent, aps.last_email_sent, aps.last_reply_received
  LIMIT 1;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Top Performing Agents
-- ============================================================================

CREATE OR REPLACE FUNCTION get_top_agents(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  agent_id INTEGER,
  agent_name TEXT,
  total_sent BIGINT,
  reply_rate NUMERIC,
  open_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aps.agent_id,
    aps.agent_name,
    aps.total_sent,
    aps.reply_rate,
    aps.open_rate
  FROM agent_performance_summary aps
  ORDER BY aps.reply_rate DESC NULLS LAST, aps.total_sent DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Index for agent_id lookups
CREATE INDEX IF NOT EXISTS idx_loi_emails_agent_id_sent_at
ON loi_emails(agent_id, sent_at DESC);

-- Index for offer type analytics
CREATE INDEX IF NOT EXISTS idx_loi_emails_offer_type
ON loi_emails(offer_type);

-- Note: Date-based index removed due to IMMUTABLE function requirement
-- Daily queries will still be fast with the sent_at column index

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON VIEW agent_performance_summary IS
'Comprehensive agent performance metrics across all time';

COMMENT ON VIEW agent_activity_30d IS
'Agent activity and performance metrics for the last 30 days';

COMMENT ON VIEW agent_property_analytics IS
'Detailed property-level analytics for each agent';

COMMENT ON VIEW offer_type_analytics IS
'Performance comparison across different offer types';

COMMENT ON VIEW daily_email_volume IS
'Daily email volume and engagement metrics for the last 90 days';

COMMENT ON FUNCTION get_agent_details IS
'Returns comprehensive analytics for a specific agent by ID';

COMMENT ON FUNCTION get_top_agents IS
'Returns top performing agents based on reply rate and volume';
