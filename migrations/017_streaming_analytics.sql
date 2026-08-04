-- Streaming view counts and play event analytics for video_assets

ALTER TABLE video_assets
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS video_play_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES video_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    watch_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_play_events_video_id ON video_play_events(video_id);
CREATE INDEX IF NOT EXISTS idx_video_play_events_user_id ON video_play_events(user_id);
CREATE INDEX IF NOT EXISTS idx_video_play_events_created_at ON video_play_events(created_at DESC);

ALTER TABLE video_play_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all play events" ON video_play_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

COMMENT ON COLUMN video_assets.view_count IS 'Total number of play starts for this video';
COMMENT ON TABLE video_play_events IS 'Individual play sessions for streaming analytics';

CREATE OR REPLACE FUNCTION increment_video_view_count(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE video_assets
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
