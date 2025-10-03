-- Create lootaura_v2 tables and public wrappers
-- This migration creates the v2 schema structure and public wrappers in one go

-- 1. Create lootaura_v2 schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS lootaura_v2;

-- 2. Create sales table in lootaura_v2 schema
CREATE TABLE IF NOT EXISTS lootaura_v2.sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    address text,
    city text,
    state text,
    zip_code text,
    lat numeric,
    lng numeric,
    date_start date NOT NULL,
    time_start time NOT NULL,
    date_end date,
    time_end time,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
    privacy_mode text DEFAULT 'exact' CHECK (privacy_mode IN ('exact', 'block_until_24h')),
    is_featured boolean DEFAULT false,
    tags text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create items table in lootaura_v2 schema
CREATE TABLE IF NOT EXISTS lootaura_v2.items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES lootaura_v2.sales(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric,
    category text,
    condition text,
    images text[] DEFAULT '{}',
    is_sold boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Create profiles table in lootaura_v2 schema
CREATE TABLE IF NOT EXISTS lootaura_v2.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    email text,
    full_name text,
    home_zip text,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 5. Create favorites table in lootaura_v2 schema
CREATE TABLE IF NOT EXISTS lootaura_v2.favorites (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_id uuid NOT NULL REFERENCES lootaura_v2.sales(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, sale_id)
);

-- 6. Create zipcodes table in lootaura_v2 schema
CREATE TABLE IF NOT EXISTS lootaura_v2.zipcodes (
    zip text PRIMARY KEY,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    city text,
    state text,
    created_at timestamptz DEFAULT now()
);

-- 7. Enable Row Level Security on all tables
ALTER TABLE lootaura_v2.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootaura_v2.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootaura_v2.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootaura_v2.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootaura_v2.zipcodes ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for sales table
CREATE POLICY "Users can view published sales or their own sales" ON lootaura_v2.sales
    FOR SELECT USING (
        status = 'published' OR 
        (auth.uid() IS NOT NULL AND owner_id = auth.uid())
    );

CREATE POLICY "Users can insert their own sales" ON lootaura_v2.sales
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own sales" ON lootaura_v2.sales
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own sales" ON lootaura_v2.sales
    FOR DELETE USING (auth.uid() = owner_id);

-- 9. Create RLS policies for items table
CREATE POLICY "Users can view items from published sales or their own sales" ON lootaura_v2.items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lootaura_v2.sales s 
            WHERE s.id = sale_id 
            AND (s.status = 'published' OR (auth.uid() IS NOT NULL AND s.owner_id = auth.uid()))
        )
    );

CREATE POLICY "Users can insert items for their own sales" ON lootaura_v2.items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lootaura_v2.sales s 
            WHERE s.id = sale_id 
            AND auth.uid() = s.owner_id
        )
    );

CREATE POLICY "Users can update items for their own sales" ON lootaura_v2.items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lootaura_v2.sales s 
            WHERE s.id = sale_id 
            AND auth.uid() = s.owner_id
        )
    );

CREATE POLICY "Users can delete items for their own sales" ON lootaura_v2.items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lootaura_v2.sales s 
            WHERE s.id = sale_id 
            AND auth.uid() = s.owner_id
        )
    );

-- 10. Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON lootaura_v2.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON lootaura_v2.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON lootaura_v2.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 11. Create RLS policies for favorites table
CREATE POLICY "Users can view their own favorites" ON lootaura_v2.favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON lootaura_v2.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON lootaura_v2.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- 12. Create RLS policies for zipcodes table (public read access)
CREATE POLICY "zipcodes read" ON lootaura_v2.zipcodes
    FOR SELECT USING (true);

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_location ON lootaura_v2.sales(lat, lng);
CREATE INDEX IF NOT EXISTS idx_sales_dates ON lootaura_v2.sales(date_start, date_end);
CREATE INDEX IF NOT EXISTS idx_sales_tags ON lootaura_v2.sales USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_items_sale_id ON lootaura_v2.items(sale_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON lootaura_v2.items(category);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON lootaura_v2.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_sale_id ON lootaura_v2.favorites(sale_id);
CREATE INDEX IF NOT EXISTS zipcodes_state_idx ON lootaura_v2.zipcodes(state);
CREATE INDEX IF NOT EXISTS zipcodes_city_idx ON lootaura_v2.zipcodes(city);
CREATE INDEX IF NOT EXISTS zipcodes_lat_lng_idx ON lootaura_v2.zipcodes(lat, lng);

-- 14. Grant permissions
GRANT SELECT ON lootaura_v2.zipcodes TO anon;
GRANT SELECT ON lootaura_v2.zipcodes TO authenticated;

-- 15. Now create the public wrappers
-- Public wrapper for search_sales_within_distance function
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

-- 16. Public views
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
  privacy_mode,
  is_featured,
  created_at,
  updated_at
FROM lootaura_v2.sales;

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
  created_at,
  updated_at
FROM lootaura_v2.items;

CREATE OR REPLACE VIEW public.profiles_v2 AS
SELECT 
  user_id,
  COALESCE(email, '') as email,
  COALESCE(full_name, '') as full_name,
  COALESCE(avatar_url, '') as avatar_url,
  created_at,
  updated_at
FROM lootaura_v2.profiles;

CREATE OR REPLACE VIEW public.favorites_v2 AS
SELECT 
  user_id,
  sale_id,
  created_at
FROM lootaura_v2.favorites;

CREATE OR REPLACE VIEW public.zipcodes_v2 AS
SELECT 
  zip,
  lat,
  lng,
  city,
  state
FROM lootaura_v2.zipcodes;

-- 17. Public functions
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

-- 18. Grant permissions to public wrappers
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.sales_v2 TO anon, authenticated;
GRANT SELECT ON public.items_v2 TO anon, authenticated;
GRANT SELECT ON public.profiles_v2 TO anon, authenticated;
GRANT SELECT ON public.favorites_v2 TO anon, authenticated;
GRANT SELECT ON public.zipcodes_v2 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_sales_within_distance TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.test_postgis TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_stats TO anon, authenticated;

-- 19. Enable RLS on views
ALTER VIEW public.sales_v2 SET (security_invoker = true);
ALTER VIEW public.items_v2 SET (security_invoker = true);
ALTER VIEW public.profiles_v2 SET (security_invoker = true);
ALTER VIEW public.favorites_v2 SET (security_invoker = true);
ALTER VIEW public.zipcodes_v2 SET (security_invoker = true);
