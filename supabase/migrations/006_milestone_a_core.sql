-- Milestone A Core Migration
-- Adds required fields, negative_matches table, and indexes for wizard and dedupe features

-- Enable pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add required fields to sales table (if not exists)
DO $$ 
BEGIN
    -- Privacy mode field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'privacy_mode') THEN
        ALTER TABLE yard_sales ADD COLUMN privacy_mode text DEFAULT 'exact' 
        CHECK (privacy_mode IN ('exact', 'block_until_24h'));
    END IF;

    -- Date fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'date_start') THEN
        ALTER TABLE yard_sales ADD COLUMN date_start date;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'date_end') THEN
        ALTER TABLE yard_sales ADD COLUMN date_end date;
    END IF;

    -- Time fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'time_start') THEN
        ALTER TABLE yard_sales ADD COLUMN time_start time;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'time_end') THEN
        ALTER TABLE yard_sales ADD COLUMN time_end time;
    END IF;

    -- Status field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'status') THEN
        ALTER TABLE yard_sales ADD COLUMN status text DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'hidden', 'auto_hidden'));
    END IF;

    -- Source tracking fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'source') THEN
        ALTER TABLE yard_sales ADD COLUMN source text DEFAULT 'manual';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'source_id') THEN
        ALTER TABLE yard_sales ADD COLUMN source_id text;
    END IF;

    -- Timestamp fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'first_seen_at') THEN
        ALTER TABLE yard_sales ADD COLUMN first_seen_at timestamptz DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'yard_sales' AND column_name = 'last_seen_at') THEN
        ALTER TABLE yard_sales ADD COLUMN last_seen_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Create negative_matches table for dedupe overrides
CREATE TABLE IF NOT EXISTS negative_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id_a uuid NOT NULL REFERENCES yard_sales(id) ON DELETE CASCADE,
    sale_id_b uuid NOT NULL REFERENCES yard_sales(id) ON DELETE CASCADE,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    
    -- Ensure we don't have duplicate pairs (order doesn't matter)
    CONSTRAINT unique_negative_match 
        UNIQUE (LEAST(sale_id_a, sale_id_b), GREATEST(sale_id_a, sale_id_b))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_yard_sales_title_trgm ON yard_sales USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_yard_sales_date_start ON yard_sales (date_start);
CREATE INDEX IF NOT EXISTS idx_yard_sales_last_seen_at ON yard_sales (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_yard_sales_status ON yard_sales (status);

-- Partial unique index for source tracking
CREATE UNIQUE INDEX IF NOT EXISTS idx_yard_sales_source_unique 
    ON yard_sales (source, source_id) 
    WHERE source_id IS NOT NULL;

-- Index for negative_matches lookups
CREATE INDEX IF NOT EXISTS idx_negative_matches_sale_a ON negative_matches (sale_id_a);
CREATE INDEX IF NOT EXISTS idx_negative_matches_sale_b ON negative_matches (sale_id_b);

-- Update RLS policies to handle new fields
-- Keep existing RLS: published readable by all, drafts owner-only

-- Add comment for documentation
COMMENT ON TABLE negative_matches IS 'Records user confirmations that two sales are NOT duplicates';
COMMENT ON COLUMN yard_sales.privacy_mode IS 'Controls coordinate masking: exact=show precise location, block_until_24h=mask until 24h before start';
COMMENT ON COLUMN yard_sales.status IS 'Sale lifecycle: draft=unpublished, published=live, hidden=manually hidden, auto_hidden=system hidden';
