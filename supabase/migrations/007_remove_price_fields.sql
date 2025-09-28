-- Remove price fields from yard_sales table
-- This migration is safe if columns are absent

-- Drop price columns if they exist
ALTER TABLE IF EXISTS public.yard_sales DROP COLUMN IF EXISTS price_min;
ALTER TABLE IF EXISTS public.yard_sales DROP COLUMN IF EXISTS price_max;

-- Drop any indexes on price columns if they exist
DROP INDEX IF EXISTS idx_sales_price_range;
DROP INDEX IF EXISTS idx_yard_sales_price_range;

-- Add comment for documentation
COMMENT ON TABLE public.yard_sales IS 'Yard sales table - price fields removed as yard sales do not have sale-level prices';
