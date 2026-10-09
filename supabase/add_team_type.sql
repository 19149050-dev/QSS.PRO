-- Add team_type column to teams table if it doesn't exist
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS team_type VARCHAR DEFAULT 'Thầu phụ';
