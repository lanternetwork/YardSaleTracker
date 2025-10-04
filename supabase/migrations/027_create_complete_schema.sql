-- Create the complete database schema
-- This will create all the missing tables with proper structure

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

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    date_start DATE,
    time_start TIME,
    date_end DATE,
    time_end TIME,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    category TEXT,
    condition TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, sale_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    address TEXT,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_location ON sales(lat, lng);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_owner ON sales(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_dates ON sales(date_start, date_end);
CREATE INDEX IF NOT EXISTS idx_items_sale ON items(sale_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_sale ON favorites(sale_id);
CREATE INDEX IF NOT EXISTS idx_reviews_sale ON reviews(sale_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_address_seller ON reviews(address, seller_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for sales
CREATE POLICY "Anyone can view published sales" ON sales FOR SELECT USING (status = 'published' OR status = 'active');
CREATE POLICY "Users can view own sales" ON sales FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own sales" ON sales FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own sales" ON sales FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own sales" ON sales FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for items
CREATE POLICY "Anyone can view items for published sales" ON items FOR SELECT USING (
    EXISTS (SELECT 1 FROM sales WHERE sales.id = items.sale_id AND (sales.status = 'published' OR sales.status = 'active'))
);
CREATE POLICY "Users can manage items for own sales" ON items FOR ALL USING (
    EXISTS (SELECT 1 FROM sales WHERE sales.id = items.sale_id AND sales.owner_id = auth.uid())
);

-- Create RLS policies for favorites
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for reviews
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Add some test sales data
INSERT INTO sales (
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
    owner_id
) VALUES 
(
    'Echo Park Vintage Sale',
    'Amazing vintage furniture and electronics in Echo Park!',
    '1234 Sunset Blvd, Los Angeles, CA 90026',
    'Los Angeles',
    'CA',
    34.0778,
    -118.2606,
    '2025-01-15',
    '08:00:00',
    '2025-01-15',
    '14:00:00',
    'published',
    '00000000-0000-0000-0000-000000000000'
),
(
    'Silver Lake Community Sale',
    'Community yard sale with great deals in Silver Lake!',
    '5678 Silver Lake Blvd, Los Angeles, CA 90039',
    'Los Angeles',
    'CA',
    34.0938,
    -118.2718,
    '2025-01-16',
    '09:00:00',
    '2025-01-16',
    '15:00:00',
    'published',
    '00000000-0000-0000-0000-000000000000'
),
(
    'Hollywood Hills Estate Sale',
    'High-end furniture and designer items in Hollywood Hills!',
    '9876 Mulholland Dr, Los Angeles, CA 90046',
    'Los Angeles',
    'CA',
    34.1344,
    -118.3215,
    '2025-01-17',
    '10:00:00',
    '2025-01-17',
    '16:00:00',
    'published',
    '00000000-0000-0000-0000-000000000000'
),
(
    'Venice Beach Vintage Sale',
    'Unique vintage clothing and art in Venice Beach!',
    '1301 Ocean Front Walk, Los Angeles, CA 90291',
    'Los Angeles',
    'CA',
    33.9900,
    -118.4700,
    '2025-01-18',
    '10:00:00',
    '2025-01-18',
    '17:00:00',
    'published',
    '00000000-0000-0000-0000-000000000000'
),
(
    'Santa Monica Family Sale',
    'Kids toys and baby gear in Santa Monica!',
    '200 Santa Monica Pier, Santa Monica, CA 90401',
    'Santa Monica',
    'CA',
    34.0080,
    -118.4970,
    '2025-01-19',
    '09:00:00',
    '2025-01-19',
    '13:00:00',
    'published',
    '00000000-0000-0000-0000-000000000000'
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
