-- ============================================
-- Supabase Setup for Seller Finance Calculator
-- ============================================

-- 1. Create the api_cache table
CREATE TABLE IF NOT EXISTS api_cache (
  id SERIAL PRIMARY KEY,
  address_hash TEXT UNIQUE NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index on address_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_cache_address_hash ON api_cache(address_hash);

-- 3. Create index on created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_api_cache_created_at ON api_cache(created_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- 5. Create policy to allow all operations (adjust based on your auth setup)
-- For development/testing: Allow anonymous access
CREATE POLICY "Allow all operations on api_cache"
ON api_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Grant permissions
GRANT ALL ON api_cache TO anon;
GRANT ALL ON api_cache TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE api_cache_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE api_cache_id_seq TO authenticated;

-- ============================================
-- Optional: Add comments for documentation
-- ============================================
COMMENT ON TABLE api_cache IS 'Cache for property API responses to reduce external API calls';
COMMENT ON COLUMN api_cache.address_hash IS 'SHA256 hash of the property address (lowercase, trimmed)';
COMMENT ON COLUMN api_cache.payload_json IS 'Complete property data from multiple APIs (Zillow, RentCast, Rentometer)';
COMMENT ON COLUMN api_cache.created_at IS 'Timestamp when the cache entry was created';
