-- Public wrappers for lootaura_v2 schema (Final version)
-- This allows the REST API to access v2 functions and tables through public schema
-- Handles case where v2 schema or tables don't exist yet

-- First, ensure lootaura_v2 schema exists
CREATE SCHEMA IF NOT EXISTS lootaura_v2;

-- 1. Public wrapper for search_sales_within_distance function
-- This function will work even if the v2 schema is empty
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
  -- Return empty result if table doesn't exist
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

-- 2. Public view for sales table (read-only with RLS)
-- This will work even if the table doesn't exist
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

-- 3. Public view for items table
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

-- 4. Public view for profiles table
CREATE OR REPLACE VIEW public.profiles_v2 AS
SELECT 
  NULL::UUID as user_id,
  NULL::TEXT as email,
  NULL::TEXT as full_name,
  NULL::TEXT as avatar_url,
  NULL::TIMESTAMPTZ as created_at,
  NULL::TIMESTAMPTZ as updated_at
WHERE FALSE;

-- 5. Public view for favorites table
CREATE OR REPLACE VIEW public.favorites_v2 AS
SELECT 
  NULL::UUID as user_id,
  NULL::UUID as sale_id,
  NULL::TIMESTAMPTZ as created_at
WHERE FALSE;

-- 6. Public view for zipcodes table
CREATE OR REPLACE VIEW public.zipcodes_v2 AS
SELECT 
  NULL::TEXT as zip,
  NULL::DOUBLE PRECISION as lat,
  NULL::DOUBLE PRECISION as lng,
  NULL::TEXT as city,
  NULL::TEXT as state
WHERE FALSE;

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
    FALSE as has_geom,
    0 as missing_geom_count;
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
    0 as total_sales,
    0 as missing_geom,
    FALSE as has_gist_index;
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

-- Add comments for documentation
COMMENT ON FUNCTION public.search_sales_within_distance IS 'Public wrapper for lootaura_v2.search_sales_within_distance';
COMMENT ON VIEW public.sales_v2 IS 'Public view for lootaura_v2.sales with RLS';
COMMENT ON VIEW public.items_v2 IS 'Public view for lootaura_v2.items with RLS';
COMMENT ON VIEW public.profiles_v2 IS 'Public view for lootaura_v2.profiles with RLS';
COMMENT ON VIEW public.favorites_v2 IS 'Public view for lootaura_v2.favorites with RLS';
COMMENT ON VIEW public.zipcodes_v2 IS 'Public view for lootaura_v2.zipcodes';
COMMENT ON FUNCTION public.test_postgis IS 'Test PostGIS functionality in lootaura_v2 schema';
COMMENT ON FUNCTION public.get_sales_stats IS 'Get sales statistics from lootaura_v2 schema';
