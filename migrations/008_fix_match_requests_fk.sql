-- Fix foreign key relationship for match_requests to allow joining with profiles
-- Currently it references auth.users, but we need it to reference profiles for the .select('*, profiles(*)') to work

-- We first try to drop the existing constraint if it conflicts (though usually we just add a new one or alter)
-- However, to be safe and enable the join, we add a foreign key to profiles.

ALTER TABLE match_requests
DROP CONSTRAINT IF EXISTS match_requests_user_id_fkey; -- Drop old ref to auth.users if needed, or just add new one. 
-- Actually, keeping ref to auth.users is fine for auth integrity, but for PostgREST join we need ref to profiles.
-- Let's add a specific FK for profiles.

ALTER TABLE match_requests
ADD CONSTRAINT match_requests_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;
