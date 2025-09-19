-- Performance optimization indexes
-- Run this after the initial schema migration

-- Add GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_sales_tags_gin ON yard_sales USING GIN (tags);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_sales_status_created ON yard_sales (status, created_at DESC);

-- Add index for owner queries
CREATE INDEX IF NOT EXISTS idx_sales_owner ON yard_sales (owner_id) WHERE owner_id IS NOT NULL;

-- Add index for source filtering
CREATE INDEX IF NOT EXISTS idx_sales_source_created ON yard_sales (source, created_at DESC);

-- Add index for price range queries
CREATE INDEX IF NOT EXISTS idx_sales_price_range ON yard_sales (price_min, price_max) 
WHERE price_min IS NOT NULL AND price_max IS NOT NULL;

-- Add index for date range queries
CREATE INDEX IF NOT EXISTS idx_sales_date_range ON yard_sales (start_at, end_at) 
WHERE start_at IS NOT NULL;

-- Add index for city/state queries
CREATE INDEX IF NOT EXISTS idx_sales_location ON yard_sales (city, state) 
WHERE city IS NOT NULL AND state IS NOT NULL;

-- Add index for favorites queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites (user_id, created_at DESC);

-- Add index for sale items queries
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items (sale_id);

-- Add index for profiles queries
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles (created_at DESC);

-- Add full-text search column and index
ALTER TABLE yard_sales ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- Create function to update search_tsv
CREATE OR REPLACE FUNCTION update_sale_search_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' || 
    COALESCE(NEW.address, '') || ' ' || 
    COALESCE(NEW.city, '') || ' ' || 
    COALESCE(NEW.state, '') || ' ' || 
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_tsv
DROP TRIGGER IF EXISTS update_sale_search_tsv_trigger ON yard_sales;
CREATE TRIGGER update_sale_search_tsv_trigger
  BEFORE INSERT OR UPDATE ON yard_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_sale_search_tsv();

-- Update existing records
UPDATE yard_sales SET search_tsv = to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(description, '') || ' ' || 
  COALESCE(address, '') || ' ' || 
  COALESCE(city, '') || ' ' || 
  COALESCE(state, '') || ' ' || 
  COALESCE(array_to_string(tags, ' '), '')
);

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_sales_search_tsv ON yard_sales USING GIN (search_tsv);

-- Create function for full-text search
CREATE OR REPLACE FUNCTION search_sales(
  search_query text,
  max_distance_km float DEFAULT NULL,
  user_lat float DEFAULT NULL,
  user_lng float DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  price_min numeric DEFAULT NULL,
  price_max numeric DEFAULT NULL,
  tags_filter text[] DEFAULT NULL,
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  address text,
  city text,
  state text,
  zip text,
  lat double precision,
  lng double precision,
  start_at timestamptz,
  end_at timestamptz,
  tags text[],
  price_min numeric,
  price_max numeric,
  photos text[],
  contact text,
  status sale_status,
  source text,
  created_at timestamptz,
  updated_at timestamptz,
  distance_km float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ys.id,
    ys.title,
    ys.description,
    ys.address,
    ys.city,
    ys.state,
    ys.zip,
    ys.lat,
    ys.lng,
    ys.start_at,
    ys.end_at,
    ys.tags,
    ys.price_min,
    ys.price_max,
    ys.photos,
    ys.contact,
    ys.status,
    ys.source,
    ys.created_at,
    ys.updated_at,
    CASE 
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND ys.lat IS NOT NULL AND ys.lng IS NOT NULL
      THEN 6371 * acos(
        cos(radians(user_lat)) * cos(radians(ys.lat)) * 
        cos(radians(ys.lng) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(ys.lat))
      )
      ELSE NULL
    END as distance_km
  FROM yard_sales ys
  WHERE 
    ys.status = 'active'
    AND (search_query IS NULL OR search_query = '' OR ys.search_tsv @@ plainto_tsquery('english', search_query))
    AND (max_distance_km IS NULL OR user_lat IS NULL OR user_lng IS NULL OR ys.lat IS NULL OR ys.lng IS NULL OR 
         6371 * acos(
           cos(radians(user_lat)) * cos(radians(ys.lat)) * 
           cos(radians(ys.lng) - radians(user_lng)) + 
           sin(radians(user_lat)) * sin(radians(ys.lat))
         ) <= max_distance_km)
    AND (date_from IS NULL OR ys.start_at IS NULL OR ys.start_at >= date_from)
    AND (date_to IS NULL OR ys.end_at IS NULL OR ys.end_at <= date_to)
    AND (price_min IS NULL OR ys.price_min IS NULL OR ys.price_min >= price_min)
    AND (price_max IS NULL OR ys.price_max IS NULL OR ys.price_max <= price_max)
    AND (tags_filter IS NULL OR array_length(tags_filter, 1) IS NULL OR ys.tags && tags_filter)
  ORDER BY 
    CASE WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND ys.lat IS NOT NULL AND ys.lng IS NOT NULL
         THEN 6371 * acos(
           cos(radians(user_lat)) * cos(radians(ys.lat)) * 
           cos(radians(ys.lng) - radians(user_lng)) + 
           sin(radians(user_lat)) * sin(radians(ys.lat))
         )
         ELSE 0
    END,
    ys.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
