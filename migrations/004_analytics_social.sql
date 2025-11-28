-- =====================================================
-- Migration 004: Analytics & Social Network Features
-- Version: 3.4.0
-- Date: 2025-11-28
-- Description: Add tables and columns for social network 
--              and predictive analytics features
-- =====================================================

-- =====================================================
-- 1. NEW TABLES
-- =====================================================

-- 1.1 Player Connections (Follow/Friend System)
-- =====================================================
CREATE TABLE IF NOT EXISTS player_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    message TEXT, -- Optional message when sending request
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate connections
    UNIQUE(requester_id, receiver_id),
    
    -- Prevent self-connections
    CHECK (requester_id != receiver_id)
);

COMMENT ON TABLE player_connections IS 'Player follow/friend relationships';
COMMENT ON COLUMN player_connections.status IS 'pending: waiting for approval, accepted: active connection, declined: rejected, blocked: user blocked';

-- 1.2 Highlight Interactions (Likes, Views, Shares)
-- =====================================================
CREATE TABLE IF NOT EXISTS highlight_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'view', 'share')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One interaction per user per highlight per type
    UNIQUE(highlight_id, user_id, interaction_type)
);

COMMENT ON TABLE highlight_interactions IS 'Track user interactions with highlights (likes, views, shares)';

-- 1.3 Highlight Comments
-- =====================================================
CREATE TABLE IF NOT EXISTS highlight_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    parent_id UUID REFERENCES highlight_comments(id) ON DELETE CASCADE, -- For nested replies
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (char_length(comment) > 0 AND char_length(comment) <= 500)
);

COMMENT ON TABLE highlight_comments IS 'Comments on highlights with support for nested replies';
COMMENT ON COLUMN highlight_comments.parent_id IS 'NULL for top-level comments, points to parent comment for replies';

-- 1.4 Player Activities (Activity Feed)
-- =====================================================
CREATE TABLE IF NOT EXISTS player_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('highlight_posted', 'match_completed', 'badge_unlocked', 'new_connection', 'court_review')),
    metadata JSONB, -- Flexible field for activity-specific data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE player_activities IS 'Activity feed entries for social features';
COMMENT ON COLUMN player_activities.metadata IS 'JSON structure varies by activity_type. Examples: {highlight_id, court_id, badge_name, connection_user_id}';

-- 1.5 Analytics Cache (Performance Optimization)
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES court_owners(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'revenue', 'occupancy', 'customer_insights', etc.
    date DATE NOT NULL,
    value JSONB NOT NULL, -- Cached computed values
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(owner_id, metric_type, date)
);

COMMENT ON TABLE analytics_cache IS 'Cache expensive analytics computations for performance';
COMMENT ON COLUMN analytics_cache.value IS 'Pre-computed analytics data in JSON format';

-- =====================================================
-- 2. ALTER EXISTING TABLES
-- =====================================================

-- 2.1 Add social columns to highlights
-- =====================================================
ALTER TABLE highlights 
    ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

COMMENT ON COLUMN highlights.likes_count IS 'Denormalized count for performance';
COMMENT ON COLUMN highlights.views_count IS 'Denormalized count for performance';
COMMENT ON COLUMN highlights.shares_count IS 'Denormalized count for performance';
COMMENT ON COLUMN highlights.comments_count IS 'Denormalized count for performance';
COMMENT ON COLUMN highlights.is_public IS 'If false, only visible to owner';

-- 2.2 Add social columns to profiles
-- =====================================================
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
    ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'connections', 'private')),
    ADD COLUMN IF NOT EXISTS show_stats BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN profiles.skill_level IS 'Player skill level for matching';
COMMENT ON COLUMN profiles.profile_visibility IS 'public: anyone can view, connections: only connections, private: only me';
COMMENT ON COLUMN profiles.show_stats IS 'Whether to show playing stats on public profile';
COMMENT ON COLUMN profiles.bio IS 'Short bio/description (max 200 chars)';
COMMENT ON COLUMN profiles.followers_count IS 'Denormalized count for performance';
COMMENT ON COLUMN profiles.following_count IS 'Denormalized count for performance';

ALTER TABLE profiles
    ADD CONSTRAINT bio_length CHECK (bio IS NULL OR char_length(bio) <= 200);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Connections indexes
CREATE INDEX IF NOT EXISTS idx_connections_requester ON player_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON player_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON player_connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_created ON player_connections(created_at DESC);

-- Interactions indexes
CREATE INDEX IF NOT EXISTS idx_interactions_highlight ON highlight_interactions(highlight_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON highlight_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON highlight_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON highlight_interactions(created_at DESC);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_highlight ON highlight_comments(highlight_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON highlight_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON highlight_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON highlight_comments(created_at DESC);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_user ON player_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON player_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON player_activities(created_at DESC);

-- Analytics cache indexes
CREATE INDEX IF NOT EXISTS idx_analytics_owner ON analytics_cache(owner_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_type ON analytics_cache(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_cache(date DESC);

-- Profiles indexes for social features
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_skill_level ON profiles(skill_level);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- 4.1 Player Connections Policies
-- =====================================================
ALTER TABLE player_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections (sent or received)
CREATE POLICY "Users can view their connections"
    ON player_connections FOR SELECT
    USING (
        auth.uid() = requester_id OR 
        auth.uid() = receiver_id
    );

-- Users can create connection requests (as requester)
CREATE POLICY "Users can create connection requests"
    ON player_connections FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

-- Users can update connection status if they are the receiver
CREATE POLICY "Receivers can update connection status"
    ON player_connections FOR UPDATE
    USING (auth.uid() = receiver_id);

-- Users can delete their own sent requests or received connections
CREATE POLICY "Users can delete their connections"
    ON player_connections FOR DELETE
    USING (
        auth.uid() = requester_id OR 
        auth.uid() = receiver_id
    );

-- 4.2 Highlight Interactions Policies
-- =====================================================
ALTER TABLE highlight_interactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view interactions on public highlights
CREATE POLICY "Anyone can view interactions on public highlights"
    ON highlight_interactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM highlights 
            WHERE id = highlight_id AND is_public = true
        )
    );

-- Users can view all interactions on their own highlights
CREATE POLICY "Owners can view all interactions on their highlights"
    ON highlight_interactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM highlights 
            WHERE id = highlight_id AND user_id = auth.uid()
        )
    );

-- Authenticated users can create interactions
CREATE POLICY "Authenticated users can create interactions"
    ON highlight_interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interactions
CREATE POLICY "Users can delete their own interactions"
    ON highlight_interactions FOR DELETE
    USING (auth.uid() = user_id);

-- 4.3 Highlight Comments Policies
-- =====================================================
ALTER TABLE highlight_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments on public highlights
CREATE POLICY "Anyone can view comments on public highlights"
    ON highlight_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM highlights 
            WHERE id = highlight_id AND is_public = true
        )
    );

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
    ON highlight_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments (edit)
CREATE POLICY "Users can update their own comments"
    ON highlight_comments FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
    ON highlight_comments FOR DELETE
    USING (auth.uid() = user_id);

-- 4.4 Player Activities Policies
-- =====================================================
ALTER TABLE player_activities ENABLE ROW LEVEL SECURITY;

-- Users can view activities from their connections and their own
CREATE POLICY "Users can view relevant activities"
    ON player_activities FOR SELECT
    USING (
        -- Own activities
        auth.uid() = user_id OR
        -- Activities from people they follow
        EXISTS (
            SELECT 1 FROM player_connections
            WHERE requester_id = auth.uid() 
            AND receiver_id = user_id 
            AND status = 'accepted'
        )
    );

-- System can insert activities (will use service role)
-- Users cannot directly insert activities (handled by triggers/functions)

-- 4.5 Analytics Cache Policies
-- =====================================================
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- Court owners can view their own analytics cache
CREATE POLICY "Owners can view their analytics cache"
    ON analytics_cache FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM court_owners
            WHERE id = owner_id 
            AND profile_id = auth.uid()
        )
    );

-- System manages cache (service role only)
-- No direct user manipulation

-- =====================================================
-- 5. FUNCTIONS & TRIGGERS
-- =====================================================

-- 5.1 Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_player_connections_updated_at
    BEFORE UPDATE ON player_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlight_comments_updated_at
    BEFORE UPDATE ON highlight_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_cache_updated_at
    BEFORE UPDATE ON analytics_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5.2 Update follower counts
-- =====================================================
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'accepted') OR 
       (TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted') THEN
        -- Increment following count for requester
        UPDATE profiles SET following_count = following_count + 1 
        WHERE id = NEW.requester_id;
        
        -- Increment followers count for receiver
        UPDATE profiles SET followers_count = followers_count + 1 
        WHERE id = NEW.receiver_id;
        
    ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status != 'accepted') OR
          (TG_OP = 'DELETE' AND OLD.status = 'accepted') THEN
        -- Decrement following count for requester
        UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) 
        WHERE id = COALESCE(NEW.requester_id, OLD.requester_id);
        
        -- Decrement followers count for receiver
        UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) 
        WHERE id = COALESCE(NEW.receiver_id, OLD.receiver_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_follower_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON player_connections
    FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- 5.3 Update highlight interaction counts
-- =====================================================
CREATE OR REPLACE FUNCTION update_highlight_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.interaction_type = 'like' THEN
            UPDATE highlights SET likes_count = likes_count + 1 WHERE id = NEW.highlight_id;
        ELSIF NEW.interaction_type = 'view' THEN
            UPDATE highlights SET views_count = views_count + 1 WHERE id = NEW.highlight_id;
        ELSIF NEW.interaction_type = 'share' THEN
            UPDATE highlights SET shares_count = shares_count + 1 WHERE id = NEW.highlight_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.interaction_type = 'like' THEN
            UPDATE highlights SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.highlight_id;
        ELSIF OLD.interaction_type = 'view' THEN
            UPDATE highlights SET views_count = GREATEST(views_count - 1, 0) WHERE id = OLD.highlight_id;
        ELSIF OLD.interaction_type = 'share' THEN
            UPDATE highlights SET shares_count = GREATEST(shares_count - 1, 0) WHERE id = OLD.highlight_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_highlight_interaction_counts_trigger
    AFTER INSERT OR DELETE ON highlight_interactions
    FOR EACH ROW EXECUTE FUNCTION update_highlight_interaction_counts();

-- 5.4 Update highlight comment counts
-- =====================================================
CREATE OR REPLACE FUNCTION update_highlight_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE highlights SET comments_count = comments_count + 1 WHERE id = NEW.highlight_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE highlights SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.highlight_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_highlight_comment_counts_trigger
    AFTER INSERT OR DELETE ON highlight_comments
    FOR EACH ROW EXECUTE FUNCTION update_highlight_comment_counts();

-- 5.5 Create activity on new highlight
-- =====================================================
CREATE OR REPLACE FUNCTION create_highlight_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_public = true THEN
        INSERT INTO player_activities (user_id, activity_type, metadata)
        VALUES (
            NEW.user_id,
            'highlight_posted',
            jsonb_build_object(
                'highlight_id', NEW.id,
                'thumbnail_url', NEW.thumbnail_url,
                'duration', NEW.duration
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_highlight_activity_trigger
    AFTER INSERT ON highlights
    FOR EACH ROW EXECUTE FUNCTION create_highlight_activity();

-- 5.6 Create activity on new connection
-- =====================================================
CREATE OR REPLACE FUNCTION create_connection_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR OLD.status != 'accepted') THEN
        -- Create activity for requester
        INSERT INTO player_activities (user_id, activity_type, metadata)
        VALUES (
            NEW.requester_id,
            'new_connection',
            jsonb_build_object(
                'connection_user_id', NEW.receiver_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_connection_activity_trigger
    AFTER INSERT OR UPDATE ON player_connections
    FOR EACH ROW EXECUTE FUNCTION create_connection_activity();

-- =====================================================
-- 6. CLEANUP & OPTIMIZATION
-- =====================================================

-- Re-analyze tables for query planner
ANALYZE player_connections;
ANALYZE highlight_interactions;
ANALYZE highlight_comments;
ANALYZE player_activities;
ANALYZE analytics_cache;
ANALYZE highlights;
ANALYZE profiles;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Verify all tables exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('player_connections', 'highlight_interactions', 
                              'highlight_comments', 'player_activities', 'analytics_cache')) = 5,
           'Not all new tables were created';
    
    RAISE NOTICE 'Migration 004 completed successfully!';
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
