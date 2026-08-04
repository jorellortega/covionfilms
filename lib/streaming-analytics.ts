import { supabaseServer } from '@/lib/supabaseServer'

export type RecordPlayInput = {
  videoId: string
  userId?: string | null
  sessionId?: string
  event: 'start' | 'progress' | 'complete'
  watchSeconds?: number
}

export async function recordPlayEvent(input: RecordPlayInput): Promise<{ success: boolean; error?: string }> {
  if (!supabaseServer) {
    return { success: false, error: 'Server configuration error' }
  }

  const { videoId, userId, sessionId, event, watchSeconds = 0 } = input

  const { data: video, error: videoError } = await supabaseServer
    .from('video_assets')
    .select('id')
    .eq('id', videoId)
    .maybeSingle()

  if (videoError || !video) {
    return { success: false, error: 'Video not found' }
  }

  if (event === 'start') {
    if (sessionId) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const { data: recent } = await supabaseServer
        .from('video_play_events')
        .select('id')
        .eq('video_id', videoId)
        .eq('session_id', sessionId)
        .gte('created_at', thirtyMinutesAgo)
        .limit(1)
        .maybeSingle()

      if (recent) {
        return { success: true }
      }
    }

    const { error: incrementError } = await supabaseServer.rpc('increment_video_view_count', {
      video_id: videoId,
    })

    if (incrementError) {
      const { data: current } = await supabaseServer
        .from('video_assets')
        .select('view_count')
        .eq('id', videoId)
        .single()

      const { error: updateError } = await supabaseServer
        .from('video_assets')
        .update({ view_count: (current?.view_count || 0) + 1 })
        .eq('id', videoId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }
    }

    const { error: insertError } = await supabaseServer.from('video_play_events').insert({
      video_id: videoId,
      user_id: userId || null,
      session_id: sessionId || null,
      watch_seconds: 0,
      completed: false,
    })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true }
  }

  if (!sessionId) {
    return { success: true }
  }

  const { data: latestEvent } = await supabaseServer
    .from('video_play_events')
    .select('id')
    .eq('video_id', videoId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestEvent) {
    return { success: true }
  }

  const { error: updateError } = await supabaseServer
    .from('video_play_events')
    .update({
      watch_seconds: watchSeconds,
      completed: event === 'complete',
    })
    .eq('id', latestEvent.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

export type StreamingAnalyticsSummary = {
  totalViews: number
  totalPlayEvents: number
  uniqueVideosWatched: number
  viewsLast7Days: { date: string; count: number }[]
  topVideos: {
    id: string
    title: string
    content_type?: string | null
    view_count: number
    recent_plays: number
  }[]
  recentPlays: {
    id: string
    video_id: string
    video_title: string
    user_id: string | null
    watch_seconds: number
    completed: boolean
    created_at: string
  }[]
}

export async function getStreamingAnalytics(): Promise<StreamingAnalyticsSummary | null> {
  if (!supabaseServer) return null

  const { data: videos } = await supabaseServer
    .from('video_assets')
    .select('id, title, content_type, view_count')
    .order('view_count', { ascending: false })
    .limit(20)

  const totalViews = (videos || []).reduce((sum, video) => sum + (video.view_count || 0), 0)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: recentEvents } = await supabaseServer
    .from('video_play_events')
    .select('id, video_id, user_id, watch_seconds, completed, created_at')
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })

  const allEvents = recentEvents || []
  const totalPlayEvents = allEvents.length
  const uniqueVideosWatched = new Set(allEvents.map((event) => event.video_id)).size

  const videoTitleMap = new Map((videos || []).map((video) => [video.id, video.title]))

  const { data: allVideosForTitles } = await supabaseServer
    .from('video_assets')
    .select('id, title')

  for (const video of allVideosForTitles || []) {
    videoTitleMap.set(video.id, video.title)
  }

  const viewsByDate = new Map<string, number>()
  for (const event of allEvents) {
    const date = event.created_at.slice(0, 10)
    viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1)
  }

  const viewsLast7Days: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    viewsLast7Days.push({ date, count: viewsByDate.get(date) || 0 })
  }

  const recentPlaysByVideo = new Map<string, number>()
  for (const event of allEvents) {
    recentPlaysByVideo.set(event.video_id, (recentPlaysByVideo.get(event.video_id) || 0) + 1)
  }

  const topVideos = (videos || [])
    .map((video) => ({
      id: video.id,
      title: video.title,
      content_type: video.content_type,
      view_count: video.view_count || 0,
      recent_plays: recentPlaysByVideo.get(video.id) || 0,
    }))
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 10)

  const recentPlays = allEvents.slice(0, 25).map((event) => ({
    id: event.id,
    video_id: event.video_id,
    video_title: videoTitleMap.get(event.video_id) || 'Unknown',
    user_id: event.user_id,
    watch_seconds: event.watch_seconds || 0,
    completed: Boolean(event.completed),
    created_at: event.created_at,
  }))

  return {
    totalViews,
    totalPlayEvents,
    uniqueVideosWatched,
    viewsLast7Days,
    topVideos,
    recentPlays,
  }
}
