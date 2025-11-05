-- Migration: Dashboard Section Visibility Control
-- This allows admins to show/hide dashboard sections

-- Create dashboard_section_visibility table
CREATE TABLE IF NOT EXISTS dashboard_section_visibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_name TEXT UNIQUE NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_dashboard_section_visibility_name ON dashboard_section_visibility(section_name);
CREATE INDEX IF NOT EXISTS idx_dashboard_section_visibility_visible ON dashboard_section_visibility(is_visible);

-- Insert default sections with visibility settings
INSERT INTO dashboard_section_visibility (section_name, is_visible, display_order) VALUES
('movie_trailers', true, 1),
('top_movies', true, 2),
('ai_content', true, 3),
('trending_reels', true, 4),
('new_releases', true, 5),
('top_creators', true, 6),
('featured_movies', true, 7),
('coming_soon', true, 8),
('unseen_movies', true, 9),
('search_bar', true, 10),
('vee_reels', true, 11),
('clips', true, 12),
('music', true, 13)
ON CONFLICT (section_name) DO NOTHING;

-- Add comment
COMMENT ON TABLE dashboard_section_visibility IS 'Controls visibility of dashboard sections for admin customization';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_section_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER dashboard_section_visibility_updated_at
    BEFORE UPDATE ON dashboard_section_visibility
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_section_visibility_updated_at();

