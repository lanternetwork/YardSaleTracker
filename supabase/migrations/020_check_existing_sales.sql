-- Check what sales data currently exists in the database
-- This will help us understand the current state

-- Check total sales count
SELECT 'Total sales in yard_sales table:' as info, COUNT(*) as count FROM yard_sales;

-- Check sales by status
SELECT 'Sales by status:' as info, status, COUNT(*) as count 
FROM yard_sales 
GROUP BY status;

-- Check sales by city
SELECT 'Sales by city:' as info, city, state, COUNT(*) as count 
FROM yard_sales 
GROUP BY city, state 
ORDER BY count DESC;

-- Check sales with coordinates
SELECT 'Sales with coordinates:' as info, COUNT(*) as count 
FROM yard_sales 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Check sales in Los Angeles area (within 50 miles)
SELECT 'Sales near Los Angeles (34.0522, -118.2437):' as info, COUNT(*) as count
FROM yard_sales 
WHERE lat IS NOT NULL AND lng IS NOT NULL
  AND (
    6371 * acos(
      cos(radians(34.0522)) * cos(radians(lat)) * 
      cos(radians(lng) - radians(-118.2437)) + 
      sin(radians(34.0522)) * sin(radians(lat))
  ) <= 80.467; -- 50 miles in km

-- Show sample sales data
SELECT 'Sample sales data:' as info, id, title, city, state, lat, lng, status, created_at
FROM yard_sales 
ORDER BY created_at DESC 
LIMIT 10;
