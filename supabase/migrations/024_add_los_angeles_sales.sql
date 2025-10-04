-- Add sales specifically in Los Angeles area
-- This will ensure sales appear for users in Los Angeles

INSERT INTO yard_sales (
    id,
    title,
    address,
    city,
    state,
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
    '44444444-4444-4444-4444-444444444444',
    'Echo Park Vintage Sale',
    '1234 Sunset Blvd, Los Angeles, CA 90026',
    'Los Angeles',
    'CA',
    34.0778,
    -118.2606,
    '2025-01-15',
    '08:00:00',
    '2025-01-15',
    '14:00:00',
    'Amazing vintage furniture and electronics in Echo Park!',
    ARRAY['vintage', 'furniture', 'electronics'],
    '00000000-0000-0000-0000-000000000000',
    'published',
    NOW(),
    NOW()
),
(
    '55555555-5555-5555-5555-555555555555',
    'Silver Lake Community Sale',
    '5678 Silver Lake Blvd, Los Angeles, CA 90039',
    'Los Angeles',
    'CA',
    34.0938,
    -118.2718,
    '2025-01-16',
    '09:00:00',
    '2025-01-16',
    '15:00:00',
    'Community yard sale with great deals in Silver Lake!',
    ARRAY['community', 'toys', 'clothing'],
    '00000000-0000-0000-0000-000000000000',
    'published',
    NOW(),
    NOW()
),
(
    '66666666-6666-6666-6666-666666666666',
    'Hollywood Hills Estate Sale',
    '9876 Mulholland Dr, Los Angeles, CA 90046',
    'Los Angeles',
    'CA',
    34.1344,
    -118.3215,
    '2025-01-17',
    '10:00:00',
    '2025-01-17',
    '16:00:00',
    'High-end furniture and designer items in Hollywood Hills!',
    ARRAY['furniture', 'art', 'designer'],
    '00000000-0000-0000-0000-000000000000',
    'published',
    NOW(),
    NOW()
),
(
    '77777777-7777-7777-7777-777777777777',
    'Venice Beach Vintage Sale',
    '1301 Ocean Front Walk, Los Angeles, CA 90291',
    'Los Angeles',
    'CA',
    33.9900,
    -118.4700,
    '2025-01-18',
    '10:00:00',
    '2025-01-18',
    '17:00:00',
    'Unique vintage clothing and art in Venice Beach!',
    ARRAY['vintage clothing', 'art', 'handmade'],
    '00000000-0000-0000-0000-000000000000',
    'published',
    NOW(),
    NOW()
),
(
    '88888888-8888-8888-8888-888888888888',
    'Santa Monica Family Sale',
    '200 Santa Monica Pier, Santa Monica, CA 90401',
    'Santa Monica',
    'CA',
    34.0080,
    -118.4970,
    '2025-01-19',
    '09:00:00',
    '2025-01-19',
    '13:00:00',
    'Kids toys and baby gear in Santa Monica!',
    ARRAY['kids', 'baby', 'household'],
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
    la_count integer;
BEGIN
    SELECT COUNT(*) INTO new_count FROM yard_sales;
    SELECT COUNT(*) INTO la_count FROM yard_sales WHERE city = 'Los Angeles' OR city = 'Santa Monica';
    RAISE NOTICE 'Total sales count: %', new_count;
    RAISE NOTICE 'Los Angeles area sales: %', la_count;
    
    -- Show sample LA data
    FOR rec IN SELECT id, title, city, lat, lng FROM yard_sales WHERE city = 'Los Angeles' OR city = 'Santa Monica' LIMIT 3 LOOP
        RAISE NOTICE 'LA Sale: % - % (%) at %,%', rec.id, rec.title, rec.city, rec.lat, rec.lng;
    END LOOP;
END $$;
