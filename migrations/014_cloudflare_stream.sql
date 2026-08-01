-- Migration: Add Cloudflare Stream support to video_assets

ALTER TABLE video_assets
ADD COLUMN IF NOT EXISTS cloudflare_stream_uid TEXT;

CREATE INDEX IF NOT EXISTS idx_video_assets_cloudflare_stream_uid
ON video_assets(cloudflare_stream_uid)
WHERE cloudflare_stream_uid IS NOT NULL;

COMMENT ON COLUMN video_assets.cloudflare_stream_uid IS 'Cloudflare Stream video UID for hosted playback';
