-- Milestone A: Wizard & Browse polish
-- Add fields to yard_sales table for wizard functionality

-- Add missing fields to yard_sales table (idempotent)
DO $$ 
BEGIN
    -- Add privacy_mode field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'privacy_mode') THEN
        ALTER TABLE public.yard_sales ADD COLUMN privacy_mode text DEFAULT 'exact' 
        CHECK (privacy_mode IN ('exact','block_until_24h'));
    END IF;

    -- Add geocode_precision field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'geocode_precision') THEN
        ALTER TABLE public.yard_sales ADD COLUMN geocode_precision text DEFAULT 'exact';
    END IF;

    -- Add date fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'date_start') THEN
        ALTER TABLE public.yard_sales ADD COLUMN date_start date;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'date_end') THEN
        ALTER TABLE public.yard_sales ADD COLUMN date_end date;
    END IF;

    -- Add time fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'time_start') THEN
        ALTER TABLE public.yard_sales ADD COLUMN time_start time;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'time_end') THEN
        ALTER TABLE public.yard_sales ADD COLUMN time_end time;
    END IF;

    -- Add status field (update existing status enum)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'status') THEN
        ALTER TABLE public.yard_sales ADD COLUMN status text DEFAULT 'active' 
        CHECK (status IN ('active','completed','cancelled','draft','published','hidden','auto_hidden'));
    END IF;

    -- Add first_seen_at and last_seen_at fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'first_seen_at') THEN
        ALTER TABLE public.yard_sales ADD COLUMN first_seen_at timestamptz DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'last_seen_at') THEN
        ALTER TABLE public.yard_sales ADD COLUMN last_seen_at timestamptz DEFAULT now();
    END IF;

    -- Add source fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'source') THEN
        ALTER TABLE public.yard_sales ADD COLUMN source text DEFAULT 'manual';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'source_id') THEN
        ALTER TABLE public.yard_sales ADD COLUMN source_id text;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_yard_sales_date_start ON public.yard_sales (date_start);
CREATE INDEX IF NOT EXISTS idx_yard_sales_last_seen_at_desc ON public.yard_sales (last_seen_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_yard_sales_source_source_id_unique 
ON public.yard_sales (source, source_id) WHERE source_id IS NOT NULL;

-- Enable pg_trgm extension for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram index for title similarity
CREATE INDEX IF NOT EXISTS idx_yard_sales_title_trgm ON public.yard_sales USING gin (title gin_trgm_ops);

-- Create negative_matches table
CREATE TABLE IF NOT EXISTS public.negative_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id_a uuid NOT NULL REFERENCES public.yard_sales(id) ON DELETE CASCADE,
    sale_id_b uuid NOT NULL REFERENCES public.yard_sales(id) ON DELETE CASCADE,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create unique index to prevent duplicate negative matches
CREATE UNIQUE INDEX IF NOT EXISTS idx_negative_matches_unique_pair 
ON public.negative_matches (least(sale_id_a, sale_id_b), greatest(sale_id_a, sale_id_b));

-- RLS Policies for yard_sales table
-- Enable RLS if not already enabled
ALTER TABLE public.yard_sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "yard_sales_select_policy" ON public.yard_sales;
DROP POLICY IF EXISTS "yard_sales_insert_policy" ON public.yard_sales;
DROP POLICY IF EXISTS "yard_sales_update_policy" ON public.yard_sales;
DROP POLICY IF EXISTS "yard_sales_delete_policy" ON public.yard_sales;

-- Create RLS policies for yard_sales
CREATE POLICY "yard_sales_select_policy" ON public.yard_sales
    FOR SELECT USING (
        status = 'active' OR 
        (auth.uid() IS NOT NULL AND owner_id = auth.uid())
    );

CREATE POLICY "yard_sales_insert_policy" ON public.yard_sales
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND owner_id = auth.uid()
    );

CREATE POLICY "yard_sales_update_policy" ON public.yard_sales
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND owner_id = auth.uid()
    );

CREATE POLICY "yard_sales_delete_policy" ON public.yard_sales
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND owner_id = auth.uid()
    );

-- RLS Policies for negative_matches table
ALTER TABLE public.negative_matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "negative_matches_select_policy" ON public.negative_matches;
DROP POLICY IF EXISTS "negative_matches_insert_policy" ON public.negative_matches;

-- Create RLS policies for negative_matches
CREATE POLICY "negative_matches_select_policy" ON public.negative_matches
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.yard_sales 
                WHERE id IN (sale_id_a, sale_id_b) AND owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "negative_matches_insert_policy" ON public.negative_matches
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND created_by = auth.uid()
    );

-- Create search_sales function for optimized search
CREATE OR REPLACE FUNCTION public.search_sales(
    search_query text DEFAULT NULL,
    max_distance_km numeric DEFAULT NULL,
    user_lat numeric DEFAULT NULL,
    user_lng numeric DEFAULT NULL,
    date_from date DEFAULT NULL,
    date_to date DEFAULT NULL,
    min_price_param numeric DEFAULT NULL,
    max_price_param numeric DEFAULT NULL,
    tags_filter text[] DEFAULT NULL,
    limit_count integer DEFAULT 100,
    offset_count integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    address text,
    city text,
    state text,
    zip text,
    lat numeric,
    lng numeric,
    start_at timestamptz,
    end_at timestamptz,
    date_start date,
    date_end date,
    time_start time,
    time_end time,
    privacy_mode text,
    geocode_precision text,
    tags text[],
    min_price numeric,
    max_price numeric,
    photos text[],
    contact text,
    status text,
    source text,
    source_id text,
    owner_id uuid,
    first_seen_at timestamptz,
    last_seen_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.description,
        s.address,
        s.city,
        s.state,
        s.zip,
        s.lat,
        s.lng,
        s.start_at,
        s.end_at,
        s.date_start,
        s.date_end,
        s.time_start,
        s.time_end,
        s.privacy_mode,
        s.geocode_precision,
        s.tags,
        s.price_min,
        s.price_max,
        s.photos,
        s.contact,
        s.status,
        s.source,
        s.source_id,
        s.owner_id,
        s.first_seen_at,
        s.last_seen_at,
        s.created_at,
        s.updated_at
        FROM public.yard_sales s
        WHERE 
            s.status = 'active'
        AND (search_query IS NULL OR s.title ILIKE '%' || search_query || '%' OR s.description ILIKE '%' || search_query || '%')
        AND (date_from IS NULL OR s.date_start >= date_from)
        AND (date_to IS NULL OR s.date_start <= date_to)
        AND (min_price_param IS NULL OR s.price_min >= min_price_param)
        AND (max_price_param IS NULL OR s.price_max <= max_price_param)
        AND (tags_filter IS NULL OR s.tags && tags_filter)
        AND (
            max_distance_km IS NULL OR 
            user_lat IS NULL OR 
            user_lng IS NULL OR
            ST_DWithin(
                ST_Point(s.lng, s.lat)::geography,
                ST_Point(user_lng, user_lat)::geography,
                max_distance_km * 1000
            )
        )
    ORDER BY 
        CASE 
            WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND s.lat IS NOT NULL AND s.lng IS NOT NULL THEN
                ST_Distance(
                    ST_Point(s.lng, s.lat)::geography,
                    ST_Point(user_lng, user_lat)::geography
                )
            ELSE 0
        END,
        s.last_seen_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT ON public.negative_matches TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_sales TO authenticated;
