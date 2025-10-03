-- Public wrappers for lootaura_v2 schema
-- This allows the REST API to access v2 functions and tables through public schema

-- 1. Public wrapper for search_sales_within_distance function
CREATE OR REPLACE FUNCTION public.search_sales_within_distance(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  distance_meters INTEGER,
  search_city TEXT DEFAULT NULL,
  search_categories TEXT[] DEFAULT NULL,
  date_start_filter DATE DEFAULT NULL,
  date_end_filter DATE DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  date_start DATE,
  time_start TIME,
  date_end DATE,
  time_end TIME,
  tags TEXT[],
  status TEXT,
  distance_meters DOUBLE PRECISION
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = lootaura_v2, public
AS $$
  SELECT 
    s.id,
    s.title,
    s.city,
    s.state,
    s.zip_code,
    s.lat,
    s.lng,
    s.date_start,
    s.time_start,
    s.date_end,
    s.time_end,
    COALESCE(s.tags, '{}'::TEXT[]) as tags,
    s.status,
    ROUND(ST_Distance(
      ST_GeogFromText('POINT(' || s.lng || ' ' || s.lat || ')'),
      ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')')
    )::NUMERIC) as distance_meters
  FROM lootaura_v2.sales s
  WHERE s.status = 'published'
    AND ST_DWithin(
      ST_GeogFromText('POINT(' || s.lng || ' ' || s.lat || ')'),
      ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')'),
      distance_meters
    )
    AND (search_city IS NULL OR s.city ILIKE '%' || search_city || '%')
    AND (search_categories IS NULL OR COALESCE(s.tags, '{}'::TEXT[]) && search_categories)
    AND (date_start_filter IS NULL OR s.date_start >= date_start_filter)
    AND (date_end_filter IS NULL OR s.date_start <= date_end_filter)
  ORDER BY distance_meters ASC, s.date_start ASC, s.id ASC
  LIMIT limit_count;
$$;

-- 2. Public view for sales table (read-only with RLS)
CREATE OR REPLACE VIEW public.sales_v2 AS
SELECT 
  id,
  owner_id,
  title,
  COALESCE(description, '') as description,
  COALESCE(address, '') as address,
  city,
  state,
  zip_code,
  lat,
  lng,
  date_start,
  time_start,
  date_end,
  time_end,
  COALESCE(tags, '{}'::TEXT[]) as tags,
  status,
  COALESCE(privacy_mode, 'exact') as privacy_mode,
  COALESCE(is_featured, false) as is_featured,
  COALESCE(created_at, now()) as created_at,
  COALESCE(updated_at, now()) as updated_at
FROM lootaura_v2.sales;

-- Enable RLS on the view
ALTER VIEW public.sales_v2 SET (security_invoker = true);

-- 3. Public view for items table
CREATE OR REPLACE VIEW public.items_v2 AS
SELECT 
  id,
  sale_id,
  name,
  COALESCE(description, '') as description,
  COALESCE(price, 0) as price,
  COALESCE(category, '') as category,
  COALESCE(condition, '') as condition,
  COALESCE(images, '{}'::TEXT[]) as images,
  COALESCE(is_sold, false) as is_sold,
  COALESCE(created_at, now()) as created_at,
  COALESCE(updated_at, now()) as updated_at
FROM lootaura_v2.items;

-- Enable RLS on the view
ALTER VIEW public.items_v2 SET (security_invoker = true);

-- 4. Public view for profiles table
CREATE OR REPLACE VIEW public.profiles_v2 AS
SELECT 
  user_id,
  COALESCE(email, '') as email,
  COALESCE(full_name, '') as full_name,
  COALESCE(avatar_url, '') as avatar_url,
  COALESCE(created_at, now()) as created_at,
  COALESCE(updated_at, now()) as updated_at
FROM lootaura_v2.profiles;

-- Enable RLS on the view
ALTER VIEW public.profiles_v2 SET (security_invoker = true);

-- 5. Public view for favorites table
CREATE OR REPLACE VIEW public.favorites_v2 AS
SELECT 
  id,
  user_id,
  sale_id,
  COALESCE(created_at, now()) as created_at
FROM lootaura_v2.favorites;

-- Enable RLS on the view
ALTER VIEW public.favorites_v2 SET (security_invoker = true);

-- 6. Public view for zipcodes table
CREATE OR REPLACE VIEW public.zipcodes_v2 AS
SELECT 
  zip,
  lat,
  lng,
  city,
  state
FROM lootaura_v2.zipcodes;

-- 7. Public function to test PostGIS functionality
CREATE OR REPLACE FUNCTION public.test_postgis()
RETURNS TABLE(
  message TEXT,
  has_geom BOOLEAN,
  missing_geom_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = lootaura_v2, public
AS $$
  SELECT 
    'PostGIS functionality confirmed' as message,
    EXISTS(SELECT 1 FROM lootaura_v2.sales WHERE geom IS NOT NULL LIMIT 1) as has_geom,
    (SELECT COUNT(*) FROM lootaura_v2.sales WHERE geom IS NULL) as missing_geom_count;
$$;

-- 8. Public function to get sales count with missing geom
CREATE OR REPLACE FUNCTION public.get_sales_stats()
RETURNS TABLE(
  total_sales BIGINT,
  missing_geom BIGINT,
  has_gist_index BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = lootaura_v2, public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM lootaura_v2.sales) as total_sales,
    (SELECT COUNT(*) FROM lootaura_v2.sales WHERE geom IS NULL) as missing_geom,
    EXISTS(
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'lootaura_v2' 
        AND tablename = 'sales' 
        AND indexname LIKE '%gist%'
    ) as has_gist_index;
$$;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.sales_v2 TO anon, authenticated;
GRANT SELECT ON public.items_v2 TO anon, authenticated;
GRANT SELECT ON public.profiles_v2 TO anon, authenticated;
GRANT SELECT ON public.favorites_v2 TO anon, authenticated;
GRANT SELECT ON public.zipcodes_v2 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_sales_within_distance TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.test_postgis TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_stats TO anon, authenticated;

-- 10. Create RLS policies for the views (delegate to v2 policies)
-- Note: These will inherit the RLS policies from the underlying v2 tables

-- Add comments for documentation
COMMENT ON FUNCTION public.search_sales_within_distance IS 'Public wrapper for lootaura_v2.search_sales_within_distance';
COMMENT ON VIEW public.sales_v2 IS 'Public view for lootaura_v2.sales with RLS';
COMMENT ON VIEW public.items_v2 IS 'Public view for lootaura_v2.items with RLS';
COMMENT ON VIEW public.profiles_v2 IS 'Public view for lootaura_v2.profiles with RLS';
COMMENT ON VIEW public.favorites_v2 IS 'Public view for lootaura_v2.favorites with RLS';
COMMENT ON VIEW public.zipcodes_v2 IS 'Public view for lootaura_v2.zipcodes';
COMMENT ON FUNCTION public.test_postgis IS 'Test PostGIS functionality in lootaura_v2 schema';
COMMENT ON FUNCTION public.get_sales_stats IS 'Get sales statistics from lootaura_v2 schema';
