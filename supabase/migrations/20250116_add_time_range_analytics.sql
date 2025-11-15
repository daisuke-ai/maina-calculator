-- Migration: Add Time-Range Based Analytics
-- Date: 2025-01-16
-- Description: Adds functions for week, month, quarter, and year analytics

-- ============================================================================
-- FUNCTION: Get Agent Activity by Time Range
-- ============================================================================

CREATE OR REPLACE FUNCTION get_agent_activity_by_range(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  agent_id INTEGER,
  agent_name TEXT,
  emails_sent BIGINT,
  emails_opened BIGINT,
  emails_replied BIGINT,
  open_rate NUMERIC,
  reply_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.agent_id,
    l.agent_name,
    COUNT(*) as emails_sent,
    COUNT(*) FILTER (WHERE l.opened = true) as emails_opened,
    COUNT(*) FILTER (WHERE l.replied = true) as emails_replied,
    ROUND(
      (COUNT(*) FILTER (WHERE l.opened = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as open_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE l.replied = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as reply_rate
  FROM loi_emails l
  WHERE l.sent_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY l.agent_id, l.agent_name
  ORDER BY emails_sent DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Offer Type Analytics by Time Range
-- ============================================================================

CREATE OR REPLACE FUNCTION get_offer_type_analytics_by_range(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  offer_type TEXT,
  total_sent BIGINT,
  total_opened BIGINT,
  total_replied BIGINT,
  open_rate NUMERIC,
  reply_rate NUMERIC,
  avg_offer_price NUMERIC,
  avg_down_payment NUMERIC,
  avg_monthly_payment NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.offer_type,
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE l.opened = true) as total_opened,
    COUNT(*) FILTER (WHERE l.replied = true) as total_replied,
    ROUND(
      (COUNT(*) FILTER (WHERE l.opened = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as open_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE l.replied = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as reply_rate,
    ROUND(AVG(l.offer_price), 2) as avg_offer_price,
    ROUND(AVG(l.down_payment), 2) as avg_down_payment,
    ROUND(AVG(l.monthly_payment), 2) as avg_monthly_payment
  FROM loi_emails l
  WHERE l.sent_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY l.offer_type
  ORDER BY total_sent DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Daily Email Volume by Time Range
-- ============================================================================

CREATE OR REPLACE FUNCTION get_daily_email_volume_by_range(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  emails_sent BIGINT,
  emails_opened BIGINT,
  emails_replied BIGINT,
  active_agents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(l.sent_at) as date,
    COUNT(*) as emails_sent,
    COUNT(*) FILTER (WHERE l.opened = true) as emails_opened,
    COUNT(*) FILTER (WHERE l.replied = true) as emails_replied,
    COUNT(DISTINCT l.agent_id) as active_agents
  FROM loi_emails l
  WHERE l.sent_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(l.sent_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Top Agents by Time Range
-- ============================================================================

CREATE OR REPLACE FUNCTION get_top_agents_by_range(
  limit_count INTEGER DEFAULT 10,
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  agent_id INTEGER,
  agent_name TEXT,
  total_sent BIGINT,
  total_opened BIGINT,
  total_replied BIGINT,
  reply_rate NUMERIC,
  open_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.agent_id,
    l.agent_name,
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE l.opened = true) as total_opened,
    COUNT(*) FILTER (WHERE l.replied = true) as total_replied,
    ROUND(
      (COUNT(*) FILTER (WHERE l.replied = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as reply_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE l.opened = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as open_rate
  FROM loi_emails l
  WHERE l.sent_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY l.agent_id, l.agent_name
  ORDER BY reply_rate DESC NULLS LAST, total_sent DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Agent Details by Time Range
-- ============================================================================

CREATE OR REPLACE FUNCTION get_agent_details_by_range(
  p_agent_id INTEGER,
  days_back INTEGER DEFAULT 7
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'agent_id', l.agent_id,
    'agent_name', MAX(l.agent_name),
    'agent_email', MAX(l.agent_email),
    'total_sent', COUNT(*),
    'total_delivered', COUNT(*) FILTER (WHERE l.delivered_at IS NOT NULL),
    'total_opened', COUNT(*) FILTER (WHERE l.opened = true),
    'total_clicked', COUNT(*) FILTER (WHERE l.clicked = true),
    'total_replied', COUNT(*) FILTER (WHERE l.replied = true),
    'open_rate', ROUND(
      (COUNT(*) FILTER (WHERE l.opened = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE l.delivered_at IS NOT NULL), 0)) * 100,
      2
    ),
    'click_rate', ROUND(
      (COUNT(*) FILTER (WHERE l.clicked = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE l.opened = true), 0)) * 100,
      2
    ),
    'reply_rate', ROUND(
      (COUNT(*) FILTER (WHERE l.replied = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE l.delivered_at IS NOT NULL), 0)) * 100,
      2
    ),
    'first_email_sent', MIN(l.sent_at),
    'last_email_sent', MAX(l.sent_at),
    'last_reply_received', MAX(l.replied_at),
    'avg_hours_to_reply', ROUND(AVG(EXTRACT(EPOCH FROM (l.replied_at - l.sent_at)) / 3600), 2)
  )
  INTO result
  FROM loi_emails l
  WHERE l.agent_id = p_agent_id
    AND l.sent_at >= NOW() - (days_back || ' days')::INTERVAL;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_agent_activity_by_range IS
'Returns agent activity metrics for a specified time range (in days)';

COMMENT ON FUNCTION get_offer_type_analytics_by_range IS
'Returns offer type performance for a specified time range (in days)';

COMMENT ON FUNCTION get_daily_email_volume_by_range IS
'Returns daily email volume for a specified time range (in days)';

COMMENT ON FUNCTION get_top_agents_by_range IS
'Returns top performing agents for a specified time range (in days)';

COMMENT ON FUNCTION get_agent_details_by_range IS
'Returns comprehensive agent details for a specified time range (in days)';
