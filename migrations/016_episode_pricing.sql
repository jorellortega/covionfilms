-- Episode numbering and free/paid controls

ALTER TABLE video_assets
ALTER COLUMN manifest_url DROP NOT NULL;

ALTER TABLE video_assets
ADD COLUMN IF NOT EXISTS episode_number INTEGER;

ALTER TABLE video_assets
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_video_assets_episode_number ON video_assets(parent_id, episode_number);

COMMENT ON COLUMN video_assets.episode_number IS 'Episode order within a series or episodic movie';
COMMENT ON COLUMN video_assets.is_free IS 'When true, this title or episode can be watched without purchase';
