-- Create ZIP codes table for lat/lng lookups
-- This table provides public read access to ZIP code coordinates

-- Create the zipcodes table
CREATE TABLE IF NOT EXISTS lootaura_v2.zipcodes (
  zip TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS zipcodes_state_idx ON lootaura_v2.zipcodes(state);
CREATE INDEX IF NOT EXISTS zipcodes_city_idx ON lootaura_v2.zipcodes(city);
CREATE INDEX IF NOT EXISTS zipcodes_lat_lng_idx ON lootaura_v2.zipcodes(lat, lng);

-- Enable RLS
ALTER TABLE lootaura_v2.zipcodes ENABLE ROW LEVEL SECURITY;

-- Create read policy for all users (anon and auth)
DROP POLICY IF EXISTS "zipcodes read" ON lootaura_v2.zipcodes;
CREATE POLICY "zipcodes read"
  ON lootaura_v2.zipcodes
  FOR SELECT
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON lootaura_v2.zipcodes TO anon;
GRANT SELECT ON lootaura_v2.zipcodes TO authenticated;
