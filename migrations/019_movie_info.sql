-- Migration: Movie metadata for video_assets (producer, release year)

ALTER TABLE video_assets
ADD COLUMN IF NOT EXISTS producer TEXT;

ALTER TABLE video_assets
ADD COLUMN IF NOT EXISTS release_year INTEGER;

COMMENT ON COLUMN video_assets.producer IS 'Producer or production company name';
COMMENT ON COLUMN video_assets.release_year IS 'Release year shown on watch page';
