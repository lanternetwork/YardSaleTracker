-- Wizard draft tokens for anonymous sale drafts
-- This migration is safe if table already exists

-- Create sale_draft_tokens table for secure draft token storage
CREATE TABLE IF NOT EXISTS public.sale_draft_tokens (
    sale_id uuid PRIMARY KEY REFERENCES public.yard_sales(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.sale_draft_tokens IS 'Stores hashed draft tokens for anonymous sale drafts. Only accessed by server routes with service-role.';
COMMENT ON COLUMN public.sale_draft_tokens.token_hash IS 'SHA256 hash of the draft token, never store raw tokens';
