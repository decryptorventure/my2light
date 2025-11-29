-- =====================================================
-- Fix Community Feed RLS Policy
-- Allow users to view all public activities
-- =====================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view relevant activities" ON player_activities;

-- Create a new policy that allows viewing all activities
-- This enables a true "global" community feed
CREATE POLICY "Users can view all activities"
    ON player_activities FOR SELECT
    USING (true);

-- Note: If you want to add privacy controls later, you can:
-- 1. Add an is_public column to player_activities
-- 2. Update the policy to: USING (is_public = true OR auth.uid() = user_id)
