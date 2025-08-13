-- Enhance role system with streaming control permissions
-- This migration adds new permissions and role capabilities

-- Add new permissions for streaming control
INSERT INTO role_permissions (role, permission) VALUES
-- Admin permissions (already have most, adding streaming-specific ones)
('admin', 'manage_streaming_sources'),
('admin', 'manage_tier_configurations'),
('admin', 'manage_dropbox_integration'),
('admin', 'view_streaming_analytics'),
('admin', 'manage_video_assignments'),
('admin', 'override_video_restrictions'),

-- Management permissions (content managers)
('management', 'view_streaming_sources'),
('management', 'view_tier_configurations'),
('management', 'upload_to_dropbox'),
('management', 'assign_video_sources'),
('management', 'view_streaming_analytics'),

-- Creator permissions (content creators)
('creator', 'view_own_streaming_quality'),
('creator', 'request_quality_upgrade'),
('creator', 'view_streaming_performance'),

-- User permissions (regular users)
('user', 'view_streaming_quality'),
('user', 'report_streaming_issues'),
('user', 'request_quality_preferences')
ON CONFLICT DO NOTHING;

-- Create role_hierarchy table for better role management
CREATE TABLE IF NOT EXISTS role_hierarchy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'management', 'creator', 'user')),
    parent_role VARCHAR(20) REFERENCES role_hierarchy(role),
    level INTEGER NOT NULL DEFAULT 1,
    can_manage_roles TEXT[], -- Array of roles this role can manage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert role hierarchy
INSERT INTO role_hierarchy (role, parent_role, level, can_manage_roles) VALUES
('admin', NULL, 1, ARRAY['admin', 'management', 'creator', 'user']),
('management', 'admin', 2, ARRAY['creator', 'user']),
('creator', 'management', 3, ARRAY['user']),
('user', 'creator', 4, ARRAY[])
ON CONFLICT DO NOTHING;

-- Create user_role_assignments table for multiple role support
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'management', 'creator', 'user')),
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT
);

-- Create role_streaming_access table for role-based streaming permissions
CREATE TABLE IF NOT EXISTS role_streaming_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'management', 'creator', 'user')),
    streaming_source_id UUID REFERENCES streaming_sources(id) ON DELETE CASCADE,
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('full', 'read', 'write', 'none')),
    quality_override VARCHAR(20) CHECK (quality_override IN ('480p', '720p', '1080p', '4K')),
    can_configure BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default role streaming access
INSERT INTO role_streaming_access (role, streaming_source_id, access_level, quality_override, can_configure) VALUES
-- Admin: Full access to all sources
('admin', (SELECT id FROM streaming_sources WHERE name = 'Supabase Storage (Free)' LIMIT 1), 'full', '4K', true),
('admin', (SELECT id FROM streaming_sources WHERE name = 'Cloudflare Stream (Premium)' LIMIT 1), 'full', '4K', true),
('admin', (SELECT id FROM streaming_sources WHERE name = 'Bunny.net (Standard)' LIMIT 1), 'full', '4K', true),
('admin', (SELECT id FROM streaming_sources WHERE name = 'Dropbox Storage' LIMIT 1), 'full', '4K', true),

-- Management: Full access to most sources, limited Dropbox
('management', (SELECT id FROM streaming_sources WHERE name = 'Supabase Storage (Free)' LIMIT 1), 'full', '4K', true),
('management', (SELECT id FROM streaming_sources WHERE name = 'Cloudflare Stream (Premium)' LIMIT 1), 'full', '4K', false),
('management', (SELECT id FROM streaming_sources WHERE name = 'Bunny.net (Standard)' LIMIT 1), 'full', '4K', false),
('management', (SELECT id FROM streaming_sources WHERE name = 'Dropbox Storage' LIMIT 1), 'write', '4K', false),

-- Creator: Read access to sources, no configuration
('creator', (SELECT id FROM streaming_sources WHERE name = 'Supabase Storage (Free)' LIMIT 1), 'read', '1080p', false),
('creator', (SELECT id FROM streaming_sources WHERE name = 'Cloudflare Stream (Premium)' LIMIT 1), 'read', '4K', false),
('creator', (SELECT id FROM streaming_sources WHERE name = 'Bunny.net (Standard)' LIMIT 1), 'read', '1080p', false),
('creator', (SELECT id FROM streaming_sources WHERE name = 'Dropbox Storage' LIMIT 1), 'none', NULL, false),

-- User: Read access to sources, no configuration
('user', (SELECT id FROM streaming_sources WHERE name = 'Supabase Storage (Free)' LIMIT 1), 'read', '720p', false),
('user', (SELECT id FROM streaming_sources WHERE name = 'Cloudflare Stream (Premium)' LIMIT 1), 'read', '4K', false),
('user', (SELECT id FROM streaming_sources WHERE name = 'Bunny.net (Standard)' LIMIT 1), 'read', '1080p', false),
('user', (SELECT id FROM streaming_sources WHERE name = 'Dropbox Storage' LIMIT 1), 'none', NULL, false)
ON CONFLICT DO NOTHING;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_role_hierarchy_role ON role_hierarchy(role);
CREATE INDEX IF NOT EXISTS idx_role_hierarchy_parent ON role_hierarchy(parent_role);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role ON user_role_assignments(role);
CREATE INDEX IF NOT EXISTS idx_role_streaming_access_role ON role_streaming_access(role);
CREATE INDEX IF NOT EXISTS idx_role_streaming_access_source ON role_streaming_access(streaming_source_id);

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    user_id_param UUID,
    permission_param TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(20);
    has_perm BOOLEAN;
BEGIN
    -- Get user's role
    SELECT role INTO user_role FROM users WHERE id = user_id_param;
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has the permission
    SELECT EXISTS(
        SELECT 1 FROM role_permissions 
        WHERE role = user_role AND permission = permission_param
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's effective streaming quality
CREATE OR REPLACE FUNCTION get_user_effective_quality(
    user_id_param UUID,
    streaming_source_id_param UUID
) RETURNS VARCHAR(20) AS $$
DECLARE
    user_role VARCHAR(20);
    user_tier VARCHAR(20);
    role_quality VARCHAR(20);
    tier_quality VARCHAR(20);
    effective_quality VARCHAR(20);
BEGIN
    -- Get user's role and subscription tier
    SELECT u.role, s.tier INTO user_role, user_tier
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    WHERE u.id = user_id_param;
    
    IF user_role IS NULL THEN
        RETURN '480p';
    END IF;
    
    -- Get quality override from role
    SELECT quality_override INTO role_quality
    FROM role_streaming_access
    WHERE role = user_role AND streaming_source_id = streaming_source_id_param;
    
    -- Get quality from subscription tier
    SELECT max_quality INTO tier_quality
    FROM tier_configurations
    WHERE tier = COALESCE(user_tier, 'free');
    
    -- Determine effective quality (role override takes precedence)
    IF role_quality IS NOT NULL THEN
        effective_quality := role_quality;
    ELSIF tier_quality IS NOT NULL THEN
        effective_quality := tier_quality;
    ELSE
        effective_quality := '480p';
    END IF;
    
    RETURN effective_quality;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user can access streaming source
CREATE OR REPLACE FUNCTION can_user_access_streaming_source(
    user_id_param UUID,
    streaming_source_id_param UUID
) RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(20);
    access_level VARCHAR(20);
BEGIN
    -- Get user's role
    SELECT role INTO user_role FROM users WHERE id = user_id_param;
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get access level for this role and source
    SELECT access_level INTO access_level
    FROM role_streaming_access
    WHERE role = user_role AND streaming_source_id = streaming_source_id_param;
    
    -- Return true if access level is not 'none'
    RETURN access_level != 'none';
END;
$$ LANGUAGE plpgsql;

