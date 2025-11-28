-- Migration 010: Video Segments and Processing Jobs
-- This migration adds support for highlight marking during recording

-- Video segments table for storing marked highlights
CREATE TABLE IF NOT EXISTS video_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_session_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time INTEGER NOT NULL, -- seconds from recording start
    end_time INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    video_url TEXT, -- URL after upload
    status TEXT CHECK (status IN ('pending', 'uploaded', 'processing', 'ready', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video processing jobs for merging
CREATE TABLE IF NOT EXISTS video_processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    segment_ids UUID[] NOT NULL, -- Array of segment IDs to merge
    output_url TEXT, -- Final merged video URL
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'video_ready', 'match_found', 'booking_reminder', etc.
    title TEXT NOT NULL,
    message TEXT,
    data JSONB, -- Additional data (e.g., video URL, job ID)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_segments_user ON video_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_video_segments_session ON video_segments(recording_session_id);
CREATE INDEX IF NOT EXISTS idx_video_processing_jobs_user ON video_processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_processing_jobs_status ON video_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- RLS Policies
ALTER TABLE video_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Video segments policies
CREATE POLICY "Users can view own segments" ON video_segments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own segments" ON video_segments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own segments" ON video_segments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own segments" ON video_segments
    FOR DELETE USING (auth.uid() = user_id);

-- Processing jobs policies
CREATE POLICY "Users can view own jobs" ON video_processing_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs" ON video_processing_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);
