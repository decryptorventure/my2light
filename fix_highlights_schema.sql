-- Add title and description columns to highlights table if they don't exist
alter table highlights 
add column if not exists title text default 'Highlight mới',
add column if not exists description text default '';

-- Refresh the schema cache (sometimes needed for Supabase/PostgREST)
notify pgrst, 'reload schema';
