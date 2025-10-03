-- Safe public wrappers that handle missing columns gracefully
-- This version works even if the v2 schema has different column names

-- 1. Create a safe search function that doesn't assume column names
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = lootaura_v2, public
AS $$
DECLARE
  has_status_column BOOLEAN;
  has_tags_column BOOLEAN;
  has_zip_code_column BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'lootaura_v2' 
    AND table_name = 'sales' 
    AND column_name = 'status'
  ) INTO has_status_column;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'lootaura_v2' 
    AND table_name = 'sales' 
    AND column_name = 'tags'
  ) INTO has_tags_column;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'lootaura_v2' 
    AND table_name = 'sales' 
    AND column_name = 'zip_code'
  ) INTO has_zip_code_column;

  -- Return empty result if table doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'lootaura_v2' AND table_name = 'sales') THEN
    RETURN;
  END IF;

  -- Build dynamic query based on available columns
  RETURN QUERY EXECUTE format('
    SELECT 
      s.id,
      s.title,
      s.city,
      s.state,
      %s as zip_code,
      s.lat,
      s.lng,
      s.date_start,
      s.time_start,
      s.date_end,
      s.time_end,
      %s as tags,
      %s as status,
      ROUND(ST_Distance(
        ST_GeogFromText(''POINT('' || s.lng || '' '' || s.lat || '')''),
        ST_GeogFromText(''POINT('' || %L || '' '' || %L || '')'')
      )::NUMERIC) as distance_meters
    FROM lootaura_v2.sales s
    WHERE %s
      AND ST_DWithin(
        ST_GeogFromText(''POINT('' || s.lng || '' '' || s.lat || '')''),
        ST_GeogFromText(''POINT('' || %L || '' '' || %L || '')''),
        %L
      )
      AND (%L IS NULL OR s.city ILIKE ''%%'' || %L || ''%%'')
      AND (%L IS NULL OR %s && %L)
      AND (%L IS NULL OR s.date_start >= %L)
      AND (%L IS NULL OR s.date_start <= %L)
    ORDER BY distance_meters ASC, s.date_start ASC, s.id ASC
    LIMIT %L',
    CASE WHEN has_zip_code_column THEN 's.zip_code' ELSE '''''' END,
    CASE WHEN has_tags_column THEN 'COALESCE(s.tags, ''{}''::TEXT[])' ELSE '''{}''::TEXT[]' END,
    CASE WHEN has_status_column THEN 's.status' ELSE '''published''' END,
    user_lng, user_lat,
    CASE WHEN has_status_column THEN 's.status = ''published''' ELSE 'TRUE' END,
    user_lng, user_lat, distance_meters,
    search_city, search_city,
    search_categories, 
    CASE WHEN has_tags_column THEN 'COALESCE(s.tags, ''{}''::TEXT[])' ELSE '''{}''::TEXT[]' END,
    search_categories,
    date_start_filter, date_start_filter,
    date_end_filter, date_end_filter,
    limit_count
  );
END;
$$;

-- 2. Create safe public views
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

-- 3. Create safe test functions
CREATE OR REPLACE FUNCTION public.test_postgis()
RETURNS TABLE(
  message TEXT,
  has_geom BOOLEAN,
  missing_geom_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = lootaura_v2, public
AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'lootaura_v2' AND table_name = 'sales') THEN
    RETURN QUERY SELECT 'Table lootaura_v2.sales does not exist'::TEXT, FALSE, 0::BIGINT;
    RETURN;
  END IF;

  -- Check if geom column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'lootaura_v2' AND table_name = 'sales' AND column_name = 'geom') THEN
    RETURN QUERY SELECT 'PostGIS geom column not found'::TEXT, FALSE, 0::BIGINT;
    RETURN;
  END IF;

  -- Return actual data
  RETURN QUERY
  SELECT 
    'PostGIS functionality confirmed'::TEXT,
    EXISTS(SELECT 1 FROM lootaura_v2.sales WHERE geom IS NOT NULL LIMIT 1),
    (SELECT COUNT(*) FROM lootaura_v2.sales WHERE geom IS NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_stats()
RETURNS TABLE(
  total_sales BIGINT,
  missing_geom BIGINT,
  has_gist_index BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = lootaura_v2, public
AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'lootaura_v2' AND table_name = 'sales') THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, FALSE;
    RETURN;
  END IF;

  -- Return actual stats
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM lootaura_v2.sales) as total_sales,
    (SELECT COUNT(*) FROM lootaura_v2.sales WHERE geom IS NULL) as missing_geom,
    EXISTS(
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'lootaura_v2' 
        AND tablename = 'sales' 
        AND indexname LIKE '%gist%'
    ) as has_gist_index;
END;
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
