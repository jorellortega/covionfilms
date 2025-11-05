-- Migration: Create video_assets table for HLS streaming
-- This table stores HLS manifest URLs and video metadata for the free streaming tier

CREATE TABLE IF NOT EXISTS video_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    manifest_url TEXT NOT NULL,
    file_size BIGINT,
    duration INTEGER,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_assets_user_id ON video_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_video_assets_status ON video_assets(status);
CREATE INDEX IF NOT EXISTS idx_video_assets_created_at ON video_assets(created_at);

-- Enable RLS
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all public videos
CREATE POLICY "Allow public read access" ON video_assets
    FOR SELECT USING (true);

-- Authenticated users can insert their own videos
CREATE POLICY "Allow authenticated insert" ON video_assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own videos
CREATE POLICY "Allow authenticated update" ON video_assets
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own videos
CREATE POLICY "Allow authenticated delete" ON video_assets
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all videos
CREATE POLICY "Allow admin full access" ON video_assets
    FOR ALL USING (auth.role() = 'admin');

-- Create videos bucket if it doesn't exist
-- Note: This is a placeholder - you'll need to create the bucket manually in Supabase dashboard
-- or use the storage API to create it programmatically
