-- Migration: Add dashboard_section and other fields to video_assets table
-- This allows videos to be assigned to dashboard sections and adds metadata fields

-- Add dashboard_section column
ALTER TABLE video_assets 
ADD COLUMN IF NOT EXISTS dashboard_section TEXT DEFAULT 'none';

-- Add genre and content_type columns for categorization
ALTER TABLE video_assets 
ADD COLUMN IF NOT EXISTS genre TEXT;

ALTER TABLE video_assets 
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Add is_public column for visibility control
ALTER TABLE video_assets 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add index for dashboard section queries
CREATE INDEX IF NOT EXISTS idx_video_assets_dashboard_section ON video_assets(dashboard_section);

-- Add index for content type and genre
CREATE INDEX IF NOT EXISTS idx_video_assets_content_type ON video_assets(content_type);
CREATE INDEX IF NOT EXISTS idx_video_assets_genre ON video_assets(genre);

-- Add comment
COMMENT ON COLUMN video_assets.dashboard_section IS 'Controls which dashboard section the video appears in (featured, new_releases, top_movies, trending, coming_soon, none)';

