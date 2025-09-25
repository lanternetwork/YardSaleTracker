-- Accounts & Auth gating schema
-- NOTE: Apply via Supabase migrations in CI/CD. Do not run locally here.

-- Update sales table to include owner_id and status
alter table public.sales add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.sales add column if not exists status text not null default 'published' check (status in ('draft','published','archived'));
alter table public.sales add column if not exists created_at timestamptz not null default now();
alter table public.sales add column if not exists updated_at timestamptz not null default now();

-- Create indexes for performance
create index if not exists sales_owner_id_idx on public.sales (owner_id);
create index if not exists sales_status_idx on public.sales (status);
create index if not exists sales_created_at_idx on public.sales (created_at);

-- Update existing sales to have owner_id (set to a system user or null for migration)
-- This is a one-time migration - existing sales become "orphaned" but remain visible
update public.sales set owner_id = null where owner_id is null;

-- Create favorites table
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, sale_id)
);

create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_sale_id_idx on public.favorites (sale_id);

-- Enable RLS on all tables
alter table public.sales enable row level security;
alter table public.favorites enable row level security;

-- RLS Policies for sales
-- Anyone can read published sales
create policy sales_select_published on public.sales for select using (status = 'published');
-- Owners can read their own sales (any status)
create policy sales_select_owner on public.sales for select using (owner_id = auth.uid());
-- Only authenticated users can insert sales
create policy sales_insert_auth on public.sales for insert with check (auth.uid() is not null and owner_id = auth.uid());
-- Only owners can update their sales
create policy sales_update_owner on public.sales for update using (owner_id = auth.uid());
-- Only owners can delete their sales
create policy sales_delete_owner on public.sales for delete using (owner_id = auth.uid());

-- RLS Policies for favorites
-- Users can only access their own favorites
create policy favorites_select_owner on public.favorites for select using (user_id = auth.uid());
create policy favorites_insert_owner on public.favorites for insert with check (user_id = auth.uid());
create policy favorites_delete_owner on public.favorites for delete using (user_id = auth.uid());

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for sales updated_at
create trigger sales_updated_at_trigger
  before update on public.sales
  for each row
  execute function public.update_updated_at_column();

