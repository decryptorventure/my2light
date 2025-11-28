-- Migration 011: Fix trigger duration column
-- Fixes "record 'new' has no field 'duration'" error
-- The highlights table has 'duration_sec', but the trigger was trying to access 'duration'

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
                'duration', NEW.duration_sec  -- Fixed: duration -> duration_sec
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
