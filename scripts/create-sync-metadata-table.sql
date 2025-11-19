-- Create sync_metadata table for tracking sync operations
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sync_metadata (
  id VARCHAR(50) PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  records_fetched INTEGER DEFAULT 0,
  records_synced INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  mode VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sync_metadata_timestamp ON sync_metadata(timestamp DESC);

-- Insert initial record
INSERT INTO sync_metadata (id, timestamp, records_fetched, records_synced, accuracy, mode)
VALUES ('last_sync', NOW(), 0, 0, 0, 'initial')
ON CONFLICT (id) DO NOTHING;

-- Create a view for sync statistics
CREATE OR REPLACE VIEW sync_statistics AS
SELECT
  DATE(timestamp) as sync_date,
  COUNT(*) as sync_count,
  SUM(records_fetched) as total_fetched,
  SUM(records_synced) as total_synced,
  AVG(accuracy) as avg_accuracy,
  MAX(timestamp) as last_sync_time
FROM sync_metadata
WHERE id = 'last_sync'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY sync_date DESC;