-- YardSaleFinder Database Schema
-- Run this SQL in your Supabase SQL editor

-- Create custom types
create type sale_status as enum ('active','completed','cancelled');

-- Create yard_sales table
create table if not exists yard_sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  address text, 
  city text, 
  state text, 
  zip text,
  lat double precision, 
  lng double precision,
  start_at timestamptz, 
  end_at timestamptz,
  tags text[] default '{}',
  price_min numeric, 
  price_max numeric,
  photos text[] default '{}',
  contact text,
  status sale_status default 'active',
  source text default 'user',             -- 'user' | 'manual'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create sale_items table
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references yard_sales(id) on delete cascade,
  name text not null,
  category text,
  "condition" text,
  price numeric,
  photo text,
  purchased boolean default false,
  created_at timestamptz default now()
);

-- Create favorites table
create table if not exists favorites (
  user_id uuid references auth.users(id) on delete cascade,
  sale_id uuid references yard_sales(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, sale_id)
);

-- Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table yard_sales enable row level security;
alter table sale_items enable row level security;
alter table favorites enable row level security;
alter table profiles enable row level security;

-- Create RLS policies
create policy "Public read sales" on yard_sales for select using (true);

create policy "Owners manage sales" on yard_sales
  for all using (auth.uid() = owner_id) 
  with check (auth.uid() = owner_id);

create policy "Public read items" on sale_items for select using (true);

create policy "Owners manage items" on sale_items
  using (exists(select 1 from yard_sales s where s.id = sale_items.sale_id and s.owner_id = auth.uid()))
  with check (exists(select 1 from yard_sales s where s.id = sale_items.sale_id and s.owner_id = auth.uid()));

create policy "Users manage favorites" on favorites
  for all using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

create policy "Users manage profile" on profiles
  for all using (auth.uid() = id) 
  with check (auth.uid() = id);

-- Create indexes for performance
create index if not exists idx_sales_geo on yard_sales (lat, lng);
create index if not exists idx_sales_time on yard_sales (start_at, end_at);
create index if not exists idx_sales_source on yard_sales (source);
create index if not exists idx_sales_status on yard_sales (status);
create index if not exists idx_sales_created on yard_sales (created_at desc);
create index if not exists idx_favorites_user on favorites (user_id);
create index if not exists idx_favorites_sale on favorites (sale_id);

-- Create storage bucket for sale photos
insert into storage.buckets (id, name, public) 
values ('sale-photos', 'sale-photos', true)
on conflict (id) do nothing;

-- Create storage policy for sale photos
create policy "Public read sale photos" on storage.objects
  for select using (bucket_id = 'sale-photos');

create policy "Authenticated write sale photos" on storage.objects
  for insert with check (bucket_id = 'sale-photos' and auth.role() = 'authenticated');

create policy "Owners update sale photos" on storage.objects
  for update using (bucket_id = 'sale-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Owners delete sale photos" on storage.objects
  for delete using (bucket_id = 'sale-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for yard_sales
create trigger update_yard_sales_updated_at
  before update on yard_sales
  for each row
  execute function update_updated_at_column();
