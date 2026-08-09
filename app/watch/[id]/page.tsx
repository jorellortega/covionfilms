'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Hls from 'hls.js'
import {
  getCloudflareStreamIframeUrl,
  isCloudflareStreamUrl,
  isDropboxUrl,
  isYouTubeUrl,
  toDropboxDirectUrl,
  toYouTubeEmbedUrl,
} from '@/lib/stream-url'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { WatchPaywall } from '@/components/watch-paywall'
import { WatchContentPanel } from '@/components/watch-content-panel'
import { toast } from '@/hooks/use-toast'
import type { AccessResult } from '@/lib/content-access'
import { formatUsd, type PurchaseType } from '@/lib/content-pricing'
import { useRecordPlay } from '@/hooks/use-record-play'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function WatchPage() {
  const params = useParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  
  const [videoData, setVideoData] = useState<any>(null)
  const [accessInfo, setAccessInfo] = useState<AccessResult | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seriesId, setSeriesId] = useState<string | null>(null)
  const [parentMovieInfo, setParentMovieInfo] = useState<{
    producer?: string | null
    release_year?: number | null
    trailer_cloudflare_stream_uid?: string | null
    title?: string | null
  } | null>(null)
  const [playbackMode, setPlaybackMode] = useState<'trailer' | 'full'>('trailer')

  const hasAccess = accessInfo?.hasAccess ?? false
  const { recordPlay } = useRecordPlay(params.id as string)
  const lastProgressRef = useRef(0)

  const trailerUid =
    videoData?.trailer_cloudflare_stream_uid ||
    parentMovieInfo?.trailer_cloudflare_stream_uid ||
    null

  const showingTrailer = Boolean(trailerUid) && playbackMode === 'trailer'
  const showingFullContent = playbackMode === 'full' && hasAccess
  const showingPaywall = !showingTrailer && !showingFullContent && Boolean(accessInfo) && !hasAccess


  useEffect(() => {
    // Reset player UI when switching titles; final mode is set after access check.
    // Keep full intent when navigating from the episode grid (?play=full).
    const wantsFull =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('play') === 'full'
    setPlaybackMode(wantsFull ? 'full' : 'trailer')
    setAccessInfo(null)
  }, [params.id])

  const handleWatchFull = () => {
    if (hasAccess) {
      setVideoData((prev: any) =>
        prev?.cloudflare_stream_uid
          ? {
              ...prev,
              cloudflare_iframe_url: getCloudflareStreamIframeUrl(prev.cloudflare_stream_uid),
            }
          : prev
      )
      setPlaybackMode('full')
      return
    }

    if (!user) {
      router.push(`/login?redirect=/watch/${params.id}`)
      return
    }

    // No access — start purchase for the full title / episode
    void handlePurchase(accessInfo?.isEpisode ? 'episode' : 'movie')
  }

  const handlePlayEpisode = (episodeId: string) => {
    if (episodeId === params.id) {
      handleWatchFull()
      return
    }
    router.push(`/watch/${episodeId}?play=full`)
  }

  const fetchAccess = async (videoId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch(`/api/watch/access?videoId=${videoId}`, {
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    })

    if (!response.ok) {
      throw new Error('Failed to check access')
    }

    return response.json()
  }

  const handlePurchase = async (purchaseType: PurchaseType, targetVideoId?: string) => {
    const videoId = targetVideoId || (params.id as string)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push(`/login?redirect=/watch/${videoId}`)
      return
    }

    setIsPurchasing(true)

    try {
      const response = await fetch('/api/watch/purchase', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          purchaseType,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Purchase failed')
      }

      if (result.alreadyOwned) {
        if (videoId !== params.id) {
          router.push(`/watch/${videoId}`)
          setIsPurchasing(false)
          return
        }

        const access = await fetchAccess(videoId)
        setAccessInfo(access)
        setVideoData((prev: any) =>
          prev?.cloudflare_stream_uid
            ? {
                ...prev,
                cloudflare_iframe_url: getCloudflareStreamIframeUrl(prev.cloudflare_stream_uid),
              }
            : prev
        )
        setPlaybackMode('full')
        toast({
          title: 'Already unlocked',
          description: 'You already have access to this title.',
        })
        setIsPurchasing(false)
        return
      }

      if (!result.url) {
        throw new Error('No checkout URL returned')
      }

      window.location.href = result.url
    } catch (err: any) {
      toast({
        title: 'Purchase failed',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      })
      setIsPurchasing(false)
    }
  }

  useEffect(() => {
    const paramsSearch = new URLSearchParams(window.location.search)
    const purchase = paramsSearch.get('purchase')
    const sessionId = paramsSearch.get('session_id')
    const videoId = params.id as string

    if (!purchase || !videoId) return

    const finish = async () => {
      if (purchase === 'canceled') {
        toast({
          title: 'Purchase canceled',
          description: 'No charge was made.',
          variant: 'destructive',
        })
        window.history.replaceState({}, '', `/watch/${videoId}`)
        return
      }

      if (purchase === 'success' && sessionId?.startsWith('cs_')) {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          toast({
            title: 'Payment received — log in to unlock',
            description: 'Sign in with the same account you used to pay.',
          })
          router.push(`/login?redirect=/watch/${videoId}`)
          return
        }

        try {
          const response = await fetch('/api/stripe/sync-purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ sessionId }),
          })
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error || 'Could not unlock purchase')
          }

          const access = await fetchAccess(videoId)
          setAccessInfo(access)
          setVideoData((prev: any) =>
            prev?.cloudflare_stream_uid
              ? {
                  ...prev,
                  cloudflare_iframe_url: getCloudflareStreamIframeUrl(prev.cloudflare_stream_uid),
                }
              : prev
          )
          setPlaybackMode('full')

          toast({
            title: 'Purchase successful',
            description: 'You can now watch this title.',
          })
        } catch (err: any) {
          toast({
            title: 'Payment received, unlock pending',
            description: err.message || 'Refresh in a moment if playback is still locked.',
            variant: 'destructive',
          })
        }

        window.history.replaceState({}, '', `/watch/${videoId}`)
      }
    }

    void finish()
  }, [params.id, router])

  useEffect(() => {
    const loadVideo = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        
        // Get video data from database
        const { data, error: dbError } = await supabase
          .from('video_assets')
          .select('*')
          .eq('id', params.id)
          .maybeSingle()

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`)
        }

        if (!data) {
          throw new Error('Video not found')
        }

        // Upcoming poster-only titles use a dedicated page (no stream yet)
        const isUpcomingListing =
          data.dashboard_section === 'coming_soon' &&
          !data.cloudflare_stream_uid &&
          !data.manifest_url

        if (isUpcomingListing) {
          router.replace(`/upcoming/${data.id}`)
          return
        }

        // Check if video is ready
        if (data.status !== 'ready') {
          throw new Error('Video is not ready for playback')
        }

        setVideoData(data)

        let parentInfo: {
          producer?: string | null
          release_year?: number | null
          trailer_cloudflare_stream_uid?: string | null
          title?: string | null
        } | null = null

        if (data.parent_id) {
          const { data: parent } = await supabase
            .from('video_assets')
            .select('producer, release_year, trailer_cloudflare_stream_uid, title')
            .eq('id', data.parent_id)
            .maybeSingle()
          parentInfo = parent
          setParentMovieInfo(parent)
        } else {
          setParentMovieInfo(null)
        }

        let resolvedSeriesId: string | null = null
        if (data.parent_id) {
          resolvedSeriesId = data.parent_id
        } else if (data.content_type === 'series') {
          resolvedSeriesId = data.id
        } else {
          const { count } = await supabase
            .from('video_assets')
            .select('id', { count: 'exact', head: true })
            .eq('parent_id', data.id)

          if (count && count > 0) {
            resolvedSeriesId = data.id
          }
        }

        setSeriesId(resolvedSeriesId)

        if (data.content_type === 'series' && !data.cloudflare_stream_uid && !data.manifest_url) {
          const { data: firstEpisode } = await supabase
            .from('video_assets')
            .select('id')
            .eq('parent_id', data.id)
            .order('episode_number', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (firstEpisode?.id) {
            router.replace(`/watch/${firstEpisode.id}`)
            return
          }
        }

        const access = await fetchAccess(params.id as string)
        setAccessInfo(access)

        const hasTrailer = Boolean(
          data.trailer_cloudflare_stream_uid || parentInfo?.trailer_cloudflare_stream_uid
        )
        const isEpisode =
          Boolean(data.parent_id) ||
          data.content_type === 'episode' ||
          Boolean(access.isEpisode)

        const playFullParam =
          typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('play') === 'full'

        // Unlocked episodes should play full content (not the series trailer).
        // ?play=full is set when picking an episode from the grid.
        if (access.hasAccess && (isEpisode || playFullParam || !hasTrailer)) {
          setPlaybackMode('full')
        } else if (hasTrailer) {
          setPlaybackMode('trailer')
        } else if (access.hasAccess) {
          setPlaybackMode('full')
        } else {
          setLoading(false)
          return
        }

        if (playFullParam) {
          window.history.replaceState({}, '', `/watch/${params.id}`)
        }

        if (!access.hasAccess) {
          // Trailer-only preview until they unlock
          setLoading(false)
          return
        }

        let manifestUrl = data.manifest_url
        if (!manifestUrl && !data.cloudflare_stream_uid) {
          if (hasTrailer) {
            setLoading(false)
            return
          }
          throw new Error('No manifest URL found')
        }

        console.log('📹 Video manifest URL:', manifestUrl)

        const isYouTube = isYouTubeUrl(manifestUrl)
        const isCloudflareStream = isCloudflareStreamUrl(manifestUrl) || Boolean(data.cloudflare_stream_uid)
        
        if (data.cloudflare_stream_uid) {
          setVideoData({
            ...data,
            cloudflare_iframe_url: getCloudflareStreamIframeUrl(data.cloudflare_stream_uid),
          })
          setLoading(false)
          return
        }

        if (isYouTube) {
          manifestUrl = toYouTubeEmbedUrl(manifestUrl)
          console.log('✅ Using YouTube embed URL:', manifestUrl)
          
          // Update videoData with the embed URL
          setVideoData({ ...data, manifest_url: manifestUrl })
          // YouTube videos need iframe embedding, not video element
          setLoading(false)
          return
        }

        // Check if this is a Dropbox URL and convert to direct download if needed
        const isDropbox = isDropboxUrl(manifestUrl)
        console.log('🔍 Checking URL type - isDropbox:', isDropbox, 'isCloudflareStream:', isCloudflareStream, 'URL:', manifestUrl)
        
        if (isDropbox) {
          console.log('📦 Processing Dropbox URL...')
          const originalUrl = manifestUrl
          manifestUrl = toDropboxDirectUrl(manifestUrl)
          console.log('✅ Converted Dropbox URL')
          console.log('   Original:', originalUrl)
          console.log('   Converted:', manifestUrl)
          
          // Update videoData with the converted URL
          setVideoData({ ...data, manifest_url: manifestUrl })
          console.log('📦 Updated videoData with Dropbox URL:', manifestUrl)
        }

        // For non-YouTube videos, set videoData now
        // If Dropbox, use the converted URL, otherwise use original data
        if (isDropbox) {
          // videoData already set with converted URL above
          console.log('📦 Using converted Dropbox URL in videoData')
        } else {
          setVideoData(data)
        }

        // Function to try loading video with error handling
        const tryLoadVideo = async (url: string, isBackup = false) => {
          return new Promise<void>((resolve, reject) => {
            if (!videoRef.current) {
              reject(new Error('Video element not available'))
              return
            }

            if (url.includes('.m3u8') || url.includes('application/vnd.apple.mpegurl') || isCloudflareStreamUrl(url)) {
              // HLS stream
              if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari iOS native HLS support
                videoRef.current.src = url
                videoRef.current.onloadedmetadata = () => {
                  console.log('✅ Using native HLS support')
                  setLoading(false)
                  resolve()
                }
                videoRef.current.onerror = () => {
                  if (!isBackup && data.backup_url) {
                    console.log('⚠️ Primary URL failed, trying backup...')
                    tryLoadVideo(data.backup_url, true).then(resolve).catch(reject)
                  } else {
                    reject(new Error('Failed to load video'))
                  }
                }
              } else if (Hls.isSupported()) {
                // Use HLS.js for other browsers
                const hls = new Hls({
                  enableWorker: true,
                  lowLatencyMode: true,
                  backBufferLength: 90
                })
                
                hlsRef.current = hls
                hls.loadSource(url)
                hls.attachMedia(videoRef.current)
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  console.log('✅ HLS manifest parsed')
                  setLoading(false)
                  resolve()
                })
                
                hls.on(Hls.Events.ERROR, (event, errorData) => {
                  console.error('❌ HLS error:', errorData)
                  if (errorData.fatal) {
                    if (!isBackup && data.backup_url) {
                      console.log('⚠️ Primary URL failed, trying backup...')
                      if (hlsRef.current) {
                        hlsRef.current.destroy()
                        hlsRef.current = null
                      }
                      tryLoadVideo(data.backup_url, true).then(resolve).catch(reject)
                    } else {
                      setError(`HLS Error: ${errorData.details}`)
                      reject(new Error(`HLS Error: ${errorData.details}`))
                    }
                  }
                })
                
                console.log('✅ Using HLS.js')
              } else {
                // Fallback: let the browser try
                videoRef.current.src = url
                videoRef.current.onloadedmetadata = () => {
                  console.log('✅ Using direct video URL')
                  setLoading(false)
                  resolve()
                }
                videoRef.current.onerror = () => {
                  if (!isBackup && data.backup_url) {
                    console.log('⚠️ Primary URL failed, trying backup...')
                    tryLoadVideo(data.backup_url, true).then(resolve).catch(reject)
                  } else {
                    reject(new Error('Failed to load video'))
                  }
                }
              }
            } else {
              // Direct video URL (MP4, Dropbox, etc.) - use native video element
              // For Dropbox URLs, we need to set crossOrigin
              if (url.includes('dropbox.com')) {
                videoRef.current.crossOrigin = 'anonymous'
                console.log('📦 Setting crossOrigin for Dropbox URL')
              }
              
              videoRef.current.src = url
              videoRef.current.onloadedmetadata = () => {
                console.log('✅ Using direct video URL:', url.includes('dropbox.com') ? 'Dropbox' : 'Direct')
                setLoading(false)
                resolve()
              }
              videoRef.current.onerror = (e) => {
                console.error('❌ Video element error:', e, 'URL:', url)
                if (!isBackup && data.backup_url) {
                  console.log('⚠️ Primary URL failed, trying backup...')
                  tryLoadVideo(data.backup_url, true).then(resolve).catch(reject)
                } else {
                  reject(new Error(`Failed to load video. URL: ${url}`))
                }
              }
            }
          })
        }

        // Initialize HLS player for direct URLs and HLS streams
        // Skip initialization for YouTube (already handled) and Dropbox (handled in render)
        console.log('🎬 Initializing video player - isYouTube:', isYouTube, 'isDropbox:', isDropbox, 'videoRef.current:', !!videoRef.current)
        
        if (!isYouTube && !isDropbox && videoRef.current) {
          console.log('📹 Loading non-Dropbox/non-YouTube video via tryLoadVideo')
          tryLoadVideo(manifestUrl).catch((err) => {
            console.error('❌ Failed to load video:', err)
            setError(err.message || 'Failed to load video')
            setLoading(false)
          })
        } else if (isDropbox) {
          console.log('📦 Dropbox video detected - will be handled by video element in render')
          console.log('   manifestUrl:', manifestUrl)
          // Dropbox video will be loaded by the video element's src attribute in the render
          // Just set loading to false initially, the video element will handle loading
          setLoading(false)
        } else {
          console.log('⚠️ No video initialization needed (YouTube or other case)')
        }

      } catch (err: any) {
        console.error('❌ Error loading video:', err)
        setError(err.message || 'Failed to load video')
        setLoading(false)
      }
    }

    loadVideo()

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [params.id, user?.id, user?.subscription, router])

  useEffect(() => {
    if (hasAccess && videoData && !loading) {
      recordPlay('start')
    }
  }, [hasAccess, videoData, loading, recordPlay])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      const seconds = Math.floor(video.currentTime)
      if (seconds - lastProgressRef.current >= 30) {
        lastProgressRef.current = seconds
        recordPlay('progress', seconds)
      }
    }
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => {
      setIsPlaying(true)
      recordPlay('start')
    }
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      recordPlay('complete', Math.floor(video.duration || 0))
    }
    const handleLoadedMetadata = () => setLoading(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [recordPlay])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Video</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Loading Video...</h2>
            <p className="text-muted-foreground">Please wait while we prepare your video for streaming</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Video Player */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{videoData?.title || 'Video Player'}</CardTitle>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative bg-black rounded-lg overflow-hidden">
              {showingTrailer ? (
                <div className="w-full space-y-3">
                  <div className="aspect-video w-full">
                    <iframe
                      src={getCloudflareStreamIframeUrl(trailerUid!)}
                      className="w-full h-full border-0"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      title={`${videoData?.title || 'Video'} trailer`}
                      onLoad={() => setLoading(false)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-primary font-semibold">
                        Trailer
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Preview only — unlock to watch the full title
                        {accessInfo?.isEpisode ? ' or this episode' : ''}.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleWatchFull} disabled={isPurchasing}>
                        <Play className="h-4 w-4 mr-2" />
                        {hasAccess
                          ? accessInfo?.isEpisode
                            ? 'Watch episode'
                            : 'Watch full movie'
                          : accessInfo?.isEpisode
                            ? `Buy episode — ${formatUsd(accessInfo.pricing.episode)}`
                            : `Watch full movie — ${formatUsd(accessInfo?.pricing.movie ?? 4.25)}`}
                      </Button>
                      {!hasAccess && accessInfo?.isEpisode && (
                        <Button
                          variant="outline"
                          onClick={() => handlePurchase('movie')}
                          disabled={isPurchasing}
                        >
                          Buy full series — {formatUsd(accessInfo.pricing.movie)}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : showingPaywall && accessInfo ? (
                <WatchPaywall
                  title={videoData?.title || 'Video'}
                  isEpisode={accessInfo.isEpisode}
                  parentTitle={accessInfo.parentTitle || parentMovieInfo?.title}
                  moviePrice={accessInfo.pricing.movie}
                  episodePrice={accessInfo.pricing.episode}
                  subscriptionTier={accessInfo.subscriptionTier}
                  isLoggedIn={Boolean(user)}
                  isPurchasing={isPurchasing}
                  onPurchaseMovie={() => handlePurchase('movie')}
                  onPurchaseEpisode={() => handlePurchase('episode')}
                />
              ) : showingFullContent && videoData?.cloudflare_stream_uid ? (
                <div className="aspect-video w-full relative">
                  <iframe
                    src={videoData.cloudflare_iframe_url || getCloudflareStreamIframeUrl(videoData.cloudflare_stream_uid)}
                    className="w-full h-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title={videoData.title}
                    onLoad={() => {
                      setLoading(false)
                      recordPlay('start')
                    }}
                  />
                  {trailerUid && (
                    <div className="absolute top-3 right-3 z-10">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-black/70 hover:bg-black/90"
                        onClick={() => setPlaybackMode('trailer')}
                      >
                        Back to trailer
                      </Button>
                    </div>
                  )}
                </div>
              ) : videoData?.cloudflare_stream_uid && hasAccess ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={videoData.cloudflare_iframe_url || getCloudflareStreamIframeUrl(videoData.cloudflare_stream_uid)}
                    className="w-full h-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title={videoData.title}
                    onLoad={() => {
                      setLoading(false)
                      recordPlay('start')
                    }}
                  />
                </div>
              ) : videoData?.manifest_url && 
              (videoData.manifest_url.includes('youtube.com/embed/') || 
               videoData.manifest_url.includes('youtube.com') || 
               videoData.manifest_url.includes('youtu.be')) ? (
                // YouTube iframe
                <div className="aspect-video w-full">
                  <iframe
                    src={
                      videoData.manifest_url.includes('youtube.com/embed/') 
                        ? videoData.manifest_url
                        : (() => {
                            // Convert to embed if needed
                            const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
                            const match = videoData.manifest_url.match(youtubeRegex)
                            return match && match[1] 
                              ? `https://www.youtube.com/embed/${match[1]}`
                              : videoData.manifest_url
                          })()
                    }
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={videoData.title}
                    onLoad={() => {
                      console.log('✅ YouTube iframe loaded')
                      setLoading(false)
                    }}
                    onError={() => {
                      console.error('❌ YouTube iframe failed to load')
                      setError('Failed to load YouTube video')
                      setLoading(false)
                    }}
                  />
                </div>
              ) : videoData?.manifest_url?.includes('dropbox.com') ? (
                // Dropbox video - use iframe with blob URL workaround or direct link
                (() => {
                  console.log('🎬 Rendering Dropbox video element')
                  console.log('   manifest_url:', videoData.manifest_url)
                  
                  // Dropbox doesn't support CORS for video streaming
                  // We'll use a workaround: create an iframe that loads the video
                  // Or use a proxy URL if available
                  
                  // Try using the direct download link without CORS restrictions
                  // Note: This may not work due to CORS, but we'll try
                  const dropboxUrl = videoData.manifest_url
                  
                  return (
                    <div className="w-full space-y-4">
                      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                        <p className="text-yellow-200 text-sm">
                          ⚠️ Dropbox videos may not play due to CORS restrictions. 
                          If the video doesn't load, please use a different video source.
                        </p>
                      </div>
                      <video
                        ref={videoRef}
                        className="w-full h-auto max-h-[70vh]"
                        controls
                        playsInline
                        preload="auto"
                        src={dropboxUrl}
                        // Don't use crossOrigin - Dropbox doesn't support CORS headers
                        // This will likely fail due to CORS, but we'll try anyway
                        onLoadStart={() => {
                          console.log('📥 Dropbox video onLoadStart fired')
                        }}
                        onLoadedMetadata={() => {
                          console.log('✅ Dropbox video onLoadedMetadata fired')
                          if (videoRef.current) {
                            console.log('   Duration:', videoRef.current.duration)
                            console.log('   Video width:', videoRef.current.videoWidth)
                            console.log('   Video height:', videoRef.current.videoHeight)
                          }
                          setLoading(false)
                        }}
                        onCanPlay={() => {
                          console.log('✅ Dropbox video onCanPlay fired')
                        }}
                        onCanPlayThrough={() => {
                          console.log('✅ Dropbox video can play through')
                        }}
                        onError={(e) => {
                          console.error('❌ Dropbox video onError fired')
                          console.error('   Event:', e)
                          if (videoRef.current?.error) {
                            console.error('   Error code:', videoRef.current.error.code)
                            console.error('   Error message:', videoRef.current.error.message)
                            
                            const errorMessages: { [key: number]: string } = {
                              1: 'MEDIA_ERR_ABORTED - Video loading aborted',
                              2: 'MEDIA_ERR_NETWORK - Network error while loading video',
                              3: 'MEDIA_ERR_DECODE - Video decoding error',
                              4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - CORS error: Dropbox does not allow cross-origin video streaming'
                            }
                            console.error('   Error meaning:', errorMessages[videoRef.current.error.code] || 'Unknown error')
                          }
                          setError('Dropbox videos cannot be streamed directly due to CORS restrictions. Please download the video or use a different hosting service (YouTube, direct hosting, etc.).')
                          setLoading(false)
                        }}
                        onStalled={() => {
                          console.warn('⚠️ Dropbox video stalled')
                        }}
                        onWaiting={() => {
                          console.warn('⏳ Dropbox video waiting for data')
                        }}
                      />
                    </div>
                  )
                })()
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-auto max-h-[70vh]"
                    controls
                    playsInline
                    preload="metadata"
                  />
                  
                  {/* Custom Controls Overlay - only for non-YouTube videos */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
                    <div className="flex items-center justify-between text-white pointer-events-auto">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={togglePlay}
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={toggleMute}
                          className="text-white hover:bg-white/20"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        
                        <span className="text-sm">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Video Info */}
        {videoData && (
          <Card>
            <CardHeader>
              <CardTitle>Video Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{videoData.title}</h3>
                {videoData.description && (
                  <p className="text-muted-foreground mt-1">{videoData.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Views</span>
                  <p className="text-muted-foreground">
                    {(videoData.view_count ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Duration</span>
                  <p className="text-muted-foreground">
                    {videoData.duration
                      ? `${Math.floor(videoData.duration / 60)}:${(videoData.duration % 60).toString().padStart(2, '0')}`
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Producer</span>
                  <p className="text-muted-foreground">
                    {videoData.producer || parentMovieInfo?.producer || '—'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Year</span>
                  <p className="text-muted-foreground">
                    {videoData.release_year || parentMovieInfo?.release_year || '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {videoData && accessInfo && (
          <WatchContentPanel
            videoId={params.id as string}
            seriesId={seriesId}
            videoTitle={videoData.title}
            videoDescription={videoData.description}
            accessInfo={accessInfo}
            isLoggedIn={Boolean(user)}
            isPurchasing={isPurchasing}
            onPurchase={handlePurchase}
            onPlayEpisode={handlePlayEpisode}
          />
        )}
      </div>
    </div>
  )
}
