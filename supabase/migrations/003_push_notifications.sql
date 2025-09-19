-- Push notifications support
-- Run this after the performance indexes migration

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES yard_sales(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sale_id, user_id)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reviews
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users manage own reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_sale ON reviews (sale_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews (user_id);

-- Function to get average rating for a sale
CREATE OR REPLACE FUNCTION get_sale_rating(sale_uuid uuid)
RETURNS TABLE (
  average_rating numeric,
  total_reviews bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating)::numeric, 2) as average_rating,
    COUNT(*) as total_reviews
  FROM reviews 
  WHERE sale_id = sale_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's review for a sale
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
  WHERE r.sale_id = sale_uuid AND r.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;
