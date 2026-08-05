import { supabase } from '@/lib/supabaseClient'
import { getCoverImageUrl } from '@/lib/cover-image'

export type DashboardVideo = {
  id: string
  title: string
  description?: string
  cover_image_path?: string
  manifest_url?: string
  cloudflare_stream_uid?: string
  trailer_cloudflare_stream_uid?: string
  dashboard_section?: string
  status?: string
  is_public?: boolean
  created_at?: string
}

const DASHBOARD_VIDEO_COLUMNS =
  'id, title, description, cover_image_path, manifest_url, cloudflare_stream_uid, trailer_cloudflare_stream_uid, dashboard_section, status, is_public, created_at'

const DASHBOARD_VIDEO_COLUMNS_LEGACY =
  'id, title, description, cover_image_path, manifest_url, cloudflare_stream_uid, dashboard_section, status, is_public, created_at'

export async function fetchDashboardVideos(section: string, limit = 10): Promise<DashboardVideo[]> {
  const query = (columns: string) =>
    supabase
      .from('video_assets')
      .select(columns)
      .eq('dashboard_section', section)
      .eq('status', 'ready')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

  let { data, error } = await query(DASHBOARD_VIDEO_COLUMNS)

  if (error?.message?.includes('trailer_cloudflare_stream_uid')) {
    console.warn(
      'trailer_cloudflare_stream_uid column missing — run migrations/018_trailer_stream_uid.sql in Supabase'
    )
    const fallback = await query(DASHBOARD_VIDEO_COLUMNS_LEGACY)
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error(`Failed to fetch dashboard videos (${section}):`, error.message)
    return []
  }

  return (data || []).map((video) => ({
    ...video,
    cover_image_path: getCoverImageUrl(video.cover_image_path) || undefined,
  }))
}
