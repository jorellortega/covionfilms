import { supabaseServer } from '@/lib/supabaseServer'
import { getCoverImageUrl } from '@/lib/cover-image'
import {
  EPISODE_PURCHASE_PRICE,
  MOVIE_PURCHASE_PRICE,
  hasPaidSubscriptionAccess,
  isEpisodeContent,
  normalizeSubscriptionTier,
  type PurchaseType,
} from '@/lib/content-pricing'

export type VideoAsset = {
  id: string
  title: string
  description?: string | null
  content_type?: string | null
  parent_id?: string | null
  episode_number?: number | null
  is_free?: boolean | null
  status?: string
  manifest_url?: string | null
  cloudflare_stream_uid?: string | null
  duration?: number | null
  producer?: string | null
  release_year?: number | null
  resolution?: string | null
  file_size?: number | null
  cover_image_path?: string | null
}

export type EpisodeAccess = {
  id: string
  episode_number: number
  title: string
  is_free: boolean
  hasAccess: boolean
  reason: AccessResult['reason']
  status?: string
  cover_image_path?: string | null
}

export type SeriesAccessResult = {
  series: VideoAsset
  episodes: EpisodeAccess[]
  subscriptionTier: string
  hasFullAccess: boolean
  pricing: {
    movie: number
    episode: number
  }
}

export type AccessResult = {
  hasAccess: boolean
  reason: 'subscription' | 'purchase' | 'admin' | 'none'
  subscriptionTier: string
  isEpisode: boolean
  movieVideoId: string
  parentTitle?: string | null
  pricing: {
    movie: number
    episode: number
  }
}

const ADMIN_ROLES = new Set(['admin', 'management'])

async function getParentVideo(parentId: string): Promise<VideoAsset | null> {
  if (!supabaseServer) return null

  const { data } = await supabaseServer
    .from('video_assets')
    .select('id, title, description, content_type, parent_id, episode_number, is_free, status')
    .eq('id', parentId)
    .maybeSingle()

  return data
}

async function getParentTitle(parentId: string): Promise<string | null> {
  const parent = await getParentVideo(parentId)
  return parent?.title || null
}

async function getUserPurchases(userId: string) {
  if (!supabaseServer) return []

  const { data } = await supabaseServer
    .from('content_purchases')
    .select('video_id, purchase_type')
    .eq('user_id', userId)

  return data || []
}

function hasSubscriptionAccess(subscriptionTier: string, userRole?: string | null) {
  if (userRole && ADMIN_ROLES.has(userRole)) return true
  return hasPaidSubscriptionAccess(subscriptionTier)
}

export async function checkEpisodeAccess(
  episode: VideoAsset,
  parent: VideoAsset | null,
  userId?: string | null,
  userRole?: string | null,
  subscriptionTier = 'free',
  purchases?: { video_id: string; purchase_type: string }[]
): Promise<{ hasAccess: boolean; reason: AccessResult['reason'] }> {
  if (hasSubscriptionAccess(subscriptionTier, userRole)) {
    return { hasAccess: true, reason: 'subscription' }
  }

  if (parent?.is_free || episode.is_free) {
    return { hasAccess: true, reason: 'none' }
  }

  const movieVideoId = parent?.id || episode.id
  const userPurchases = purchases ?? (userId ? await getUserPurchases(userId) : [])

  const hasMoviePurchase = userPurchases.some(
    (purchase) => purchase.purchase_type === 'movie' && purchase.video_id === movieVideoId
  )

  if (hasMoviePurchase) {
    return { hasAccess: true, reason: 'purchase' }
  }

  const hasEpisodePurchase = userPurchases.some(
    (purchase) => purchase.purchase_type === 'episode' && purchase.video_id === episode.id
  )

  if (hasEpisodePurchase) {
    return { hasAccess: true, reason: 'purchase' }
  }

  return { hasAccess: false, reason: 'none' }
}

export async function getSeriesAccess(
  seriesId: string,
  userId?: string | null,
  userRole?: string | null,
  subscriptionTier = 'free'
): Promise<SeriesAccessResult | null> {
  if (!supabaseServer) return null

  const { data: series } = await supabaseServer
    .from('video_assets')
    .select('*')
    .eq('id', seriesId)
    .maybeSingle()

  if (!series) return null

  const { data: episodes } = await supabaseServer
    .from('video_assets')
    .select('id, title, episode_number, is_free, status, content_type, parent_id, cover_image_path')
    .eq('parent_id', seriesId)
    .order('episode_number', { ascending: true })

  const normalizedTier = normalizeSubscriptionTier(subscriptionTier)
  const purchases = userId ? await getUserPurchases(userId) : []
  const episodeAccessList: EpisodeAccess[] = []

  for (const episode of episodes || []) {
    const access = await checkEpisodeAccess(
      episode,
      series,
      userId,
      userRole,
      normalizedTier,
      purchases
    )

    episodeAccessList.push({
      id: episode.id,
      episode_number: episode.episode_number || 0,
      title: episode.title,
      is_free: Boolean(episode.is_free || series.is_free),
      hasAccess: access.hasAccess,
      reason: userRole && ADMIN_ROLES.has(userRole) ? 'admin' : access.reason,
      status: episode.status,
      cover_image_path: getCoverImageUrl(episode.cover_image_path),
    })
  }

  const hasFullAccess =
    hasSubscriptionAccess(normalizedTier, userRole) ||
    Boolean(series.is_free) ||
    purchases.some((purchase) => purchase.purchase_type === 'movie' && purchase.video_id === seriesId)

  return {
    series,
    episodes: episodeAccessList,
    subscriptionTier: normalizedTier,
    hasFullAccess,
    pricing: {
      movie: MOVIE_PURCHASE_PRICE,
      episode: EPISODE_PURCHASE_PRICE,
    },
  }
}

export async function checkVideoAccess(
  video: VideoAsset,
  userId?: string | null,
  userRole?: string | null,
  subscriptionTier = 'free'
): Promise<AccessResult> {
  const isEpisode = isEpisodeContent(video.content_type, video.parent_id)
  const movieVideoId = isEpisode && video.parent_id ? video.parent_id : video.id
  const normalizedTier = normalizeSubscriptionTier(subscriptionTier)

  const base: AccessResult = {
    hasAccess: false,
    reason: 'none',
    subscriptionTier: normalizedTier,
    isEpisode,
    movieVideoId,
    parentTitle: isEpisode && video.parent_id ? await getParentTitle(video.parent_id) : null,
    pricing: {
      movie: MOVIE_PURCHASE_PRICE,
      episode: EPISODE_PURCHASE_PRICE,
    },
  }

  if (userRole && ADMIN_ROLES.has(userRole)) {
    return { ...base, hasAccess: true, reason: 'admin' }
  }

  if (hasPaidSubscriptionAccess(normalizedTier)) {
    return { ...base, hasAccess: true, reason: 'subscription' }
  }

  if (video.is_free) {
    return { ...base, hasAccess: true, reason: 'none' }
  }

  if (isEpisode && video.parent_id) {
    const parent = await getParentVideo(video.parent_id)
    if (parent?.is_free) {
      return { ...base, hasAccess: true, reason: 'none' }
    }
  }

  if (!userId || !supabaseServer) {
    return base
  }

  const purchases = await getUserPurchases(userId)

  const hasMoviePurchase = purchases?.some(
    (purchase) => purchase.purchase_type === 'movie' && purchase.video_id === movieVideoId
  )

  if (hasMoviePurchase) {
    return { ...base, hasAccess: true, reason: 'purchase' }
  }

  if (isEpisode) {
    const hasEpisodePurchase = purchases?.some(
      (purchase) => purchase.purchase_type === 'episode' && purchase.video_id === video.id
    )

    if (hasEpisodePurchase) {
      return { ...base, hasAccess: true, reason: 'purchase' }
    }
  }

  return base
}

export async function recordPurchase(
  userId: string,
  video: VideoAsset,
  purchaseType: PurchaseType,
  userRole = 'user',
  subscriptionTier = 'free'
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseServer) {
    return { success: false, error: 'Server configuration error' }
  }

  const isEpisode = isEpisodeContent(video.content_type, video.parent_id)
  const movieVideoId = isEpisode && video.parent_id ? video.parent_id : video.id

  if (purchaseType === 'episode' && !isEpisode) {
    return { success: false, error: 'This title is not sold as a single episode' }
  }

  const targetVideoId = purchaseType === 'movie' ? movieVideoId : video.id
  const amount = purchaseType === 'movie' ? MOVIE_PURCHASE_PRICE : EPISODE_PURCHASE_PRICE

  const access = await checkVideoAccess(video, userId, userRole, subscriptionTier)
  if (access.hasAccess) {
    return { success: true }
  }

  const { error } = await supabaseServer.from('content_purchases').insert({
    user_id: userId,
    video_id: targetVideoId,
    purchase_type: purchaseType,
    amount,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: true }
    }
    return { success: false, error: error.message }
  }

  return { success: true }
}
