-- Add sales to the correct 'sales' table (not 'yard_sales')
-- Based on the admin tools showing 'sales' table exists

-- First, let's check what columns exist in the sales table
DO $$
DECLARE
    column_count integer;
BEGIN
    SELECT COUNT(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_name = 'sales' AND table_schema = 'public';
    
    RAISE NOTICE 'Sales table has % columns', column_count;
    
    -- Show all columns
    FOR rec IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sales' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % (%)', rec.column_name, rec.data_type;
    END LOOP;
END $$;

-- Try to insert sales with basic required fields
-- We'll use a minimal approach and let the database tell us what's missing
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
    status
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
    'published'
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
    'published'
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
    'published'
)
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
DO $$
DECLARE
    new_count integer;
BEGIN
    SELECT COUNT(*) INTO new_count FROM sales;
    RAISE NOTICE 'Total sales count: %', new_count;
    
    -- Show sample data
    FOR rec IN SELECT id, title, city, lat, lng FROM sales LIMIT 3 LOOP
        RAISE NOTICE 'Sale: % - % (%) at %,%', rec.id, rec.title, rec.city, rec.lat, rec.lng;
    END LOOP;
END $$;
