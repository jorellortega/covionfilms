'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Film, Lock } from 'lucide-react'
import type { EpisodeAccess } from '@/lib/content-access'
import { EPISODE_PURCHASE_PRICE, formatUsd } from '@/lib/content-pricing'
import { cn } from '@/lib/utils'

const EPISODES_PER_PAGE = 25

type EpisodeGridProps = {
  episodes: EpisodeAccess[]
  selectedEpisodeId?: string
  onSelectEpisode: (episode: EpisodeAccess) => void
  episodePrice?: number
  hasFullAccess?: boolean
}

function getEpisodePricingLabel(
  episode: EpisodeAccess,
  episodePrice: number,
  hasFullAccess: boolean
): { badge: string; detail: string; unlocked: boolean; showLock: boolean } {
  if (episode.is_free) {
    return {
      badge: 'Free',
      detail: 'Free to watch',
      unlocked: true,
      showLock: false,
    }
  }

  const unlocked = episode.hasAccess || hasFullAccess

  if (unlocked && episode.reason === 'purchase') {
    return {
      badge: 'Owned',
      detail: 'Purchased',
      unlocked: true,
      showLock: false,
    }
  }

  if (unlocked) {
    return {
      badge: formatUsd(episodePrice),
      detail: 'Included with your access',
      unlocked: true,
      showLock: false,
    }
  }

  return {
    badge: formatUsd(episodePrice),
    detail: `Buy for ${formatUsd(episodePrice)}`,
    unlocked: false,
    showLock: true,
  }
}

export function EpisodeGrid({
  episodes,
  selectedEpisodeId,
  onSelectEpisode,
  episodePrice = EPISODE_PURCHASE_PRICE,
  hasFullAccess = false,
}: EpisodeGridProps) {
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {visibleEpisodes.map((episode) => {
          const isSelected = episode.id === selectedEpisodeId
          const thumb = episode.cover_image_path || null
          const pricing = getEpisodePricingLabel(episode, episodePrice, hasFullAccess)

          return (
            <button
              key={episode.id}
              type="button"
              onClick={() => onSelectEpisode(episode)}
              className={cn(
                'group relative overflow-hidden rounded-md text-left transition-colors',
                isSelected
                  ? 'ring-2 ring-red-500'
                  : 'ring-1 ring-transparent hover:ring-zinc-600'
              )}
            >
              <div className="relative aspect-video bg-zinc-800">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={episode.title}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder.svg'
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film className="h-6 w-6 text-zinc-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                {pricing.showLock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <Lock className="h-12 w-12 text-white drop-shadow-lg sm:h-14 sm:w-14" strokeWidth={2.25} />
                  </div>
                )}
                <span className="absolute bottom-1.5 left-2 text-xs font-semibold text-white">
                  {episode.episode_number || '?'}
                </span>
                {episode.is_free ? (
                  <span className="absolute top-2 right-2 inline-flex items-center rounded-md bg-green-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                    Free
                  </span>
                ) : (
                  <span
                    className={cn(
                      'absolute top-2 right-2 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide shadow-md',
                      pricing.unlocked
                        ? 'bg-emerald-800 text-emerald-100'
                        : 'bg-black/85 text-amber-300'
                    )}
                  >
                    {pricing.badge}
                  </span>
                )}
              </div>
              <div className="space-y-0.5 px-1.5 py-1.5">
                <p
                  className={cn(
                    'truncate text-xs',
                    isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'
                  )}
                >
                  {episode.title}
                </p>
                <p
                  className={cn(
                    'text-[11px] font-medium',
                    pricing.unlocked ? 'text-green-400' : 'text-amber-400'
                  )}
                >
                  {pricing.detail}
                </p>
              </div>
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
