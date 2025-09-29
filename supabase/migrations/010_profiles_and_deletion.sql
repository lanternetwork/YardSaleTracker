-- supabase/migrations/010_profiles_and_deletion.sql

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    home_zip text,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can select/insert/update their own profile
CREATE POLICY IF NOT EXISTS "Users can manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = user_id);

-- Create account_deletion_requests table if not exists
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at timestamptz DEFAULT now(),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'canceled', 'completed'))
);

-- Enable RLS on account_deletion_requests
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can manage their own deletion requests
CREATE POLICY IF NOT EXISTS "Users can manage their own deletion requests" ON public.account_deletion_requests
    FOR ALL USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id ON public.account_deletion_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON public.account_deletion_requests (status);

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profile information and preferences';
COMMENT ON COLUMN public.profiles.display_name IS 'User display name for public-facing areas';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image';
COMMENT ON COLUMN public.profiles.home_zip IS 'User home ZIP code for default location';
COMMENT ON COLUMN public.profiles.preferences IS 'JSON object storing user preferences (privacy_mode, default_radius, etc.)';

COMMENT ON TABLE public.account_deletion_requests IS 'Tracks user requests for account deletion';
COMMENT ON COLUMN public.account_deletion_requests.status IS 'Deletion request status: pending, canceled, or completed';
