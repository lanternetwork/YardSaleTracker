-- Inline dedupe support with trigram similarity
-- This migration is safe if extensions/indexes already exist

-- Enable pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index on title for similarity search
CREATE INDEX IF NOT EXISTS idx_yard_sales_title_trgm 
    ON public.yard_sales USING gin (title gin_trgm_ops);

-- Ensure negative_matches table exists (from previous migration)
CREATE TABLE IF NOT EXISTS public.negative_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id_a uuid NOT NULL REFERENCES public.yard_sales(id) ON DELETE CASCADE,
    sale_id_b uuid NOT NULL REFERENCES public.yard_sales(id) ON DELETE CASCADE,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT NOW(),
    
    -- Ensure we don't have duplicate pairs (order doesn't matter)
    CONSTRAINT unique_negative_match 
        UNIQUE (LEAST(sale_id_a, sale_id_b), GREATEST(sale_id_a, sale_id_b))
);

-- Create indexes for negative_matches lookups
CREATE INDEX IF NOT EXISTS idx_negative_matches_sale_a ON public.negative_matches (sale_id_a);
CREATE INDEX IF NOT EXISTS idx_negative_matches_sale_b ON public.negative_matches (sale_id_b);

-- Add comments for documentation
COMMENT ON TABLE public.negative_matches IS 'Records user confirmations that two sales are NOT duplicates';
COMMENT ON INDEX idx_yard_sales_title_trgm IS 'Trigram index for fuzzy title similarity search in deduplication';
