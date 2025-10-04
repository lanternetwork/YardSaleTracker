-- Check the actual database schema to understand the table structure
-- This will help us identify the correct table names and columns

-- Check what tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check the structure of the 'sales' table (if it exists)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sales' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any existing sales
SELECT COUNT(*) as sales_count FROM sales;

-- Show sample data if any exists
SELECT * FROM sales LIMIT 3;
