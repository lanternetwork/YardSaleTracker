-- Debug database state to understand why no sales are being returned
-- This will help us identify if the issue is with data, views, or permissions

-- Check if yard_sales table exists and has data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'yard_sales') THEN
        RAISE NOTICE 'yard_sales table exists';
        RAISE NOTICE 'Total rows in yard_sales: %', (SELECT COUNT(*) FROM yard_sales);
        RAISE NOTICE 'Published sales: %', (SELECT COUNT(*) FROM yard_sales WHERE status = 'published');
        RAISE NOTICE 'Sales with coordinates: %', (SELECT COUNT(*) FROM yard_sales WHERE lat IS NOT NULL AND lng IS NOT NULL);
    ELSE
        RAISE NOTICE 'yard_sales table does not exist';
    END IF;
END $$;

-- Check if sales_v2 view exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'sales_v2') THEN
        RAISE NOTICE 'sales_v2 view exists';
        RAISE NOTICE 'Total rows in sales_v2: %', (SELECT COUNT(*) FROM sales_v2);
    ELSE
        RAISE NOTICE 'sales_v2 view does not exist';
    END IF;
END $$;

-- Check if we have any users (needed for test data)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        RAISE NOTICE 'Users exist in auth.users';
        RAISE NOTICE 'User count: %', (SELECT COUNT(*) FROM auth.users);
    ELSE
        RAISE NOTICE 'No users in auth.users - this will prevent test data insertion';
    END IF;
END $$;

-- Show sample data if it exists
SELECT 'Sample yard_sales data:' as info, id, title, city, state, lat, lng, status, created_at
FROM yard_sales 
ORDER BY created_at DESC 
LIMIT 3;
