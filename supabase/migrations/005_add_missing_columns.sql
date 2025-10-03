-- Add missing columns to lootaura_v2.sales table
-- This migration adds columns that are referenced in the public wrappers but missing from the v2 schema

-- Add tags column to sales table
ALTER TABLE lootaura_v2.sales 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add description column to sales table (if not already present)
ALTER TABLE lootaura_v2.sales 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add address column to sales table (if not already present)  
ALTER TABLE lootaura_v2.sales 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add privacy_mode column to sales table (if not already present)
ALTER TABLE lootaura_v2.sales 
ADD COLUMN IF NOT EXISTS privacy_mode TEXT DEFAULT 'exact' CHECK (privacy_mode IN ('exact', 'block_until_24h'));

-- Add is_featured column to sales table (if not already present)
ALTER TABLE lootaura_v2.sales 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add created_at and updated_at columns to sales table (if not already present)
ALTER TABLE lootaura_v2.sales 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE lootaura_v2.sales 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to profiles table
ALTER TABLE lootaura_v2.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE lootaura_v2.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE lootaura_v2.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE lootaura_v2.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE lootaura_v2.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to favorites table
ALTER TABLE lootaura_v2.favorites 
ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();

ALTER TABLE lootaura_v2.favorites 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to items table
ALTER TABLE lootaura_v2.items 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE lootaura_v2.items 
ADD COLUMN IF NOT EXISTS price NUMERIC;

ALTER TABLE lootaura_v2.items 
ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE lootaura_v2.items 
ADD COLUMN IF NOT EXISTS condition TEXT;

ALTER TABLE lootaura_v2.items 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

ALTER TABLE lootaura_v2.items 
ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT false;

ALTER TABLE lootaura_v2.items 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE lootaura_v2.items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_sales_tags ON lootaura_v2.sales USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_items_category ON lootaura_v2.items (category);
CREATE INDEX IF NOT EXISTS idx_items_is_sold ON lootaura_v2.items (is_sold);

-- Add comments for documentation
COMMENT ON COLUMN lootaura_v2.sales.tags IS 'Array of category tags for the sale';
COMMENT ON COLUMN lootaura_v2.sales.description IS 'Detailed description of the sale';
COMMENT ON COLUMN lootaura_v2.sales.address IS 'Street address of the sale';
COMMENT ON COLUMN lootaura_v2.sales.privacy_mode IS 'Privacy setting for the sale';
COMMENT ON COLUMN lootaura_v2.sales.is_featured IS 'Whether this sale is featured';
