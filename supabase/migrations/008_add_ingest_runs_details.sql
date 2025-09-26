-- Add details column to ingest_runs table for storing sanitized run metadata
ALTER TABLE public.ingest_runs 
ADD COLUMN IF NOT EXISTS details jsonb NULL;

-- Add index on details for better query performance
CREATE INDEX IF NOT EXISTS idx_ingest_runs_details ON public.ingest_runs USING GIN (details);

-- Add comment to explain the details column
COMMENT ON COLUMN public.ingest_runs.details IS 'Sanitized run metadata including sites, fetch stats, parse/filter counts, and sample data (no secrets)';
