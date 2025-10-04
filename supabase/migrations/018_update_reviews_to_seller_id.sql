-- Update reviews system to use seller_id instead of owner_id
-- This provides a stable identifier that won't change if user updates username

-- First, ensure the dual-link columns exist (from migration 017)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Check if owner_id column exists before renaming
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE reviews RENAME COLUMN owner_id TO seller_id;
    END IF;
END $$;

-- Populate existing reviews with address and owner_id data
UPDATE reviews 
SET 
  address = ys.address,
  owner_id = ys.owner_id
FROM yard_sales ys 
WHERE reviews.sale_id = ys.id
  AND reviews.address IS NULL;

-- Update the unique constraint to use seller_id
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_address_owner_user_unique;

ALTER TABLE reviews 
ADD CONSTRAINT reviews_address_seller_user_unique 
UNIQUE (address, seller_id, user_id);

-- Update the index to use seller_id
DROP INDEX IF EXISTS idx_reviews_address_owner;
CREATE INDEX IF NOT EXISTS idx_reviews_address_seller ON reviews (address, seller_id);

-- Update the get_sale_rating function to use seller_id
CREATE OR REPLACE FUNCTION get_sale_rating(sale_uuid uuid)
RETURNS TABLE (
  average_rating numeric,
  total_reviews bigint
) AS $$
BEGIN
  -- Check if yard_sales table exists and has owner_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'yard_sales' AND column_name = 'owner_id'
  ) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    ROUND(AVG(r.rating)::numeric, 2) as average_rating,
    COUNT(*) as total_reviews
  FROM reviews r
  JOIN yard_sales ys ON r.sale_id = ys.id
  WHERE r.address = (SELECT address FROM yard_sales WHERE id = sale_uuid)
    AND r.seller_id = (SELECT owner_id FROM yard_sales WHERE id = sale_uuid);
END;
$$ LANGUAGE plpgsql;

-- Update the get_user_review function to use seller_id
CREATE OR REPLACE FUNCTION get_user_review(sale_uuid uuid, user_uuid uuid)
RETURNS TABLE (
  id uuid,
  rating integer,
  comment text,
  created_at timestamptz
) AS $$
BEGIN
  -- Check if yard_sales table exists and has owner_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'yard_sales' AND column_name = 'owner_id'
  ) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    r.id,
    r.rating,
    r.comment,
    r.created_at
  FROM reviews r
  JOIN yard_sales ys ON r.sale_id = ys.id
  WHERE r.address = (SELECT address FROM yard_sales WHERE id = sale_uuid)
    AND r.seller_id = (SELECT owner_id FROM yard_sales WHERE id = sale_uuid)
    AND r.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update the get_address_owner_reviews function to use seller_id
CREATE OR REPLACE FUNCTION get_address_seller_reviews(sale_uuid uuid)
RETURNS TABLE (
  id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  user_id uuid
) AS $$
BEGIN
  -- Check if yard_sales table exists and has owner_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'yard_sales' AND column_name = 'owner_id'
  ) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    r.user_id
  FROM reviews r
  WHERE r.address = (SELECT address FROM yard_sales WHERE id = sale_uuid)
    AND r.seller_id = (SELECT owner_id FROM yard_sales WHERE id = sale_uuid)
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;
