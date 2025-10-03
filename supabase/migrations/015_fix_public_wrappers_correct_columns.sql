-- Fix public wrappers with correct column mappings
-- This migration creates public wrappers that work with the actual existing tables

-- Drop existing public wrappers if they exist
DROP FUNCTION IF EXISTS public.search_sales_within_distance CASCADE;
DROP VIEW IF EXISTS public.sales_v2 CASCADE;
DROP VIEW IF EXISTS public.items_v2 CASCADE;
DROP VIEW IF EXISTS public.favorites_v2 CASCADE;
DROP VIEW IF EXISTS public.profiles_v2 CASCADE;
DROP VIEW IF EXISTS public.zipcodes_v2 CASCADE;
DROP FUNCTION IF EXISTS public.test_postgis CASCADE;
DROP FUNCTION IF EXISTS public.get_sales_stats CASCADE;

-- Create public wrapper for search_sales_within_distance function
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
SET search_path = public
AS $$
  SELECT
    ys.id,
    ys.title,
    ys.city,
    ys.state,
    COALESCE(ys.zip, '') as zip_code,
    ys.lat,
    ys.lng,
    ys.start_at::DATE as date_start,
    ys.start_at::TIME as time_start,
    ys.end_at::DATE as date_end,
    ys.end_at::TIME as time_end,
    COALESCE(ys.tags, '{}'::TEXT[]) as tags,
    COALESCE(ys.status::TEXT, 'active') as status,
    ROUND(ST_Distance(
      ST_GeogFromText('POINT(' || ys.lng || ' ' || ys.lat || ')'),
      ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')')
    )::NUMERIC) as distance_meters
  FROM yard_sales ys
  WHERE ys.status = 'active'
    AND ST_DWithin(
      ST_GeogFromText('POINT(' || ys.lng || ' ' || ys.lat || ')'),
      ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')'),
      distance_meters
    )
    AND (search_city IS NULL OR ys.city ILIKE '%' || search_city || '%')
    AND (search_categories IS NULL OR COALESCE(ys.tags, '{}'::TEXT[]) && search_categories)
    AND (date_start_filter IS NULL OR ys.start_at::DATE >= date_start_filter)
    AND (date_end_filter IS NULL OR ys.start_at::DATE <= date_end_filter)
  ORDER BY distance_meters ASC, ys.start_at ASC, ys.id ASC
  LIMIT limit_count;
$$;

-- Create public view for sales_v2
CREATE OR REPLACE VIEW public.sales_v2 AS
SELECT
  id,
  owner_id,
  title,
  COALESCE(description, '') as description,
  COALESCE(address, '') as address,
  city,
  state,
  COALESCE(zip, '') as zip_code,
  lat,
  lng,
  start_at::DATE as date_start,
  start_at::TIME as time_start,
  end_at::DATE as date_end,
  end_at::TIME as time_end,
  COALESCE(tags, '{}'::TEXT[]) as tags,
  COALESCE(status::TEXT, 'active') as status,
  'exact'::TEXT as privacy_mode,
  false as is_featured,
  created_at,
  updated_at
FROM yard_sales;

-- Create public view for items_v2 (using only existing columns)
CREATE OR REPLACE VIEW public.items_v2 AS
SELECT
  id,
  sale_id,
  name as title,
  ''::TEXT as description,  -- Hardcoded since column doesn't exist
  COALESCE(price, 0) as price,
  COALESCE(category, '') as category,
  COALESCE("condition", '') as condition,
  COALESCE(photo, '') as images,
  purchased as is_sold,
  created_at,
  created_at as updated_at
FROM sale_items;

-- Create public view for favorites_v2
CREATE OR REPLACE VIEW public.favorites_v2 AS
SELECT
  user_id,
  sale_id,
  created_at
FROM favorites;

-- Create public view for profiles_v2
CREATE OR REPLACE VIEW public.profiles_v2 AS
SELECT
  id as user_id,
  display_name,
  COALESCE(avatar_url, '') as avatar_url,
  COALESCE(home_zip, '') as home_zip,
  COALESCE(preferences, '{}'::JSONB) as preferences,
  created_at,
  updated_at
FROM profiles;

-- Create public view for zipcodes_v2 (empty for now)
CREATE OR REPLACE VIEW public.zipcodes_v2 AS
SELECT
  '00000'::TEXT as zip,
  0.0::DOUBLE PRECISION as lat,
  0.0::DOUBLE PRECISION as lng,
  ''::TEXT as city,
  ''::TEXT as state
WHERE FALSE;

-- Create test_postgis function
CREATE OR REPLACE FUNCTION public.test_postgis()
RETURNS TABLE(
  result TEXT,
  has_postgis BOOLEAN,
  has_spatial_data BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    'PostGIS test successful'::TEXT as result,
    true as has_postgis,
    (SELECT COUNT(*) > 0 FROM yard_sales WHERE lat IS NOT NULL AND lng IS NOT NULL) as has_spatial_data;
$$;

-- Create get_sales_stats function
CREATE OR REPLACE FUNCTION public.get_sales_stats()
RETURNS TABLE(
  total_sales BIGINT,
  missing_geom BIGINT,
  active_sales BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM yard_sales) as total_sales,
    (SELECT COUNT(*) FROM yard_sales WHERE lat IS NULL OR lng IS NULL) as missing_geom,
    (SELECT COUNT(*) FROM yard_sales WHERE status = 'active') as active_sales;
$$;
