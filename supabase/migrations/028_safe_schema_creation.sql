-- Safe schema creation that handles existing tables
-- This migration will add missing columns and create missing tables

-- First, let's check what tables exist and what columns they have
DO $$
DECLARE
    table_exists boolean;
    column_exists boolean;
BEGIN
    -- Check if sales table exists and what columns it has
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sales'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Sales table exists, checking columns...';
        
        -- Check if owner_id column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'sales' 
            AND column_name = 'owner_id'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            RAISE NOTICE 'Adding owner_id column to sales table...';
            ALTER TABLE sales ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        -- Check if other missing columns exist and add them
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'created_at') THEN
            ALTER TABLE sales ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'updated_at') THEN
            ALTER TABLE sales ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'status') THEN
            ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled'));
        END IF;
        
    ELSE
        RAISE NOTICE 'Sales table does not exist, creating it...';
        CREATE TABLE sales (
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
    END IF;
END $$;

-- Create profiles table if it doesn't exist
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

-- Create items table if it doesn't exist
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

-- Create favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, sale_id)
);

-- Create reviews table if it doesn't exist
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

-- Create indexes for performance (only if they don't exist)
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

-- Enable Row Level Security (only if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_class WHERE relname = 'profiles' AND relrowsecurity = true) THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_class WHERE relname = 'sales' AND relrowsecurity = true) THEN
        ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_class WHERE relname = 'items' AND relrowsecurity = true) THEN
        ALTER TABLE items ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_class WHERE relname = 'favorites' AND relrowsecurity = true) THEN
        ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_class WHERE relname = 'reviews' AND relrowsecurity = true) THEN
        ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
    -- Profiles policies
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view all profiles') THEN
        CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    
    -- Sales policies
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Anyone can view published sales') THEN
        CREATE POLICY "Anyone can view published sales" ON sales FOR SELECT USING (status = 'published' OR status = 'active');
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can view own sales') THEN
        CREATE POLICY "Users can view own sales" ON sales FOR SELECT USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can insert own sales') THEN
        CREATE POLICY "Users can insert own sales" ON sales FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can update own sales') THEN
        CREATE POLICY "Users can update own sales" ON sales FOR UPDATE USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can delete own sales') THEN
        CREATE POLICY "Users can delete own sales" ON sales FOR DELETE USING (auth.uid() = owner_id);
    END IF;
    
    -- Items policies
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'items' AND policyname = 'Anyone can view items for published sales') THEN
        CREATE POLICY "Anyone can view items for published sales" ON items FOR SELECT USING (
            EXISTS (SELECT 1 FROM sales WHERE sales.id = items.sale_id AND (sales.status = 'published' OR sales.status = 'active'))
        );
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'items' AND policyname = 'Users can manage items for own sales') THEN
        CREATE POLICY "Users can manage items for own sales" ON items FOR ALL USING (
            EXISTS (SELECT 1 FROM sales WHERE sales.id = items.sale_id AND sales.owner_id = auth.uid())
        );
    END IF;
    
    -- Favorites policies
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'favorites' AND policyname = 'Users can view own favorites') THEN
        CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'favorites' AND policyname = 'Users can manage own favorites') THEN
        CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    -- Reviews policies
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can view reviews') THEN
        CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can insert reviews') THEN
        CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can update own reviews') THEN
        CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can delete own reviews') THEN
        CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add test sales data (only if no sales exist)
DO $$
DECLARE
    sales_count integer;
BEGIN
    SELECT COUNT(*) INTO sales_count FROM sales;
    
    IF sales_count = 0 THEN
        RAISE NOTICE 'No sales found, adding test data...';
        
        -- Create a dummy user if it doesn't exist
        INSERT INTO auth.users (id, email, encrypted_password, confirmed_at, instance_id, aud, role, created_at, updated_at)
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            'test@example.com',
            'dummy_encrypted_password',
            NOW(),
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Add test sales
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
        
        RAISE NOTICE 'Test sales data added successfully!';
    ELSE
        RAISE NOTICE 'Sales already exist (%), skipping test data insertion', sales_count;
    END IF;
END $$;

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
    
    RAISE NOTICE 'Schema creation completed!';
    RAISE NOTICE 'Sales: %, Profiles: %, Items: %, Favorites: %, Reviews: %', 
        sales_count, profiles_count, items_count, favorites_count, reviews_count;
END $$;
