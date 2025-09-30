-- Enable PostGIS extension in lootaura_v2 schema
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column to sales table
ALTER TABLE lootaura_v2.sales 
ADD COLUMN IF NOT EXISTS geom geography(Point, 4326);

-- Create function to update geom from lat/lng
CREATE OR REPLACE FUNCTION lootaura_v2.update_sale_geom()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update geom if lat and lng are provided and not null
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
    ELSE
        NEW.geom = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update geom on insert/update
DROP TRIGGER IF EXISTS update_sale_geom_trigger ON lootaura_v2.sales;
CREATE TRIGGER update_sale_geom_trigger
    BEFORE INSERT OR UPDATE ON lootaura_v2.sales
    FOR EACH ROW
    EXECUTE FUNCTION lootaura_v2.update_sale_geom();

-- Create spatial index on geom column for efficient spatial queries
CREATE INDEX IF NOT EXISTS idx_sales_geom ON lootaura_v2.sales USING GIST (geom);

-- Update existing records to populate geom column
UPDATE lootaura_v2.sales 
SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Create function for distance-based queries
CREATE OR REPLACE FUNCTION lootaura_v2.get_sales_within_distance(
    user_lat DECIMAL,
    user_lng DECIMAL,
    distance_meters INTEGER,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    lat DECIMAL,
    lng DECIMAL,
    date_start DATE,
    time_start TIME,
    date_end DATE,
    time_end TIME,
    price DECIMAL,
    tags TEXT[],
    status TEXT,
    privacy_mode TEXT,
    is_featured BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    distance_meters DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.description,
        s.address,
        s.city,
        s.state,
        s.zip_code,
        s.lat,
        s.lng,
        s.date_start,
        s.time_start,
        s.date_end,
        s.time_end,
        s.price,
        s.tags,
        s.status,
        s.privacy_mode,
        s.is_featured,
        s.created_at,
        s.updated_at,
        ST_Distance(s.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) AS distance_meters
    FROM lootaura_v2.sales s
    WHERE s.status = 'published'
        AND s.geom IS NOT NULL
        AND ST_DWithin(
            s.geom, 
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, 
            distance_meters
        )
    ORDER BY ST_Distance(s.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography)
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function for distance-based search with filters
CREATE OR REPLACE FUNCTION lootaura_v2.search_sales_within_distance(
    user_lat DECIMAL,
    user_lng DECIMAL,
    distance_meters INTEGER,
    search_city TEXT DEFAULT NULL,
    search_categories TEXT[] DEFAULT NULL,
    date_start_filter DATE DEFAULT NULL,
    date_end_filter DATE DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    lat DECIMAL,
    lng DECIMAL,
    date_start DATE,
    time_start TIME,
    date_end DATE,
    time_end TIME,
    price DECIMAL,
    tags TEXT[],
    status TEXT,
    privacy_mode TEXT,
    is_featured BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    distance_meters DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.description,
        s.address,
        s.city,
        s.state,
        s.zip_code,
        s.lat,
        s.lng,
        s.date_start,
        s.time_start,
        s.date_end,
        s.time_end,
        s.price,
        s.tags,
        s.status,
        s.privacy_mode,
        s.is_featured,
        s.created_at,
        s.updated_at,
        ST_Distance(s.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) AS distance_meters
    FROM lootaura_v2.sales s
    WHERE s.status = 'published'
        AND s.geom IS NOT NULL
        AND ST_DWithin(
            s.geom, 
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, 
            distance_meters
        )
        AND (search_city IS NULL OR s.city ILIKE '%' || search_city || '%')
        AND (search_categories IS NULL OR s.tags && search_categories)
        AND (date_start_filter IS NULL OR s.date_start >= date_start_filter)
        AND (date_end_filter IS NULL OR s.date_start <= date_end_filter)
    ORDER BY ST_Distance(s.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography)
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION lootaura_v2.get_sales_within_distance TO authenticated;
GRANT EXECUTE ON FUNCTION lootaura_v2.search_sales_within_distance TO authenticated;
