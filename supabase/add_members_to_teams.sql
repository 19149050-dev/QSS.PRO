-- Add members column to teams table if it doesn't exist
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]'::jsonb;
