'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { EpisodeAccess } from '@/lib/content-access'
import { cn } from '@/lib/utils'

const EPISODES_PER_PAGE = 25

type EpisodeGridProps = {
  episodes: EpisodeAccess[]
  selectedEpisodeId?: string
  onSelectEpisode: (episode: EpisodeAccess) => void
}

export function EpisodeGrid({ episodes, selectedEpisodeId, onSelectEpisode }: EpisodeGridProps) {
  const [activeRange, setActiveRange] = useState(0)

  const ranges = useMemo(() => {
    const chunks: { label: string; start: number; episodes: EpisodeAccess[] }[] = []

    for (let i = 0; i < episodes.length; i += EPISODES_PER_PAGE) {
      const slice = episodes.slice(i, i + EPISODES_PER_PAGE)
      const start = slice[0]?.episode_number || i + 1
      const end = slice[slice.length - 1]?.episode_number || i + slice.length
      chunks.push({
        label: `${start}-${end}`,
        start: i,
        episodes: slice,
      })
    }

    return chunks
  }, [episodes])

  const visibleEpisodes = ranges[activeRange]?.episodes || episodes

  if (episodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No episodes uploaded yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {ranges.length > 1 && (
        <div className="flex gap-4 border-b border-gray-800 pb-2">
          {ranges.map((range, index) => (
            <button
              key={range.label}
              type="button"
              onClick={() => setActiveRange(index)}
              className={cn(
                'text-sm pb-2 -mb-2 border-b-2 transition-colors',
                activeRange === index
                  ? 'text-white border-primary font-medium'
                  : 'text-muted-foreground border-transparent hover:text-white'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {visibleEpisodes.map((episode) => {
          const isSelected = episode.id === selectedEpisodeId
          const isLocked = !episode.hasAccess

          return (
            <button
              key={episode.id}
              type="button"
              onClick={() => onSelectEpisode(episode)}
              className={cn(
                'relative aspect-square rounded-md text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-red-900/80 text-white ring-2 ring-red-500'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              )}
            >
              <span>{episode.episode_number || '?'}</span>
              {isLocked && (
                <Lock className="absolute top-1 right-1 h-3 w-3 text-zinc-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type SubscriptionBannerProps = {
  subscriptionTier: string
}

export function SubscriptionBanner({ subscriptionTier }: SubscriptionBannerProps) {
  if (subscriptionTier === 'standard' || subscriptionTier === 'family') {
    return null
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
