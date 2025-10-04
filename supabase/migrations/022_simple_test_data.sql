-- Add simple test data without depending on existing users
-- This will help verify the database connection and data flow

-- First, let's create a test user if none exists
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    last_sign_in_at,
    app_metadata,
    user_metadata,
    identities,
    factors,
    recovery_factors
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    NOW(),
    '{}',
    '{}',
    '[]',
    '[]',
    '[]'
) ON CONFLICT (email) DO NOTHING;

-- Get the test user ID
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@example.com' LIMIT 1;
    
    -- Insert test sales data
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
        gen_random_uuid(),
        'Echo Park Vintage Sale',
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
        'Amazing vintage furniture and electronics!',
        ARRAY['furniture', 'electronics', 'vintage'],
        test_user_id,
        'published',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Silver Lake Community Sale',
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
        'Community yard sale with great deals!',
        ARRAY['community', 'toys', 'clothing'],
        test_user_id,
        'published',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Hollywood Hills Estate Sale',
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
        'High-end furniture and designer items!',
        ARRAY['furniture', 'art', 'designer'],
        test_user_id,
        'published',
        NOW(),
        NOW()
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test data inserted successfully';
END $$;
