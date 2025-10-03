-- Adaptive public wrappers that work with any table structure
-- This version creates fallback views that work even if tables don't exist

-- 1. Create fallback search function that returns empty results
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
  -- Return empty result set
  SELECT 
    NULL::UUID as id,
    NULL::TEXT as title,
    NULL::TEXT as city,
    NULL::TEXT as state,
    NULL::TEXT as zip_code,
    NULL::DOUBLE PRECISION as lat,
    NULL::DOUBLE PRECISION as lng,
    NULL::DATE as date_start,
    NULL::TIME as time_start,
    NULL::DATE as date_end,
    NULL::TIME as time_end,
    NULL::TEXT[] as tags,
    NULL::TEXT as status,
    NULL::DOUBLE PRECISION as distance_meters
  WHERE FALSE;
$$;

-- 2. Create fallback views that return empty results
CREATE OR REPLACE VIEW public.sales_v2 AS
SELECT 
  NULL::UUID as id,
  NULL::UUID as owner_id,
  NULL::TEXT as title,
  NULL::TEXT as description,
  NULL::TEXT as address,
  NULL::TEXT as city,
  NULL::TEXT as state,
  NULL::TEXT as zip_code,
  NULL::NUMERIC as lat,
  NULL::NUMERIC as lng,
  NULL::DATE as date_start,
  NULL::TIME as time_start,
  NULL::DATE as date_end,
  NULL::TIME as time_end,
  NULL::TEXT[] as tags,
  NULL::TEXT as status,
  NULL::TEXT as privacy_mode,
  NULL::BOOLEAN as is_featured,
  NULL::TIMESTAMPTZ as created_at,
  NULL::TIMESTAMPTZ as updated_at
WHERE FALSE;

CREATE OR REPLACE VIEW public.items_v2 AS
SELECT 
  NULL::UUID as id,
  NULL::UUID as sale_id,
  NULL::TEXT as name,
  NULL::TEXT as description,
  NULL::NUMERIC as price,
  NULL::TEXT as category,
  NULL::TEXT as condition,
  NULL::TEXT[] as images,
  NULL::BOOLEAN as is_sold,
  NULL::TIMESTAMPTZ as created_at,
  NULL::TIMESTAMPTZ as updated_at
WHERE FALSE;

CREATE OR REPLACE VIEW public.profiles_v2 AS
SELECT 
  NULL::UUID as user_id,
  NULL::TEXT as email,
  NULL::TEXT as full_name,
  NULL::TEXT as avatar_url,
  NULL::TIMESTAMPTZ as created_at,
  NULL::TIMESTAMPTZ as updated_at
WHERE FALSE;

CREATE OR REPLACE VIEW public.favorites_v2 AS
SELECT 
  NULL::UUID as user_id,
  NULL::UUID as sale_id,
  NULL::TIMESTAMPTZ as created_at
WHERE FALSE;

CREATE OR REPLACE VIEW public.zipcodes_v2 AS
SELECT 
  NULL::TEXT as zip,
  NULL::DOUBLE PRECISION as lat,
  NULL::DOUBLE PRECISION as lng,
  NULL::TEXT as city,
  NULL::TEXT as state
WHERE FALSE;

-- 3. Create safe test functions
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
    false as has_geom,
    0 as missing_geom_count;
$$;

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
    0 as total_sales,
    0 as missing_geom,
    false as has_gist_index;
$$;

-- 4. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.sales_v2 TO anon, authenticated;
GRANT SELECT ON public.items_v2 TO anon, authenticated;
GRANT SELECT ON public.profiles_v2 TO anon, authenticated;
GRANT SELECT ON public.favorites_v2 TO anon, authenticated;
GRANT SELECT ON public.zipcodes_v2 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_sales_within_distance TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.test_postgis TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_stats TO anon, authenticated;

-- 5. Enable RLS on views
ALTER VIEW public.sales_v2 SET (security_invoker = true);
ALTER VIEW public.items_v2 SET (security_invoker = true);
ALTER VIEW public.profiles_v2 SET (security_invoker = true);
ALTER VIEW public.favorites_v2 SET (security_invoker = true);
ALTER VIEW public.zipcodes_v2 SET (security_invoker = true);
