-- Add test sales data using only existing columns
-- This will work with whatever columns are currently in the sales table

-- First, let's see what columns we have
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales'
ORDER BY ordinal_position;

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

-- Add test sales using only the columns that exist
-- We'll use a dynamic approach to handle whatever columns are available
DO $$
DECLARE
    has_title boolean;
    has_lat boolean;
    has_lng boolean;
    has_city boolean;
    has_state boolean;
    has_status boolean;
    has_owner_id boolean;
    has_description boolean;
    has_address boolean;
    has_date_start boolean;
    has_time_start boolean;
    has_date_end boolean;
    has_time_end boolean;
    sql_text text;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'title'
    ) INTO has_title;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'lat'
    ) INTO has_lat;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'lng'
    ) INTO has_lng;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'city'
    ) INTO has_city;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'state'
    ) INTO has_state;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'status'
    ) INTO has_status;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'owner_id'
    ) INTO has_owner_id;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'description'
    ) INTO has_description;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'address'
    ) INTO has_address;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'date_start'
    ) INTO has_date_start;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'time_start'
    ) INTO has_time_start;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'date_end'
    ) INTO has_date_end;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'time_end'
    ) INTO has_time_end;
    
    RAISE NOTICE 'Column check results:';
    RAISE NOTICE 'title: %, lat: %, lng: %, city: %, state: %, status: %, owner_id: %', 
        has_title, has_lat, has_lng, has_city, has_state, has_status, has_owner_id;
    RAISE NOTICE 'description: %, address: %, date_start: %, time_start: %, date_end: %, time_end: %', 
        has_description, has_address, has_date_start, has_time_start, has_date_end, has_time_end;
    
    -- Build dynamic INSERT statement based on available columns
    sql_text := 'INSERT INTO sales (';
    
    IF has_title THEN sql_text := sql_text || 'title, '; END IF;
    IF has_description THEN sql_text := sql_text || 'description, '; END IF;
    IF has_address THEN sql_text := sql_text || 'address, '; END IF;
    IF has_city THEN sql_text := sql_text || 'city, '; END IF;
    IF has_state THEN sql_text := sql_text || 'state, '; END IF;
    IF has_lat THEN sql_text := sql_text || 'lat, '; END IF;
    IF has_lng THEN sql_text := sql_text || 'lng, '; END IF;
    IF has_date_start THEN sql_text := sql_text || 'date_start, '; END IF;
    IF has_time_start THEN sql_text := sql_text || 'time_start, '; END IF;
    IF has_date_end THEN sql_text := sql_text || 'date_end, '; END IF;
    IF has_time_end THEN sql_text := sql_text || 'time_end, '; END IF;
    IF has_status THEN sql_text := sql_text || 'status, '; END IF;
    IF has_owner_id THEN sql_text := sql_text || 'owner_id, '; END IF;
    
    -- Remove trailing comma and space
    sql_text := rtrim(sql_text, ', ');
    sql_text := sql_text || ') VALUES ';
    
    -- Add values for each test sale
    sql_text := sql_text || '(';
    IF has_title THEN sql_text := sql_text || '''Echo Park Vintage Sale'', '; END IF;
    IF has_description THEN sql_text := sql_text || '''Amazing vintage furniture and electronics!'', '; END IF;
    IF has_address THEN sql_text := sql_text || '''1234 Sunset Blvd, Los Angeles, CA 90026'', '; END IF;
    IF has_city THEN sql_text := sql_text || '''Los Angeles'', '; END IF;
    IF has_state THEN sql_text := sql_text || '''CA'', '; END IF;
    IF has_lat THEN sql_text := sql_text || '34.0778, '; END IF;
    IF has_lng THEN sql_text := sql_text || '-118.2606, '; END IF;
    IF has_date_start THEN sql_text := sql_text || '''2025-01-15'', '; END IF;
    IF has_time_start THEN sql_text := sql_text || '''08:00:00'', '; END IF;
    IF has_date_end THEN sql_text := sql_text || '''2025-01-15'', '; END IF;
    IF has_time_end THEN sql_text := sql_text || '''14:00:00'', '; END IF;
    IF has_status THEN sql_text := sql_text || '''published'', '; END IF;
    IF has_owner_id THEN sql_text := sql_text || '''00000000-0000-0000-0000-000000000000'', '; END IF;
    
    -- Remove trailing comma and space
    sql_text := rtrim(sql_text, ', ');
    sql_text := sql_text || '), (';
    
    -- Second sale
    IF has_title THEN sql_text := sql_text || '''Silver Lake Community Sale'', '; END IF;
    IF has_description THEN sql_text := sql_text || '''Community yard sale with great deals!'', '; END IF;
    IF has_address THEN sql_text := sql_text || '''5678 Silver Lake Blvd, Los Angeles, CA 90039'', '; END IF;
    IF has_city THEN sql_text := sql_text || '''Los Angeles'', '; END IF;
    IF has_state THEN sql_text := sql_text || '''CA'', '; END IF;
    IF has_lat THEN sql_text := sql_text || '34.0938, '; END IF;
    IF has_lng THEN sql_text := sql_text || '-118.2718, '; END IF;
    IF has_date_start THEN sql_text := sql_text || '''2025-01-16'', '; END IF;
    IF has_time_start THEN sql_text := sql_text || '''09:00:00'', '; END IF;
    IF has_date_end THEN sql_text := sql_text || '''2025-01-16'', '; END IF;
    IF has_time_end THEN sql_text := sql_text || '''15:00:00'', '; END IF;
    IF has_status THEN sql_text := sql_text || '''published'', '; END IF;
    IF has_owner_id THEN sql_text := sql_text || '''00000000-0000-0000-0000-000000000000'', '; END IF;
    
    -- Remove trailing comma and space
    sql_text := rtrim(sql_text, ', ');
    sql_text := sql_text || '), (';
    
    -- Third sale
    IF has_title THEN sql_text := sql_text || '''Hollywood Hills Estate Sale'', '; END IF;
    IF has_description THEN sql_text := sql_text || '''High-end furniture and designer items!'', '; END IF;
    IF has_address THEN sql_text := sql_text || '''9876 Mulholland Dr, Los Angeles, CA 90046'', '; END IF;
    IF has_city THEN sql_text := sql_text || '''Los Angeles'', '; END IF;
    IF has_state THEN sql_text := sql_text || '''CA'', '; END IF;
    IF has_lat THEN sql_text := sql_text || '34.1344, '; END IF;
    IF has_lng THEN sql_text := sql_text || '-118.3215, '; END IF;
    IF has_date_start THEN sql_text := sql_text || '''2025-01-17'', '; END IF;
    IF has_time_start THEN sql_text := sql_text || '''10:00:00'', '; END IF;
    IF has_date_end THEN sql_text := sql_text || '''2025-01-17'', '; END IF;
    IF has_time_end THEN sql_text := sql_text || '''16:00:00'', '; END IF;
    IF has_status THEN sql_text := sql_text || '''published'', '; END IF;
    IF has_owner_id THEN sql_text := sql_text || '''00000000-0000-0000-0000-000000000000'', '; END IF;
    
    -- Remove trailing comma and space
    sql_text := rtrim(sql_text, ', ');
    sql_text := sql_text || ');';
    
    RAISE NOTICE 'Generated SQL: %', sql_text;
    
    -- Execute the dynamic SQL
    EXECUTE sql_text;
    
    RAISE NOTICE 'Test sales data added successfully!';
END $$;

-- Show the results
SELECT COUNT(*) as total_sales FROM sales;
SELECT id, title, city, state, lat, lng, status FROM sales LIMIT 5;
