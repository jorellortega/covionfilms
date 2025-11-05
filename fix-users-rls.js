const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_SECRET;

console.log('🔍 Checking users table RLS policies...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUsersRLS() {
  try {
    console.log('\n📊 Checking users table access...');
    
    // Test if we can access users table with service role
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error accessing users table:', usersError);
      return;
    }
    
    console.log('✅ Users table accessible with service role');
    console.log('📊 Sample user:', users[0]);
    
    // Check if RLS is enabled
    console.log('\n🔐 Checking RLS status...');
    try {
      const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, rowsecurity 
          FROM pg_tables 
          WHERE tablename = 'users';
        `
      });
      
      if (rlsError) {
        console.log('   ⚠️  Could not check RLS status via RPC');
      } else {
        console.log('   📋 RLS status:', rlsStatus);
      }
    } catch (e) {
      console.log('   ⚠️  RLS check failed:', e.message);
    }
    
    // Check existing policies
    console.log('\n📋 Checking existing policies...');
    try {
      const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'users';
        `
      });
      
      if (policiesError) {
        console.log('   ⚠️  Could not check policies via RPC');
      } else {
        console.log('   📋 Existing policies:', policies);
      }
    } catch (e) {
      console.log('   ⚠️  Policy check failed:', e.message);
    }
    
    // Test with a specific user ID that's failing
    console.log('\n🧪 Testing specific user query...');
    const testUserId = '549cae2a-85d6-4e03-a3f5-c97c7aa5a2c5';
    
    try {
      const { data: testUser, error: testError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      if (testError) {
        console.error('   ❌ Test query failed:', testError);
      } else {
        console.log('   ✅ Test query successful:', testUser);
      }
    } catch (e) {
      console.error('   ❌ Test query exception:', e.message);
    }
    
    console.log('\n📋 Summary:');
    console.log('   • The 406 error suggests RLS is blocking the query');
    console.log('   • We need to create policies allowing users to read their own data');
    console.log('   • Or temporarily disable RLS for testing');
    
    // Try to create a simple policy
    console.log('\n🔧 Attempting to create RLS policy...');
    try {
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Enable RLS if not already enabled
          ALTER TABLE users ENABLE ROW LEVEL SECURITY;
          
          -- Create policy for users to read their own data
          CREATE POLICY "Users can read own data" ON users
            FOR SELECT
            TO authenticated
            USING (id = auth.uid());
        `
      });
      
      if (policyError) {
        console.log('   ⚠️  Could not create policy via RPC:', policyError.message);
      } else {
        console.log('   ✅ RLS policy created successfully');
      }
    } catch (e) {
      console.log('   ⚠️  Policy creation failed:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Users RLS check failed:', error.message);
  }
}

fixUsersRLS();
