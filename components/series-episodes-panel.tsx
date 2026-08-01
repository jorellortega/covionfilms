'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { EpisodeGrid, SubscriptionBanner } from '@/components/episode-grid'
import type { EpisodeAccess } from '@/lib/content-access'
import type { SeriesAccessResult } from '@/lib/content-access'

type SeriesEpisodesPanelProps = {
  seriesId: string
  currentEpisodeId?: string
  onEpisodeSelect?: (episode: EpisodeAccess) => void
}

export function SeriesEpisodesPanel({
  seriesId,
  currentEpisodeId,
  onEpisodeSelect,
}: SeriesEpisodesPanelProps) {
  const router = useRouter()
  const [seriesData, setSeriesData] = useState<SeriesAccessResult | null>(null)
  const [activeTab, setActiveTab] = useState<'synopsis' | 'episodes'>('episodes')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch(`/api/watch/episodes?seriesId=${seriesId}`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        })

        if (!response.ok) {
          throw new Error('Failed to load episodes')
        }

        const data = await response.json()
        setSeriesData(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadEpisodes()
  }, [seriesId])

  const handleSelectEpisode = (episode: EpisodeAccess) => {
    if (onEpisodeSelect) {
      onEpisodeSelect(episode)
      return
    }

    router.push(`/watch/${episode.id}`)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading episodes...
        </CardContent>
      </Card>
    )
  }

  if (!seriesData || seriesData.episodes.length === 0) {
    return null
  }

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
              <SubscriptionBanner subscriptionTier={seriesData.subscriptionTier} />
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
              {seriesData.series.description || 'No synopsis available.'}
            </p>
          ) : (
            <EpisodeGrid
              episodes={seriesData.episodes}
              selectedEpisodeId={currentEpisodeId}
              onSelectEpisode={handleSelectEpisode}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
