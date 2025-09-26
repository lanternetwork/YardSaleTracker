-- Milestone A: Wizard & Browse polish
-- Add fields to sales table for wizard functionality

-- Add missing fields to sales table (idempotent)
DO $$ 
BEGIN
    -- Add privacy_mode field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'privacy_mode') THEN
        ALTER TABLE public.sales ADD COLUMN privacy_mode text DEFAULT 'exact' 
        CHECK (privacy_mode IN ('exact','block_until_24h'));
    END IF;

    -- Add geocode_precision field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'geocode_precision') THEN
        ALTER TABLE public.sales ADD COLUMN geocode_precision text DEFAULT 'exact';
    END IF;

    -- Add date fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'date_start') THEN
        ALTER TABLE public.sales ADD COLUMN date_start date;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'date_end') THEN
        ALTER TABLE public.sales ADD COLUMN date_end date;
    END IF;

    -- Add time fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'time_start') THEN
        ALTER TABLE public.sales ADD COLUMN time_start time;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'time_end') THEN
        ALTER TABLE public.sales ADD COLUMN time_end time;
    END IF;

    -- Add status field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'status') THEN
        ALTER TABLE public.sales ADD COLUMN status text DEFAULT 'draft' 
        CHECK (status IN ('draft','published','hidden','auto_hidden'));
    END IF;

    -- Add first_seen_at and last_seen_at fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'first_seen_at') THEN
        ALTER TABLE public.sales ADD COLUMN first_seen_at timestamptz DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'last_seen_at') THEN
        ALTER TABLE public.sales ADD COLUMN last_seen_at timestamptz DEFAULT now();
    END IF;

    -- Add source fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'source') THEN
        ALTER TABLE public.sales ADD COLUMN source text DEFAULT 'manual';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'source_id') THEN
        ALTER TABLE public.sales ADD COLUMN source_id text;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_date_start ON public.sales (date_start);
CREATE INDEX IF NOT EXISTS idx_sales_last_seen_at_desc ON public.sales (last_seen_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_source_source_id_unique 
ON public.sales (source, source_id) WHERE source_id IS NOT NULL;

-- Enable pg_trgm extension for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram index for title similarity
CREATE INDEX IF NOT EXISTS idx_sales_title_trgm ON public.sales USING gin (title gin_trgm_ops);

-- Create negative_matches table
CREATE TABLE IF NOT EXISTS public.negative_matches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id_a uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    sale_id_b uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create unique index to prevent duplicate negative matches
CREATE UNIQUE INDEX IF NOT EXISTS idx_negative_matches_unique_pair 
ON public.negative_matches (least(sale_id_a, sale_id_b), greatest(sale_id_a, sale_id_b));

-- RLS Policies for sales table
-- Enable RLS if not already enabled
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sales_select_policy" ON public.sales;
DROP POLICY IF EXISTS "sales_insert_policy" ON public.sales;
DROP POLICY IF EXISTS "sales_update_policy" ON public.sales;
DROP POLICY IF EXISTS "sales_delete_policy" ON public.sales;

-- Create RLS policies for sales
CREATE POLICY "sales_select_policy" ON public.sales
    FOR SELECT USING (
        status = 'published' OR 
        (auth.uid() IS NOT NULL AND owner_id = auth.uid())
    );

CREATE POLICY "sales_insert_policy" ON public.sales
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND owner_id = auth.uid()
    );

CREATE POLICY "sales_update_policy" ON public.sales
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND owner_id = auth.uid()
    );

CREATE POLICY "sales_delete_policy" ON public.sales
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
                SELECT 1 FROM public.sales 
                WHERE id IN (sale_id_a, sale_id_b) AND owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "negative_matches_insert_policy" ON public.negative_matches
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND created_by = auth.uid()
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT ON public.negative_matches TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
