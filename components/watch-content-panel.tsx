'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { EpisodeGrid } from '@/components/episode-grid'
import { MovieAccessBlocks } from '@/components/movie-access-blocks'
import type { AccessResult, EpisodeAccess, SeriesAccessResult } from '@/lib/content-access'
import { hasPaidSubscriptionAccess, type PurchaseType } from '@/lib/content-pricing'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

type WatchContentPanelProps = {
  videoId: string
  seriesId: string | null
  videoTitle: string
  videoDescription?: string | null
  accessInfo: AccessResult | null
  isLoggedIn: boolean
  isPurchasing: boolean
  viewerSubscription?: string | null
  onPurchase: (type: PurchaseType, videoId?: string) => void
  onPlayEpisode?: (episodeId: string) => void
}

function SubscriptionBanner({ subscriptionTier }: { subscriptionTier: string }) {
  if (hasPaidSubscriptionAccess(subscriptionTier)) {
    return (
      <p className="text-sm text-green-400 flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Included with your {subscriptionTier} plan
      </p>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-amber-900/40 to-zinc-900 border border-amber-700/30 px-4 py-3">
      <p className="text-sm">
        <span className="font-semibold text-amber-200">COVION VIP:</span>{' '}
        <span className="text-zinc-300">Unlock all episodes with Standard or Family</span>
      </p>
      <Link
        href="/subscribe"
        className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-amber-400"
      >
        GO
      </Link>
    </div>
  )
}

export function WatchContentPanel({
  videoId,
  seriesId,
  videoTitle,
  videoDescription,
  accessInfo,
  isLoggedIn,
  isPurchasing,
  viewerSubscription,
  onPurchase,
  onPlayEpisode,
}: WatchContentPanelProps) {
  const router = useRouter()
  const [seriesData, setSeriesData] = useState<SeriesAccessResult | null>(null)
  const [activeTab, setActiveTab] = useState<'synopsis' | 'episodes'>('episodes')
  const [loading, setLoading] = useState(Boolean(seriesId))

  useEffect(() => {
    if (!seriesId) {
      setLoading(false)
      return
    }

    const loadEpisodes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch(`/api/watch/episodes?seriesId=${seriesId}`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        })

        if (response.ok) {
          const data = await response.json()
          setSeriesData(data)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadEpisodes()
  }, [seriesId])

  const resolvedTier =
    [seriesData?.subscriptionTier, accessInfo?.subscriptionTier, viewerSubscription].find((tier) =>
      hasPaidSubscriptionAccess(tier)
    ) ||
    seriesData?.subscriptionTier ||
    accessInfo?.subscriptionTier ||
    'free'

  const handleSelectEpisode = (episode: EpisodeAccess) => {
    const canPlay =
      episode.hasAccess ||
      episode.is_free ||
      Boolean(seriesData?.hasFullAccess) ||
      hasPaidSubscriptionAccess(resolvedTier)

    if (canPlay) {
      if (onPlayEpisode) {
        onPlayEpisode(episode.id)
      } else {
        router.push(`/watch/${episode.id}?play=full`)
      }
      return
    }

    if (!isLoggedIn) {
      router.push(`/login?redirect=/watch/${episode.id}`)
      return
    }

    if (isPurchasing) return

    // Locked episode — charge for this episode before play
    onPurchase('episode', episode.id)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    )
  }

  if (seriesData && seriesData.episodes.length > 0) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex gap-4 p-4 border-b border-gray-800">
            {seriesData.series.cover_image_path && (
              <div className="relative w-20 h-28 flex-shrink-0 rounded overflow-hidden">
                <Image
                  src={seriesData.series.cover_image_path}
                  alt={seriesData.series.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{seriesData.series.title}</h2>
              <div className="mt-3">
                <SubscriptionBanner subscriptionTier={resolvedTier} />
              </div>
            </div>
          </div>

          <div className="flex gap-6 px-4 border-b border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('synopsis')}
              className={`py-3 text-sm border-b-2 -mb-px ${
                activeTab === 'synopsis'
                  ? 'border-primary text-white font-medium'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              Synopsis
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('episodes')}
              className={`py-3 text-sm border-b-2 -mb-px ${
                activeTab === 'episodes'
                  ? 'border-primary text-white font-medium'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              Episodes
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'synopsis' ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {seriesData.series.description || videoDescription || 'No synopsis available.'}
              </p>
            ) : (
              <EpisodeGrid
                episodes={seriesData.episodes}
                selectedEpisodeId={videoId}
                onSelectEpisode={handleSelectEpisode}
                episodePrice={seriesData.pricing.episode}
                hasFullAccess={seriesData.hasFullAccess || hasPaidSubscriptionAccess(resolvedTier)}
                subscriptionTier={resolvedTier}
              />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (accessInfo) {
    return (
      <MovieAccessBlocks
        title={videoTitle}
        accessInfo={accessInfo}
        isLoggedIn={isLoggedIn}
        isPurchasing={isPurchasing}
        onPurchaseMovie={() => onPurchase('movie')}
      />
    )
  }

  return null
}
