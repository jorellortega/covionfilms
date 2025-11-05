-- Migration: Add feature toggles for search bar, vee/reels, clips, and music
-- This extends the dashboard section visibility to include additional features

-- Insert new feature sections (using ON CONFLICT to avoid errors if already exists)
INSERT INTO dashboard_section_visibility (section_name, is_visible, display_order) VALUES
('search_bar', true, 10),
('vee_reels', true, 11),
('clips', true, 12),
('music', true, 13)
ON CONFLICT (section_name) DO NOTHING;

