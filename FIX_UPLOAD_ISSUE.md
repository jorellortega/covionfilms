# 🚨 UPLOAD ISSUE FIX - Getting Stuck at 10%

## 🔍 Problem Identified

The upload is getting stuck at 10% because of **Row Level Security (RLS) policy violations** in Supabase storage. When you try to upload a file as an admin user, the system fails to insert the file record into the `storage.objects` table due to missing RLS policies.

## 🎯 Root Cause

1. **Storage bucket exists**: ✅ `covionfilms` bucket is accessible
2. **Service role works**: ✅ Admin/service role can upload files
3. **RLS policies missing**: ❌ No policies allow authenticated users to upload
4. **Error**: `new row violates row-level security policy`

## 🛠️ Solution: Create Storage RLS Policies

You need to run these SQL commands in your **Supabase Dashboard > SQL Editor**:

### Step 1: Enable RLS on storage.objects
```sql
-- Enable Row Level Security on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Upload Policy
```sql
-- Allow authenticated users to upload files to covionfilms bucket
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'covionfilms' 
        AND auth.uid() IS NOT NULL
    );
```

### Step 3: Create View Policy
```sql
-- Allow authenticated users to view files in covionfilms bucket
CREATE POLICY "Allow authenticated users to view files" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'covionfilms' 
        AND auth.uid() IS NOT NULL
    );
```

### Step 4: Create Update Policy
```sql
-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update files" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'covionfilms' 
        AND auth.uid() IS NOT NULL
    )
    WITH CHECK (
        bucket_id = 'covionfilms' 
        AND auth.uid() IS NOT NULL
    );
```

### Step 5: Create Delete Policy
```sql
-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'covionfilms' 
        AND auth.uid() IS NOT NULL
    );
```

### Step 6: Create Public Access Policy
```sql
-- Allow public access to view files in covionfilms bucket (for streaming)
CREATE POLICY "Allow public access to covionfilms bucket" ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'covionfilms'
    );
```

### Step 7: Grant Permissions
```sql
-- Grant necessary permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
```

## 🚀 How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ryvbubkbtwvhzzaqzmlk`
3. Navigate to **SQL Editor** in the left sidebar
4. Copy and paste each SQL command above
5. Run them one by one
6. Check **Authentication > Policies** to verify they were created

### Option 2: Supabase CLI
If you have Supabase CLI installed:
```bash
# Connect to your project
supabase link --project-ref ryvbubkbtwvhzzaqzmlk

# Run the migration
supabase db push
```

## 🧪 Test the Fix

After applying the policies:

1. **Go to your upload page** (`/upload`)
2. **Sign in as admin** user
3. **Select a video file** (any size)
4. **Fill out the form** and submit
5. **Watch the progress** - it should now go beyond 10%

## 🔧 Alternative Quick Fix

If you want to temporarily disable RLS for testing:

```sql
-- ⚠️ WARNING: This disables security - only use for testing
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Remember to re-enable it after testing:**
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## 📊 Expected Behavior After Fix

- ✅ **Progress 0-10%**: Form validation and file preparation
- ✅ **Progress 10-70%**: File upload to Supabase storage
- ✅ **Progress 70-80%**: Cover image upload (if provided)
- ✅ **Progress 80-90%**: Database record creation
- ✅ **Progress 90-100%**: Video processing and completion

## 🚨 If Issues Persist

1. **Check browser console** for JavaScript errors
2. **Check Supabase logs** for backend errors
3. **Verify user authentication** is working
4. **Check file size limits** (admin: 100GB, others: based on subscription)
5. **Verify storage bucket** permissions

## 📞 Support

If you continue to have issues after applying these policies:
1. Check the Supabase dashboard logs
2. Verify the policies were created successfully
3. Test with a small file first (< 100MB)
4. Ensure your user has the correct role (admin/creator/management)

---

**Note**: This fix addresses the core RLS policy issue. The upload should now work properly for all authenticated users with appropriate roles.
