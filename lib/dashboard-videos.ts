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
  view_count?: number
}

const DASHBOARD_VIDEO_COLUMNS =
  'id, title, description, cover_image_path, manifest_url, cloudflare_stream_uid, trailer_cloudflare_stream_uid, dashboard_section, status, is_public, created_at'

const DASHBOARD_VIDEO_COLUMNS_LEGACY =
  'id, title, description, cover_image_path, manifest_url, cloudflare_stream_uid, dashboard_section, status, is_public, created_at'

function mapDashboardVideos(data: Record<string, unknown>[] | null): DashboardVideo[] {
  return (data || []).map((video) => ({
    ...(video as DashboardVideo),
    cover_image_path: getCoverImageUrl(video.cover_image_path as string | null | undefined) || undefined,
  }))
}

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

  return mapDashboardVideos(data)
}

/** Top titles by view count (parents only — excludes episodes and upcoming). */
export async function fetchTopViewedVideos(limit = 10): Promise<DashboardVideo[]> {
  const columnsWithViews =
    'id, title, description, cover_image_path, manifest_url, cloudflare_stream_uid, trailer_cloudflare_stream_uid, dashboard_section, status, is_public, created_at, view_count, parent_id, content_type'

  const columnsLegacy =
    'id, title, description, cover_image_path, manifest_url, cloudflare_stream_uid, dashboard_section, status, is_public, created_at, view_count, parent_id, content_type'

  const applyTopMoviesFilters = (builder: ReturnType<typeof supabase.from>) =>
    builder
      .eq('status', 'ready')
      .eq('is_public', true)
      .is('parent_id', null)
      .not('cloudflare_stream_uid', 'is', null)
      .or('dashboard_section.is.null,dashboard_section.neq.coming_soon')

  const query = (columns: string) =>
    applyTopMoviesFilters(
      supabase.from('video_assets').select(columns)
    )
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit * 2)

  let { data, error } = await query(columnsWithViews)

  if (error?.message?.includes('trailer_cloudflare_stream_uid')) {
    const fallback = await query(columnsLegacy)
    data = fallback.data
    error = fallback.error
  }

  // If view_count column is missing, fall back to newest playable titles
  if (error?.message?.includes('view_count')) {
    console.warn('view_count column missing — falling back to newest titles for Top Movies')
    const newest = await applyTopMoviesFilters(
      supabase.from('video_assets').select(DASHBOARD_VIDEO_COLUMNS_LEGACY)
    )
      .order('created_at', { ascending: false })
      .limit(limit * 2)

    if (newest.error) {
      console.error('Failed to fetch top viewed videos:', newest.error.message)
      return []
    }

    return mapDashboardVideos(newest.data)
      .filter((video) => video.dashboard_section !== 'coming_soon')
      .slice(0, limit)
  }

  if (error) {
    console.error('Failed to fetch top viewed videos:', error.message)
    return []
  }

  return mapDashboardVideos(data)
    .filter((video) => video.dashboard_section !== 'coming_soon' && Boolean(video.cloudflare_stream_uid))
    .slice(0, limit)
}

/** Prefer curated top_movies; if none are set, use highest view counts. */
export async function fetchTopMovies(limit = 10): Promise<DashboardVideo[]> {
  const curated = await fetchDashboardVideos('top_movies', limit)
  if (curated.length > 0) {
    return curated
  }
  return fetchTopViewedVideos(limit)
}
