-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create streaming_sources table
CREATE TABLE IF NOT EXISTS streaming_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bucket', 'cdn', 'dropbox', 'external')),
    url TEXT NOT NULL,
    api_key TEXT,
    region VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    max_quality VARCHAR(20) NOT NULL CHECK (max_quality IN ('480p', '720p', '1080p', '4K')),
    bandwidth VARCHAR(50) NOT NULL,
    cost_per_gb DECIMAL(10,4) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create streaming_source_tiers table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS streaming_source_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    streaming_source_id UUID REFERENCES streaming_sources(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'standard', 'premium', 'family', 'admin', 'management')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tier_configurations table
CREATE TABLE IF NOT EXISTS tier_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier VARCHAR(20) NOT NULL UNIQUE CHECK (tier IN ('free', 'standard', 'premium', 'family')),
    streaming_source_id UUID REFERENCES streaming_sources(id) ON DELETE SET NULL,
    fallback_source_id UUID REFERENCES streaming_sources(id) ON DELETE SET NULL,
    max_quality VARCHAR(20) NOT NULL CHECK (max_quality IN ('480p', '720p', '1080p', '4K')),
    bandwidth VARCHAR(50) NOT NULL,
    cdn_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create dropbox_configurations table
CREATE TABLE IF NOT EXISTS dropbox_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_token TEXT NOT NULL,
    app_key VARCHAR(255) NOT NULL,
    app_secret TEXT NOT NULL,
    root_folder VARCHAR(255) DEFAULT '/Movies',
    is_connected BOOLEAN DEFAULT false,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create video_assignments table
CREATE TABLE IF NOT EXISTS video_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL, -- Reference to your videos table
    title VARCHAR(255) NOT NULL,
    streaming_source_id UUID REFERENCES streaming_sources(id) ON DELETE SET NULL,
    dropbox_path TEXT,
    quality_override VARCHAR(20) CHECK (quality_override IN ('480p', '720p', '1080p', '4K')),
    tier_restrictions TEXT[], -- Array of tiers that can access this video
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create streaming_analytics table
CREATE TABLE IF NOT EXISTS streaming_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    streaming_source_id UUID REFERENCES streaming_sources(id) ON DELETE SET NULL,
    tier VARCHAR(20),
    date DATE NOT NULL,
    bandwidth_used_gb DECIMAL(10,2) DEFAULT 0.00,
    requests_count INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,4) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_streaming_sources_type ON streaming_sources(type);
CREATE INDEX IF NOT EXISTS idx_streaming_sources_active ON streaming_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_streaming_source_tiers_source ON streaming_source_tiers(streaming_source_id);
CREATE INDEX IF NOT EXISTS idx_streaming_source_tiers_tier ON streaming_source_tiers(tier);
CREATE INDEX IF NOT EXISTS idx_tier_configurations_tier ON tier_configurations(tier);
CREATE INDEX IF NOT EXISTS idx_video_assignments_source ON video_assignments(streaming_source_id);
CREATE INDEX IF NOT EXISTS idx_video_assignments_active ON video_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_streaming_analytics_date ON streaming_analytics(date);
CREATE INDEX IF NOT EXISTS idx_streaming_analytics_source ON streaming_analytics(streaming_source_id);

-- Insert default streaming sources
INSERT INTO streaming_sources (name, type, url, region, is_active, priority, max_quality, bandwidth, cost_per_gb) VALUES
('Supabase Storage (Free)', 'bucket', 'https://kkrszdkkkfvfdnkbxlgnw.supabase.co/storage/v1/object/public', 'us-east-1', true, 1, '720p', 'Standard', 0.02),
('Cloudflare Stream (Premium)', 'cdn', 'https://videodelivery.net', 'Global', false, 2, '4K', 'High', 0.08),
('Bunny.net (Standard)', 'cdn', 'https://bunny.net', 'Global', false, 3, '1080p', 'Medium', 0.05),
('Dropbox Storage', 'dropbox', 'https://api.dropboxapi.com', 'Global', false, 4, '4K', 'Storage Only', 0.01)
ON CONFLICT DO NOTHING;

-- Insert default tier configurations
INSERT INTO tier_configurations (tier, streaming_source_id, fallback_source_id, max_quality, bandwidth, cdn_enabled) VALUES
('free', (SELECT id FROM streaming_sources WHERE name = 'Supabase Storage (Free)' LIMIT 1), (SELECT id FROM streaming_sources WHERE name = 'Supabase Storage (Free)' LIMIT 1), '720p', 'Standard', false),
('standard', (SELECT id FROM streaming_sources WHERE name = 'Bunny.net (Standard)' LIMIT 1), (SELECT id FROM streaming_sources WHERE name = 'Supabase Storage (Free)' LIMIT 1), '1080p', 'Medium', true),
('premium', (SELECT id FROM streaming_sources WHERE name = 'Cloudflare Stream (Premium)' LIMIT 1), (SELECT id FROM streaming_sources WHERE name = 'Bunny.net (Standard)' LIMIT 1), '4K', 'High', true),
('family', (SELECT id FROM streaming_sources WHERE name = 'Cloudflare Stream (Premium)' LIMIT 1), (SELECT id FROM streaming_sources WHERE name = 'Bunny.net (Standard)' LIMIT 1), '4K', 'High', true)
ON CONFLICT DO NOTHING;

-- Insert streaming source tier relationships
INSERT INTO streaming_source_tiers (streaming_source_id, tier) VALUES
((SELECT id FROM streaming_sources WHERE name = 'Supabase Storage (Free)' LIMIT 1), 'free'),
((SELECT id FROM streaming_sources WHERE name = 'Cloudflare Stream (Premium)' LIMIT 1), 'standard'),
((SELECT id FROM streaming_sources WHERE name = 'Cloudflare Stream (Premium)' LIMIT 1), 'premium'),
((SELECT id FROM streaming_sources WHERE name = 'Cloudflare Stream (Premium)' LIMIT 1), 'family'),
((SELECT id FROM streaming_sources WHERE name = 'Bunny.net (Standard)' LIMIT 1), 'standard'),
((SELECT id FROM streaming_sources WHERE name = 'Bunny.net (Standard)' LIMIT 1), 'premium'),
((SELECT id FROM streaming_sources WHERE name = 'Bunny.net (Standard)' LIMIT 1), 'family'),
((SELECT id FROM streaming_sources WHERE name = 'Dropbox Storage' LIMIT 1), 'admin'),
((SELECT id FROM streaming_sources WHERE name = 'Dropbox Storage' LIMIT 1), 'management')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_streaming_sources_updated_at BEFORE UPDATE ON streaming_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tier_configurations_updated_at BEFORE UPDATE ON tier_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dropbox_configurations_updated_at BEFORE UPDATE ON dropbox_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_assignments_updated_at BEFORE UPDATE ON video_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
