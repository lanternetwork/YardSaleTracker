-- Add PostGIS search function for distance-based sales filtering
-- This function provides efficient distance-based filtering with proper geographic calculations

CREATE OR REPLACE FUNCTION search_sales_by_distance(
  search_lat FLOAT,
  search_lng FLOAT,
  max_distance_km FLOAT DEFAULT 40.2336,
  date_filter TEXT DEFAULT NULL,
  category_filter TEXT[] DEFAULT NULL,
  text_filter TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 50,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  city TEXT,
  state TEXT,
  lat NUMERIC,
  lng NUMERIC,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  tags TEXT[],
  distance_m FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ys.id,
    ys.title,
    ys.city,
    ys.state,
    ys.lat,
    ys.lng,
    ys.start_at,
    ys.end_at,
    ys.tags,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(ys.lng, ys.lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
    ) AS distance_m
  FROM yard_sales ys
  WHERE 
    ys.status = 'active'
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(ys.lng, ys.lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      max_distance_km * 1000
    )
    AND (date_filter IS NULL OR 
         (date_filter = 'today' AND DATE(ys.start_at) = CURRENT_DATE) OR
         (date_filter = 'weekend' AND EXTRACT(DOW FROM ys.start_at) IN (0, 6)))
    AND (category_filter IS NULL OR ys.tags && category_filter)
    AND (text_filter IS NULL OR ys.title ILIKE '%' || text_filter || '%')
  ORDER BY 
    ST_Distance(
      ST_SetSRID(ST_MakePoint(ys.lng, ys.lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
    ) ASC,
    ys.start_at ASC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;
