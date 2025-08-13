-- Video System Migration
-- This migration creates the video management and streaming infrastructure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('movie', 'shortFilm', 'reel', 'clip')),
    genre VARCHAR(50) NOT NULL,
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    file_path TEXT NOT NULL,
    cover_image_path TEXT,
    streaming_source_id UUID REFERENCES streaming_sources(id) ON DELETE SET NULL,
    quality VARCHAR(20) CHECK (quality IN ('480p', '720p', '1080p', '4K')),
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed', 'deleted')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create video_metadata table for additional video information
CREATE TABLE IF NOT EXISTS video_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    resolution_width INTEGER,
    resolution_height INTEGER,
    frame_rate DECIMAL(5,2),
    bitrate_kbps INTEGER,
    codec VARCHAR(50),
    audio_codec VARCHAR(50),
    audio_channels INTEGER,
    audio_sample_rate INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create video_segments table for HLS/DASH streaming
CREATE TABLE IF NOT EXISTS video_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    segment_number INTEGER NOT NULL,
    segment_path TEXT NOT NULL,
    segment_duration DECIMAL(10,3) NOT NULL,
    segment_size_bytes BIGINT,
    quality VARCHAR(20) NOT NULL CHECK (quality IN ('480p', '720p', '1080p', '4K')),
    bitrate_kbps INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create video_streaming_data table for streaming analytics
CREATE TABLE IF NOT EXISTS video_streaming_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    streaming_source_id UUID REFERENCES streaming_sources(id) ON DELETE SET NULL,
    quality_requested VARCHAR(20),
    quality_delivered VARCHAR(20),
    bandwidth_used_mb DECIMAL(10,2),
    stream_duration_seconds INTEGER,
    buffering_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    stream_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stream_ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create video_ratings table
CREATE TABLE IF NOT EXISTS video_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, user_id)
);

-- Create video_playlists table
CREATE TABLE IF NOT EXISTS video_playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create video_playlist_items table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS video_playlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID REFERENCES video_playlists(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, video_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_content_type ON videos(content_type);
CREATE INDEX IF NOT EXISTS idx_videos_genre ON videos(genre);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_public ON videos(is_public);
CREATE INDEX IF NOT EXISTS idx_video_metadata_video_id ON video_metadata(video_id);
CREATE INDEX IF NOT EXISTS idx_video_segments_video_id ON video_segments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_segments_quality ON video_segments(quality);
CREATE INDEX IF NOT EXISTS idx_video_streaming_data_video_id ON video_streaming_data(video_id);
CREATE INDEX IF NOT EXISTS idx_video_streaming_data_user_id ON video_streaming_data(user_id);
CREATE INDEX IF NOT EXISTS idx_video_ratings_video_id ON video_ratings(video_id);
CREATE INDEX IF NOT EXISTS idx_video_ratings_user_id ON video_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_video_playlists_user_id ON video_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_video_playlist_items_playlist_id ON video_playlist_items(playlist_id);

-- Create function to update video rating averages
CREATE OR REPLACE FUNCTION update_video_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the video's rating average and count
    UPDATE videos 
    SET 
        rating_average = (
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM video_ratings 
            WHERE video_id = NEW.video_id
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM video_ratings 
            WHERE video_id = NEW.video_id
        )
    WHERE id = NEW.video_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
CREATE TRIGGER trigger_update_video_rating
    AFTER INSERT OR UPDATE OR DELETE ON video_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_video_rating();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_video_updated_at();
CREATE TRIGGER update_video_ratings_updated_at BEFORE UPDATE ON video_ratings FOR EACH ROW EXECUTE FUNCTION update_video_updated_at();
CREATE TRIGGER update_video_playlists_updated_at BEFORE UPDATE ON video_playlists FOR EACH ROW EXECUTE FUNCTION update_video_updated_at();

-- Insert some sample genres if they don't exist
INSERT INTO videos (title, description, content_type, genre, file_path, user_id, status, is_public) VALUES
('Sample Movie', 'A sample movie for testing', 'movie', 'action', '/sample/path.mp4', (SELECT id FROM users LIMIT 1), 'ready', true)
ON CONFLICT DO NOTHING;
