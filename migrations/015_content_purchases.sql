-- Pay-per-view purchases and episode hierarchy for video_assets

ALTER TABLE video_assets
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES video_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_video_assets_parent_id ON video_assets(parent_id);

CREATE TABLE IF NOT EXISTS content_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES video_assets(id) ON DELETE CASCADE,
    purchase_type TEXT NOT NULL CHECK (purchase_type IN ('movie', 'episode')),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, video_id, purchase_type)
);

CREATE INDEX IF NOT EXISTS idx_content_purchases_user_id ON content_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_content_purchases_video_id ON content_purchases(video_id);

ALTER TABLE content_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON content_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON content_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON COLUMN video_assets.parent_id IS 'For episodes: references the parent movie or series video_asset';
COMMENT ON TABLE content_purchases IS 'Tracks per-title purchases. movie = full title/series ($4.25), episode = single episode ($1.35)';
