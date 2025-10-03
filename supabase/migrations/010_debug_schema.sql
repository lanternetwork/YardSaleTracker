-- Debug script to check what columns actually exist in lootaura_v2.sales
-- Run this first to see the actual table structure

-- Check if lootaura_v2 schema exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'lootaura_v2') 
    THEN 'lootaura_v2 schema exists' 
    ELSE 'lootaura_v2 schema does not exist' 
  END as schema_status;

-- Check if sales table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'lootaura_v2' AND table_name = 'sales') 
    THEN 'lootaura_v2.sales table exists' 
    ELSE 'lootaura_v2.sales table does not exist' 
  END as table_status;

-- List all columns in lootaura_v2.sales (if table exists)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'lootaura_v2' 
  AND table_name = 'sales'
ORDER BY ordinal_position;

-- Check if there are any tables in lootaura_v2 schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'lootaura_v2'
ORDER BY table_name;
