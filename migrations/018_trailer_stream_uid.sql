-- Migration: Separate trailer Cloudflare Stream UID for dashboard hero playback

ALTER TABLE video_assets
ADD COLUMN IF NOT EXISTS trailer_cloudflare_stream_uid TEXT;

CREATE INDEX IF NOT EXISTS idx_video_assets_trailer_stream_uid
ON video_assets(trailer_cloudflare_stream_uid)
WHERE trailer_cloudflare_stream_uid IS NOT NULL;

COMMENT ON COLUMN video_assets.trailer_cloudflare_stream_uid IS 'Cloudflare Stream UID for trailer/preview on dashboard; full movie uses cloudflare_stream_uid';
