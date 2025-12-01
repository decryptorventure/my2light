-- Add highlight_events column to highlights table
ALTER TABLE highlights 
ADD COLUMN IF NOT EXISTS highlight_events JSONB DEFAULT '[]'::jsonb;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
