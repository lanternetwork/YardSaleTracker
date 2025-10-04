-- Emergency test data insertion
-- This will add test sales directly to the yard_sales table

-- First, let's check if we have any existing data
DO $$
DECLARE
    existing_count integer;
BEGIN
    SELECT COUNT(*) INTO existing_count FROM yard_sales;
    RAISE NOTICE 'Existing sales count: %', existing_count;
END $$;

-- Insert test sales directly into yard_sales table
INSERT INTO yard_sales (
    id,
    title,
    address,
    city,
    state,
    zip_code,
    lat,
    lng,
    date_start,
    time_start,
    date_end,
    time_end,
    description,
    tags,
    owner_id,
    status,
    created_at,
    updated_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Test Sale 1 - Echo Park',
    '1234 Sunset Blvd, Los Angeles, CA 90026',
    'Los Angeles',
    'CA',
    '90026',
    34.0778,
    -118.2606,
    '2025-01-15',
    '08:00:00',
    '2025-01-15',
    '14:00:00',
    'Test sale for debugging',
    ARRAY['test', 'debug'],
    '00000000-0000-0000-0000-000000000000',
    'published',
    NOW(),
    NOW()
),
(
    '22222222-2222-2222-2222-222222222222',
    'Test Sale 2 - Silver Lake',
    '5678 Silver Lake Blvd, Los Angeles, CA 90039',
    'Los Angeles',
    'CA',
    '90039',
    34.0938,
    -118.2718,
    '2025-01-16',
    '09:00:00',
    '2025-01-16',
    '15:00:00',
    'Another test sale',
    ARRAY['test', 'debug'],
    '00000000-0000-0000-0000-000000000000',
    'published',
    NOW(),
    NOW()
),
(
    '33333333-3333-3333-3333-333333333333',
    'Test Sale 3 - Hollywood',
    '9876 Mulholland Dr, Los Angeles, CA 90046',
    'Los Angeles',
    'CA',
    '90046',
    34.1344,
    -118.3215,
    '2025-01-17',
    '10:00:00',
    '2025-01-17',
    '16:00:00',
    'Third test sale',
    ARRAY['test', 'debug'],
    '00000000-0000-0000-0000-000000000000',
    'published',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted
DO $$
DECLARE
    new_count integer;
BEGIN
    SELECT COUNT(*) INTO new_count FROM yard_sales;
    RAISE NOTICE 'New sales count: %', new_count;
    
    -- Show sample data
    FOR rec IN SELECT id, title, city, lat, lng, status FROM yard_sales LIMIT 3 LOOP
        RAISE NOTICE 'Sale: % - % (%) at %,%', rec.id, rec.title, rec.city, rec.lat, rec.lng;
    END LOOP;
END $$;
