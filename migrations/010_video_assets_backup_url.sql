-- Migration: Add backup_url to video_assets table
-- This allows videos to have a fallback streaming URL if the primary fails

ALTER TABLE video_assets 
ADD COLUMN IF NOT EXISTS backup_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_assets_backup_url ON video_assets(backup_url) WHERE backup_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN video_assets.backup_url IS 'Fallback/backup streaming URL if the primary manifest_url fails';

