-- Migration 005: Add dashboard_section column to videos table
-- This allows users to manually control which dashboard section each video appears in

-- Add dashboard_section column to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS dashboard_section TEXT DEFAULT 'none';

-- Add index for faster queries by dashboard section
CREATE INDEX IF NOT EXISTS idx_videos_dashboard_section ON videos(dashboard_section);

-- Update existing videos to have a default section
UPDATE videos 
SET dashboard_section = 'new_releases' 
WHERE dashboard_section IS NULL OR dashboard_section = 'none';

-- Add comment to document the column
COMMENT ON COLUMN videos.dashboard_section IS 'Controls which dashboard section the video appears in (featured, new_releases, top_movies, trending, coming_soon, none)';

-- Create a function to get videos by dashboard section
CREATE OR REPLACE FUNCTION get_videos_by_section(section_name TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    cover_image_path TEXT,
    file_path TEXT,
    duration_seconds INTEGER,
    quality TEXT,
    genre TEXT,
    content_type TEXT,
    view_count INTEGER,
    rating_average NUMERIC,
    rating_count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.title,
        v.description,
        v.cover_image_path,
        v.file_path,
        v.duration_seconds,
        v.quality,
        v.genre,
        v.content_type,
        v.view_count,
        v.rating_average,
        v.rating_count,
        v.created_at
    FROM videos v
    WHERE v.dashboard_section = section_name
      AND v.status = 'ready'
      AND v.is_public = true
    ORDER BY 
        CASE 
            WHEN section_name = 'featured' THEN v.created_at
            WHEN section_name = 'new_releases' THEN v.created_at
            WHEN section_name = 'top_movies' THEN v.view_count
            WHEN section_name = 'trending' THEN v.rating_average
            WHEN section_name = 'coming_soon' THEN v.created_at
            ELSE v.created_at
        END DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_videos_by_section(TEXT, INTEGER) TO authenticated;

-- Insert some sample section assignments for testing (optional)
-- You can uncomment these if you want to test with sample data
/*
INSERT INTO videos (id, title, description, content_type, genre, dashboard_section, status, is_public, user_id, created_at)
VALUES 
    (gen_random_uuid(), 'Sample Featured Video', 'A sample video for featured section', 'movie', 'Action', 'featured', 'ready', true, 'your-user-id', NOW()),
    (gen_random_uuid(), 'Sample New Release', 'A sample video for new releases', 'shortFilm', 'Comedy', 'new_releases', 'ready', true, 'your-user-id', NOW())
ON CONFLICT DO NOTHING;
*/
