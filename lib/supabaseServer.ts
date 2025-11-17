import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Support both naming conventions
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_SECRET;

if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!supabaseServiceRoleKey) {
  console.error('⚠️ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_SECRET is not set - API routes will not work');
  console.error('   Please add one of these to your .env or .env.local file:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('   OR');
  console.error('   SUPABASE_SERVICE_ROLE_SECRET=your_service_role_key');
  console.error('   You can find this in your Supabase dashboard under Settings > API');
  console.error('   After adding it, restart your dev server (npm run dev)');
}

// Server-side Supabase client with service role key for admin operations
export const supabaseServer = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

