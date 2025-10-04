-- Dual-link reviews system: Link reviews to both address and owner_id
-- This ensures reviews are shared only between sales at the same address by the same user
-- Multiple users at the same address will have separate review systems

-- Add new columns to reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for the dual-link query performance
CREATE INDEX IF NOT EXISTS idx_reviews_address_owner ON reviews (address, owner_id);

-- Update existing reviews to populate the new fields
-- This will link existing reviews to their sale's address and owner
UPDATE reviews 
SET 
  address = ys.address,
  owner_id = ys.owner_id
FROM yard_sales ys 
WHERE reviews.sale_id = ys.id;

-- Create a new unique constraint for the dual-link system
-- This ensures one review per user per address-owner combination
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_sale_id_user_id_key;

ALTER TABLE reviews 
ADD CONSTRAINT reviews_address_owner_user_unique 
UNIQUE (address, owner_id, user_id);

-- Update the get_sale_rating function to use dual-link
CREATE OR REPLACE FUNCTION get_sale_rating(sale_uuid uuid)
RETURNS TABLE (
  average_rating numeric,
  total_reviews bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(r.rating)::numeric, 2) as average_rating,
    COUNT(*) as total_reviews
  FROM reviews r
  JOIN yard_sales ys ON r.sale_id = ys.id
  WHERE r.address = (SELECT address FROM yard_sales WHERE id = sale_uuid)
    AND r.owner_id = (SELECT owner_id FROM yard_sales WHERE id = sale_uuid);
END;
$$ LANGUAGE plpgsql;

-- Update the get_user_review function to use dual-link
CREATE OR REPLACE FUNCTION get_user_review(sale_uuid uuid, user_uuid uuid)
RETURNS TABLE (
  id uuid,
  rating integer,
  comment text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.rating,
    r.comment,
    r.created_at
  FROM reviews r
  JOIN yard_sales ys ON r.sale_id = ys.id
  WHERE r.address = (SELECT address FROM yard_sales WHERE id = sale_uuid)
    AND r.owner_id = (SELECT owner_id FROM yard_sales WHERE id = sale_uuid)
    AND r.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all reviews for an address-owner combination
CREATE OR REPLACE FUNCTION get_address_owner_reviews(sale_uuid uuid)
RETURNS TABLE (
  id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    r.user_id
  FROM reviews r
  WHERE r.address = (SELECT address FROM yard_sales WHERE id = sale_uuid)
    AND r.owner_id = (SELECT owner_id FROM yard_sales WHERE id = sale_uuid)
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;
