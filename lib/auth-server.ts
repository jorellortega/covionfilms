import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from '@/lib/supabaseServer'
import { normalizeSubscriptionTier } from '@/lib/content-pricing'

const UPLOAD_ROLES = new Set(['creator', 'admin', 'management'])

export type AuthenticatedUploadUser = {
  id: string
  email?: string
  role: string
  subscription: string
}

export async function getAuthenticatedUploadUser(
  request: Request
): Promise<AuthenticatedUploadUser | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServer) {
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return null
  }

  const { data: userData, error: userError } = await supabaseServer
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.role || !UPLOAD_ROLES.has(userData.role)) {
    return null
  }

  const { data: subscriptionData } = await supabaseServer
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email,
    role: userData.role,
    subscription: normalizeSubscriptionTier(subscriptionData?.tier),
  }
}
