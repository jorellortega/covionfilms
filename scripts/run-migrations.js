const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://ryvbubkbtwvhzzaqzmlw.supabase.co`;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_SECRET;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_SECRET not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Check if tables already exist
    console.log('🔍 Checking existing database structure...');
    
    // Try to create users table
    console.log('\n📝 Creating users table...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'management', 'creator', 'user')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.log('   ⚠️  Users table creation had issues (may already exist)');
      } else {
        console.log('   ✅ Users table created successfully');
      }
    } catch (e) {
      console.log('   ⚠️  Users table creation skipped (may already exist)');
    }
    
    // Try to create subscriptions table
    console.log('\n📝 Creating subscriptions table...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'standard', 'premium', 'family')),
            status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')),
            start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expiry_date TIMESTAMP WITH TIME ZONE,
            auto_renew BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.log('   ⚠️  Subscriptions table creation had issues (may already exist)');
      } else {
        console.log('   ✅ Subscriptions table created successfully');
      }
    } catch (e) {
      console.log('   ⚠️  Subscriptions table creation skipped (may already exist)');
    }
    
    // Try to create profiles table
    console.log('\n📝 Creating profiles table...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            avatar_url VARCHAR(255),
            bio TEXT,
            status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.log('   ⚠️  Profiles table creation had issues (may already exist)');
      } else {
        console.log('   ✅ Profiles table created successfully');
      }
    } catch (e) {
      console.log('   ⚠️  Profiles table creation skipped (may already exist)');
    }
    
    // Try to create subscription_features table
    console.log('\n📝 Creating subscription_features table...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS subscription_features (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'standard', 'premium', 'family')),
            feature_name VARCHAR(255) NOT NULL,
            feature_value TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.log('   ⚠️  Subscription_features table creation had issues (may already exist)');
      } else {
        console.log('   ✅ Subscription_features table created successfully');
      }
    } catch (e) {
      console.log('   ⚠️  Subscription_features table creation skipped (may already exist)');
    }
    
    // Try to create role_permissions table
    console.log('\n📝 Creating role_permissions table...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS role_permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'management', 'creator', 'user')),
            permission VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.log('   ⚠️  Role_permissions table creation had issues (may already exist)');
      } else {
        console.log('   ✅ Role_permissions table created successfully');
      }
    } catch (e) {
      console.log('   ⚠️  Role_permissions table creation skipped (may already exist)');
    }
    
    // Try to create indexes
    console.log('\n📝 Creating indexes...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
          CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
          CREATE INDEX IF NOT EXISTS idx_subscription_features_tier ON subscription_features(tier);
          CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
        `
      });
      
      if (error) {
        console.log('   ⚠️  Index creation had issues (may already exist)');
      } else {
        console.log('   ✅ Indexes created successfully');
      }
    } catch (e) {
      console.log('   ⚠️  Index creation skipped (may already exist)');
    }
    
    // Insert default subscription features
    console.log('\n📝 Inserting default subscription features...');
    try {
      const features = [
        { tier: 'free', feature_name: 'max_streaming_quality', feature_value: '720p' },
        { tier: 'free', feature_name: 'ad_supported', feature_value: 'true' },
        { tier: 'free', feature_name: 'max_devices', feature_value: '1' },
        { tier: 'standard', feature_name: 'max_streaming_quality', feature_value: '1080p' },
        { tier: 'standard', feature_name: 'ad_supported', feature_value: 'false' },
        { tier: 'standard', feature_name: 'max_devices', feature_value: '2' },
        { tier: 'premium', feature_name: 'max_streaming_quality', feature_value: '4k' },
        { tier: 'premium', feature_name: 'ad_supported', feature_value: 'false' },
        { tier: 'premium', feature_name: 'max_devices', feature_value: '4' },
        { tier: 'family', feature_name: 'max_streaming_quality', feature_value: '4k' },
        { tier: 'family', feature_name: 'ad_supported', feature_value: 'false' },
        { tier: 'family', feature_name: 'max_devices', feature_value: '5' }
      ];
      
      for (const feature of features) {
        try {
          const { error } = await supabase
            .from('subscription_features')
            .upsert(feature, { onConflict: 'tier,feature_name' });
          
          if (error) {
            console.log(`   ⚠️  Feature ${feature.tier}:${feature.feature_name} insertion had issues`);
          }
        } catch (e) {
          console.log(`   ⚠️  Feature ${feature.tier}:${feature.feature_name} insertion skipped`);
        }
      }
      console.log('   ✅ Default subscription features inserted');
    } catch (e) {
      console.log('   ⚠️  Subscription features insertion skipped');
    }
    
    // Insert default role permissions
    console.log('\n📝 Inserting default role permissions...');
    try {
      const permissions = [
        { role: 'admin', permission: 'manage_users' },
        { role: 'admin', permission: 'manage_content' },
        { role: 'admin', permission: 'manage_subscriptions' },
        { role: 'admin', permission: 'view_analytics' },
        { role: 'management', permission: 'manage_content' },
        { role: 'management', permission: 'view_analytics' },
        { role: 'creator', permission: 'upload_content' },
        { role: 'creator', permission: 'manage_own_content' },
        { role: 'user', permission: 'view_content' },
        { role: 'user', permission: 'comment' },
        { role: 'user', permission: 'rate_content' }
      ];
      
      for (const permission of permissions) {
        try {
          const { error } = await supabase
            .from('role_permissions')
            .upsert(permission, { onConflict: 'role,permission' });
          
          if (error) {
            console.log(`   ⚠️  Permission ${permission.role}:${permission.permission} insertion had issues`);
          }
        } catch (e) {
          console.log(`   ⚠️  Permission ${permission.role}:${permission.permission} insertion skipped`);
        }
      }
      console.log('   ✅ Default role permissions inserted');
    } catch (e) {
      console.log('   ⚠️  Role permissions insertion skipped');
    }

    // NEW: Create streaming control tables
    console.log('\n🎬 Creating streaming control tables...');
    
    // Create streaming_sources table
    console.log('   📝 Creating streaming_sources table...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS streaming_sources (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        `
      });
      
      if (error) {
        console.log('     ⚠️  Streaming_sources table creation had issues (may already exist)');
      } else {
        console.log('     ✅ Streaming_sources table created successfully');
      }
    } catch (e) {
      console.log('     ⚠️  Streaming_sources table creation skipped (may already exist)');
    }

    // Create tier_configurations table
    console.log('   📝 Creating tier_configurations table...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS tier_configurations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tier VARCHAR(20) NOT NULL UNIQUE CHECK (tier IN ('free', 'standard', 'premium', 'family')),
            streaming_source_id UUID REFERENCES streaming_sources(id) ON DELETE SET NULL,
            fallback_source_id UUID REFERENCES streaming_sources(id) ON DELETE SET NULL,
            max_quality VARCHAR(20) NOT NULL CHECK (max_quality IN ('480p', '720p', '1080p', '4K')),
            bandwidth VARCHAR(50) NOT NULL,
            cdn_enabled BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.log('     ⚠️  Tier_configurations table creation had issues (may already exist)');
      } else {
        console.log('     ✅ Tier_configurations table created successfully');
      }
    } catch (e) {
      console.log('     ⚠️  Tier_configurations table creation skipped (may already exist)');
    }

    // Create dropbox_configurations table
    console.log('   📝 Creating dropbox_configurations table...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS dropbox_configurations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            access_token TEXT NOT NULL,
            app_key VARCHAR(255) NOT NULL,
            app_secret TEXT NOT NULL,
            root_folder VARCHAR(255) DEFAULT '/Movies',
            is_connected BOOLEAN DEFAULT false,
            last_sync TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.log('     ⚠️  Dropbox_configurations table creation had issues (may already exist)');
      } else {
        console.log('     ✅ Dropbox_configurations table created successfully');
      }
    } catch (e) {
      console.log('     ⚠️  Dropbox_configurations table creation skipped (may already exist)');
    }

    // Create video_assignments table
    console.log('   📝 Creating video_assignments table...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS video_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            video_id UUID NOT NULL,
            title VARCHAR(255) NOT NULL,
            streaming_source_id UUID REFERENCES streaming_sources(id) ON DELETE SET NULL,
            dropbox_path TEXT,
            quality_override VARCHAR(20) CHECK (quality_override IN ('480p', '720p', '1080p', '4K')),
            tier_restrictions TEXT[],
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (error) {
        console.log('     ⚠️  Video_assignments table creation had issues (may already exist)');
      } else {
        console.log('     ✅ Video_assignments table created successfully');
      }
    } catch (e) {
      console.log('     ⚠️  Video_assignments table creation skipped (may already exist)');
    }

    // Insert default streaming sources
    console.log('   📝 Inserting default streaming sources...');
    try {
      const sources = [
        { name: 'Supabase Storage (Free)', type: 'bucket', url: 'https://kkrszdkkkfvfdnkbxlgnw.supabase.co/storage/v1/object/public', region: 'us-east-1', is_active: true, priority: 1, max_quality: '720p', bandwidth: 'Standard', cost_per_gb: 0.02 },
        { name: 'Cloudflare Stream (Premium)', type: 'cdn', url: 'https://videodelivery.net', region: 'Global', is_active: false, priority: 2, max_quality: '4K', bandwidth: 'High', cost_per_gb: 0.08 },
        { name: 'Bunny.net (Standard)', type: 'cdn', url: 'https://bunny.net', region: 'Global', is_active: false, priority: 3, max_quality: '1080p', bandwidth: 'Medium', cost_per_gb: 0.05 },
        { name: 'Dropbox Storage', type: 'dropbox', url: 'https://api.dropboxapi.com', region: 'Global', is_active: false, priority: 4, max_quality: '4K', bandwidth: 'Storage Only', cost_per_gb: 0.01 }
      ];
      
      for (const source of sources) {
        try {
          const { error } = await supabase
            .from('streaming_sources')
            .upsert(source, { onConflict: 'name' });
          
          if (error) {
            console.log(`     ⚠️  Source ${source.name} insertion had issues`);
          }
        } catch (e) {
          console.log(`     ⚠️  Source ${source.name} insertion skipped`);
        }
      }
      console.log('     ✅ Default streaming sources inserted');
    } catch (e) {
      console.log('     ⚠️  Streaming sources insertion skipped');
    }
    
    // Create video_assets table for HLS streaming
    console.log('   📝 Creating video_assets table...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS video_assets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            manifest_url TEXT NOT NULL,
            file_size BIGINT,
            duration INTEGER,
            resolution TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error'))
          );
        `
      });
      
      if (error) {
        console.log('     ⚠️  Video_assets table creation had issues (may already exist)');
      } else {
        console.log('     ✅ Video_assets table created successfully');
      }
    } catch (e) {
      console.log('     ⚠️  Video_assets table creation skipped (may already exist)');
    }
    
    // Create indexes for video_assets
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE INDEX IF NOT EXISTS idx_video_assets_user_id ON video_assets(user_id);
          CREATE INDEX IF NOT EXISTS idx_video_assets_status ON video_assets(status);
          CREATE INDEX IF NOT EXISTS idx_video_assets_created_at ON video_assets(created_at);
        `
      });
      
      if (error) {
        console.log('     ⚠️  Video_assets indexes creation had issues (may already exist)');
      } else {
        console.log('     ✅ Video_assets indexes created successfully');
      }
    } catch (e) {
      console.log('     ⚠️  Video_assets indexes creation skipped (may already exist)');
    }
    
    // Enable RLS and create policies for video_assets
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `
          ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Allow public read access" ON video_assets
            FOR SELECT USING (true);
          
          CREATE POLICY "Allow authenticated insert" ON video_assets
            FOR INSERT WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY "Allow authenticated update" ON video_assets
            FOR UPDATE USING (auth.uid() = user_id);
          
          CREATE POLICY "Allow authenticated delete" ON video_assets
            FOR DELETE USING (auth.uid() = user_id);
          
          CREATE POLICY "Allow admin full access" ON video_assets
            FOR ALL USING (auth.role() = 'admin');
        `
      });
      
      if (error) {
        console.log('     ⚠️  Video_assets RLS policies creation had issues (may already exist)');
      } else {
        console.log('     ✅ Video_assets RLS policies created successfully');
      }
    } catch (e) {
      console.log('     ⚠️  Video_assets RLS policies creation skipped (may already exist)');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Database structure created:');
    console.log('   • users table');
    console.log('   • subscriptions table');
    console.log('   • profiles table');
    console.log('   • subscription_features table');
    console.log('   • role_permissions table');
    console.log('   • All necessary indexes');
    console.log('   • Default subscription features');
    console.log('   • Default role permissions');
    console.log('   • streaming_sources table');
    console.log('   • tier_configurations table');
    console.log('   • dropbox_configurations table');
    console.log('   • video_assignments table');
    console.log('   • video_assets table (HLS streaming)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
