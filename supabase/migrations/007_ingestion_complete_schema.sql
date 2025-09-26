-- Create sales table for scraped data (if not exists)
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

-- Create ingest_runs table (if not exists)
CREATE TABLE IF NOT EXISTS public.ingest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  source text NOT NULL DEFAULT 'craigslist',
  dry_run boolean NOT NULL DEFAULT false,
  fetched_count integer NOT NULL DEFAULT 0,
  new_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  geocode_calls integer DEFAULT 0,
  cache_hits integer DEFAULT 0,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'ok', 'error')),
  last_error text,
  created_at timestamptz DEFAULT now()
);

-- Create index for ingest_runs
CREATE INDEX IF NOT EXISTS idx_ingest_runs_started_at ON public.ingest_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_runs_source ON public.ingest_runs (source);

-- Disable RLS for ingest_runs (server-only access)
ALTER TABLE public.ingest_runs DISABLE ROW LEVEL SECURITY;
