-- Create sales table for scraped data
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_id text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  location_text text,
  lat double precision,
  lng double precision,
  posted_at timestamptz,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  source_host text,
  url_prev text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique combination of source and source_id
  UNIQUE(source, source_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_last_seen_at ON public.sales (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_posted_at ON public.sales (posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_source ON public.sales (source);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales (status);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create ingest_runs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ingest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  source text NOT NULL,
  dry_run boolean DEFAULT false,
  fetched_count integer DEFAULT 0,
  new_count integer DEFAULT 0,
  updated_count integer DEFAULT 0,
  geocode_calls integer DEFAULT 0,
  cache_hits integer DEFAULT 0,
  status text DEFAULT 'running' CHECK (status IN ('running', 'ok', 'error')),
  last_error text,
  created_at timestamptz DEFAULT now()
);

-- Create index for ingest_runs
CREATE INDEX IF NOT EXISTS idx_ingest_runs_started_at ON public.ingest_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_runs_source ON public.ingest_runs (source);

-- Disable RLS for ingest_runs (server-only access)
ALTER TABLE public.ingest_runs DISABLE ROW LEVEL SECURITY;

-- Create geocode_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.geocode_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL UNIQUE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  provider text DEFAULT 'google',
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now()
);

-- Create index for geocode_cache
CREATE INDEX IF NOT EXISTS idx_geocode_cache_query ON public.geocode_cache (query);
CREATE INDEX IF NOT EXISTS idx_geocode_cache_last_used ON public.geocode_cache (last_used_at DESC);

-- Disable RLS for geocode_cache (server-only access)
ALTER TABLE public.geocode_cache DISABLE ROW LEVEL SECURITY;
