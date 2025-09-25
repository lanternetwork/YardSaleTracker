-- Sales and geocoding cache schema for Craigslist ingestion
-- NOTE: Apply via Supabase migrations in CI/CD. Do not run locally here.

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  title text not null,
  url text not null,
  price numeric null,
  location_text text null,
  lat double precision null,
  lng double precision null,
  posted_at timestamptz null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  starts_at timestamptz null,
  ends_at timestamptz null,
  status text not null default 'active' check (status in ('active','stale','removed')),
  constraint sales_source_unique unique (source, source_id)
);

create index if not exists sales_last_seen_idx on public.sales (last_seen_at desc);
create index if not exists sales_posted_idx on public.sales (posted_at desc);

-- Optional PostGIS path (guarded):
do $$
begin
  if exists (select 1 from pg_extension where extname = 'postgis') then
    -- Add geom if not present
    if not exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' and table_name = 'sales' and column_name = 'geom'
    ) then
      alter table public.sales add column geom geography(Point,4326);
    end if;
    create index if not exists sales_geom_idx on public.sales using gist (geom);
  end if;
end $$;

create table if not exists public.geocode_cache (
  id uuid primary key default gen_random_uuid(),
  query text unique not null,
  lat double precision not null,
  lng double precision not null,
  provider text not null default 'google',
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- RLS: end-users can only SELECT public columns from sales
alter table public.sales enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'sales' and policyname = 'sales_select_public'
  ) then
    create policy sales_select_public on public.sales for select using (true);
  end if;
end $$;


