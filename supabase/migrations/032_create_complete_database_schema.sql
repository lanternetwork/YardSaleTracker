-- Create complete database schema from scratch
-- This will create all missing tables, indexes, RLS policies, and test data

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    home_zip TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales table (this is the main table for yard sales)
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    date_start DATE NOT NULL,
    time_start TIME,
    date_end DATE,
    time_end TIME,
    status TEXT DEFAULT 'published'::text NOT NULL,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false NOT NULL,
    CONSTRAINT sales_status_check CHECK (status IN ('published', 'draft', 'archived'))
);

-- Create items table (for individual items in sales)
CREATE TABLE IF NOT EXISTS items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    image_url TEXT
);

-- Create favorites table (for user favorites)
CREATE TABLE IF NOT EXISTS favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, sale_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    CONSTRAINT reviews_address_seller_user_unique UNIQUE (address, seller_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS sales_location_idx ON sales USING gist (ll_to_earth(lat, lng));
CREATE INDEX IF NOT EXISTS sales_owner_id_idx ON sales (owner_id);
CREATE INDEX IF NOT EXISTS sales_date_start_idx ON sales (date_start);
CREATE INDEX IF NOT EXISTS sales_status_idx ON sales (status);
CREATE INDEX IF NOT EXISTS items_sale_id_idx ON items (sale_id);
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites (user_id);
CREATE INDEX IF NOT EXISTS favorites_sale_id_idx ON favorites (sale_id);
CREATE INDEX IF NOT EXISTS reviews_sale_id_idx ON reviews (sale_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews (user_id);
CREATE INDEX IF NOT EXISTS reviews_address_seller_idx ON reviews (address, seller_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for sales
CREATE POLICY "Sales are viewable by everyone." ON sales FOR SELECT USING (true);
CREATE POLICY "Users can insert their own sales." ON sales FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own sales." ON sales FOR UPDATE USING (auth.uid() = owner_id);

-- Create RLS policies for items
CREATE POLICY "Items are viewable by everyone." ON items FOR SELECT USING (true);
CREATE POLICY "Users can insert items for their sales." ON items FOR INSERT WITH CHECK ((SELECT owner_id FROM sales WHERE id = sale_id) = auth.uid());
CREATE POLICY "Users can update items for their sales." ON items FOR UPDATE USING ((SELECT owner_id FROM sales WHERE id = sale_id) = auth.uid());

-- Create RLS policies for favorites
CREATE POLICY "Favorites are viewable by owner." ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites." ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites." ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for reviews
CREATE POLICY "Reviews are viewable by everyone." ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews." ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews." ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Create a dummy user for test data
INSERT INTO auth.users (id, email, encrypted_password, instance_id, aud, role, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'test@example.com',
    'dummy_encrypted_password',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test sales data for Los Angeles area
INSERT INTO sales (
    id,
    title,
    description,
    address,
    city,
    state,
    lat,
    lng,
    date_start,
    time_start,
    date_end,
    time_end,
    status,
    owner_id,
    tags
) VALUES 
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Echo Park Yard Sale',
    'Huge sale with vintage clothes, furniture, and electronics.',
    '1800 W Sunset Blvd',
    'Los Angeles',
    'CA',
    34.0701,
    -118.2698,
    '2025-10-26',
    '09:00:00',
    '2025-10-26',
    '15:00:00',
    'published',
    '00000000-0000-0000-0000-000000000000',
    '{"vintage", "furniture", "electronics"}'
),
(
    'b1fccb00-0d1c-4ff9-cc7e-7cc0ce491b22',
    'Silver Lake Community Sale',
    'Multiple families participating! Books, toys, home decor.',
    '2300 Hyperion Ave',
    'Los Angeles',
    'CA',
    34.1005,
    -118.2739,
    '2025-11-02',
    '08:00:00',
    '2025-11-02',
    '14:00:00',
    'published',
    '00000000-0000-0000-0000-000000000000',
    '{"books", "toys", "home decor"}'
),
(
    'c2gddc11-1e2d-5gg0-dd8f-8dd1df502c33',
    'Hollywood Hills Estate Sale',
    'High-end items, collectibles, and designer goods.',
    '8900 Sunset Blvd',
    'Los Angeles',
    'CA',
    34.0900,
    -118.3700,
    '2025-11-09',
    '10:00:00',
    '2025-11-09',
    '16:00:00',
    'published',
    '00000000-0000-0000-0000-000000000000',
    '{"collectibles", "designer", "luxury"}'
),
(
    'd3heee22-2f3e-6hh1-ee9g-9ee2eg613d44',
    'Venice Beach Vintage Sale',
    'Unique vintage clothing, art, and handcrafted items.',
    '1301 Ocean Front Walk',
    'Los Angeles',
    'CA',
    33.9900,
    -118.4700,
    '2025-11-16',
    '10:00:00',
    '2025-11-16',
    '17:00:00',
    'published',
    '00000000-0000-0000-0000-000000000000',
    '{"vintage clothing", "art", "handmade"}'
),
(
    'e4iffd33-3g4f-7ii2-ff0h-0ff3fh724e55',
    'Santa Monica Family Sale',
    'Kids toys, baby gear, and household essentials.',
    '200 Santa Monica Pier',
    'Santa Monica',
    'CA',
    34.0080,
    -118.4970,
    '2025-11-23',
    '09:00:00',
    '2025-11-23',
    '13:00:00',
    'published',
    '00000000-0000-0000-0000-000000000000',
    '{"kids", "baby", "household"}'
);

-- Verify the schema was created
DO $$
DECLARE
    sales_count integer;
    profiles_count integer;
    items_count integer;
    favorites_count integer;
    reviews_count integer;
BEGIN
    SELECT COUNT(*) INTO sales_count FROM sales;
    SELECT COUNT(*) INTO profiles_count FROM profiles;
    SELECT COUNT(*) INTO items_count FROM items;
    SELECT COUNT(*) INTO favorites_count FROM favorites;
    SELECT COUNT(*) INTO reviews_count FROM reviews;
    
    RAISE NOTICE 'Schema created successfully!';
    RAISE NOTICE 'Sales: %, Profiles: %, Items: %, Favorites: %, Reviews: %', 
        sales_count, profiles_count, items_count, favorites_count, reviews_count;
END $$;
