import { supabase } from '@/lib/supabaseClient'
import { getCoverImageUrl } from '@/lib/cover-image'

export type DashboardVideo = {
  id: string
  title: string
  description?: string
  cover_image_path?: string
  manifest_url?: string
  cloudflare_stream_uid?: string
  dashboard_section?: string
  status?: string
  is_public?: boolean
  created_at?: string
}

export async function fetchDashboardVideos(section: string, limit = 10): Promise<DashboardVideo[]> {
  const { data, error } = await supabase
    .from('video_assets')
    .select(
      'id, title, description, cover_image_path, manifest_url, cloudflare_stream_uid, dashboard_section, status, is_public, created_at'
    )
    .eq('dashboard_section', section)
    .eq('status', 'ready')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error(`Failed to fetch dashboard videos (${section}):`, error.message)
    return []
  }

  return (data || []).map((video) => ({
    ...video,
    cover_image_path: getCoverImageUrl(video.cover_image_path) || undefined,
  }))
}
