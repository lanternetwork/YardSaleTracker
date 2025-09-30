-- Create lootaura_v2 schema
CREATE SCHEMA IF NOT EXISTS lootaura_v2;

-- Set search path to include the new schema
ALTER DATABASE postgres SET search_path TO lootaura_v2, public;

-- Create profiles table in lootaura_v2 schema
CREATE TABLE IF NOT EXISTS lootaura_v2.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    home_zip text,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Create sales table in lootaura_v2 schema
CREATE TABLE IF NOT EXISTS lootaura_v2.sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    address text,
    city text,
    state text,
    zip_code text,
    lat numeric,
    lng numeric,
    date_start date NOT NULL,
    time_start time NOT NULL,
    date_end date,
    time_end time,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
    privacy_mode text DEFAULT 'exact' CHECK (privacy_mode IN ('exact', 'block_until_24h')),
    is_featured boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create items table in lootaura_v2 schema
CREATE TABLE IF NOT EXISTS lootaura_v2.items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES lootaura_v2.sales(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric,
    category text,
    condition text,
    images text[] DEFAULT '{}',
    is_sold boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create favorites table in lootaura_v2 schema
CREATE TABLE IF NOT EXISTS lootaura_v2.favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_id uuid NOT NULL REFERENCES lootaura_v2.sales(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, sale_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE lootaura_v2.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootaura_v2.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootaura_v2.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootaura_v2.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON lootaura_v2.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON lootaura_v2.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON lootaura_v2.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for sales table
CREATE POLICY "Users can view published sales or their own sales" ON lootaura_v2.sales
    FOR SELECT USING (
        status = 'published' OR 
        (auth.uid() IS NOT NULL AND owner_id = auth.uid())
    );

CREATE POLICY "Users can insert their own sales" ON lootaura_v2.sales
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own sales" ON lootaura_v2.sales
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own sales" ON lootaura_v2.sales
    FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for items table
CREATE POLICY "Users can view items from published sales or their own sales" ON lootaura_v2.items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lootaura_v2.sales 
            WHERE sales.id = items.sale_id 
            AND (sales.status = 'published' OR sales.owner_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert items to their own sales" ON lootaura_v2.items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lootaura_v2.sales 
            WHERE sales.id = items.sale_id 
            AND sales.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in their own sales" ON lootaura_v2.items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lootaura_v2.sales 
            WHERE sales.id = items.sale_id 
            AND sales.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items from their own sales" ON lootaura_v2.items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lootaura_v2.sales 
            WHERE sales.id = items.sale_id 
            AND sales.owner_id = auth.uid()
        )
    );

-- RLS Policies for favorites table
CREATE POLICY "Users can view their own favorites" ON lootaura_v2.favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON lootaura_v2.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON lootaura_v2.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON lootaura_v2.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_owner_id ON lootaura_v2.sales(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON lootaura_v2.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_location ON lootaura_v2.sales(lat, lng);
CREATE INDEX IF NOT EXISTS idx_sales_dates ON lootaura_v2.sales(date_start, date_end);
CREATE INDEX IF NOT EXISTS idx_items_sale_id ON lootaura_v2.items(sale_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON lootaura_v2.items(category);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON lootaura_v2.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_sale_id ON lootaura_v2.favorites(sale_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION lootaura_v2.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON lootaura_v2.profiles 
    FOR EACH ROW EXECUTE FUNCTION lootaura_v2.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON lootaura_v2.sales 
    FOR EACH ROW EXECUTE FUNCTION lootaura_v2.update_updated_at_column();

CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON lootaura_v2.items 
    FOR EACH ROW EXECUTE FUNCTION lootaura_v2.update_updated_at_column();
