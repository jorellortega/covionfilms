-- Migration: Add cover_image_path to video_assets table
-- This allows videos to have cover/thumbnail images

ALTER TABLE video_assets 
ADD COLUMN IF NOT EXISTS cover_image_path TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_assets_cover_image ON video_assets(cover_image_path) WHERE cover_image_path IS NOT NULL;

-- Add comment
COMMENT ON COLUMN video_assets.cover_image_path IS 'Path or URL to the cover/thumbnail image for the video';

