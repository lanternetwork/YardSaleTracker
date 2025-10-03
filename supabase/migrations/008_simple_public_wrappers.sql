-- Simple public wrappers that avoid parameter conflicts
-- This version uses simpler SQL without dynamic column detection

-- 1. Simple search function that works with basic columns
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
    COALESCE(s.zip_code, '') as zip_code,
    s.lat,
    s.lng,
    s.date_start,
    s.time_start,
    s.date_end,
    s.time_end,
    COALESCE(s.tags, '{}'::TEXT[]) as tags,
    COALESCE(s.status, 'published') as status,
    ROUND(ST_Distance(
      ST_GeogFromText('POINT(' || s.lng || ' ' || s.lat || ')'),
      ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')')
    )::NUMERIC) as distance_meters
  FROM lootaura_v2.sales s
  WHERE (s.status = 'published' OR s.status IS NULL)
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

-- 2. Simple public views
CREATE OR REPLACE VIEW public.sales_v2 AS
SELECT 
  s.id,
  s.owner_id,
  s.title,
  COALESCE(s.description, '') as description,
  COALESCE(s.address, '') as address,
  s.city,
  s.state,
  COALESCE(s.zip_code, '') as zip_code,
  s.lat,
  s.lng,
  s.date_start,
  s.time_start,
  s.date_end,
  s.time_end,
  COALESCE(s.tags, '{}'::TEXT[]) as tags,
  COALESCE(s.status, 'published') as status,
  COALESCE(s.privacy_mode, 'exact') as privacy_mode,
  COALESCE(s.is_featured, false) as is_featured,
  COALESCE(s.created_at, now()) as created_at,
  COALESCE(s.updated_at, now()) as updated_at
FROM lootaura_v2.sales s;

CREATE OR REPLACE VIEW public.items_v2 AS
SELECT 
  i.id,
  i.sale_id,
  i.name,
  COALESCE(i.description, '') as description,
  COALESCE(i.price, 0) as price,
  COALESCE(i.category, '') as category,
  COALESCE(i.condition, '') as condition,
  COALESCE(i.images, '{}'::TEXT[]) as images,
  COALESCE(i.is_sold, false) as is_sold,
  COALESCE(i.created_at, now()) as created_at,
  COALESCE(i.updated_at, now()) as updated_at
FROM lootaura_v2.items i;

CREATE OR REPLACE VIEW public.profiles_v2 AS
SELECT 
  p.user_id,
  COALESCE(p.email, '') as email,
  COALESCE(p.full_name, '') as full_name,
  COALESCE(p.avatar_url, '') as avatar_url,
  COALESCE(p.created_at, now()) as created_at,
  COALESCE(p.updated_at, now()) as updated_at
FROM lootaura_v2.profiles p;

CREATE OR REPLACE VIEW public.favorites_v2 AS
SELECT 
  f.user_id,
  f.sale_id,
  COALESCE(f.created_at, now()) as created_at
FROM lootaura_v2.favorites f;

CREATE OR REPLACE VIEW public.zipcodes_v2 AS
SELECT 
  z.zip,
  z.lat,
  z.lng,
  z.city,
  z.state
FROM lootaura_v2.zipcodes z;

-- 3. Simple test functions
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
