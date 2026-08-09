'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatUsd } from '@/lib/content-pricing'
import { Lock, Play, Sparkles } from 'lucide-react'

type WatchPaywallProps = {
  title: string
  isEpisode: boolean
  parentTitle?: string | null
  moviePrice: number
  episodePrice: number
  subscriptionTier: string
  isLoggedIn: boolean
  isPurchasing: boolean
  onPurchaseMovie: () => void
  onPurchaseEpisode: () => void
}

export function WatchPaywall({
  title,
  isEpisode,
  parentTitle,
  moviePrice,
  episodePrice,
  subscriptionTier,
  isLoggedIn,
  isPurchasing,
  onPurchaseMovie,
  onPurchaseEpisode,
}: WatchPaywallProps) {
  const movieLabel = isEpisode
    ? `Buy full ${parentTitle || 'series'}`
    : `Buy full movie`

  return (
    <div className="aspect-video w-full bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-6">
      <Card className="w-full max-w-lg border-primary/30 bg-black/80 backdrop-blur">
        <CardContent className="pt-6 space-y-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-7 w-7 text-primary" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Unlock to Watch</h3>
            <p className="text-sm text-muted-foreground">
              {title}
              {isEpisode && parentTitle ? ` · ${parentTitle}` : ''}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={onPurchaseMovie}
              disabled={isPurchasing}
            >
              <Play className="h-4 w-4 mr-2" />
              {movieLabel} — {formatUsd(moviePrice)}
            </Button>

            {isEpisode && (
              <Button
                className="w-full"
                variant="outline"
                size="lg"
                onClick={onPurchaseEpisode}
                disabled={isPurchasing}
              >
                Buy this episode — {formatUsd(episodePrice)}
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Included with Standard or Family plans
            </div>
            <p className="text-xs text-muted-foreground">
              {subscriptionTier === 'standard' || subscriptionTier === 'family'
                ? 'Your plan includes this title.'
                : 'Subscribe to Standard or Family to watch without paying per title.'}
            </p>
            {subscriptionTier !== 'standard' && subscriptionTier !== 'family' && (
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link href="/subscribe">View Plans</Link>
              </Button>
            )}
          </div>

          {!isLoggedIn && (
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>{' '}
              or{' '}
              <Link href="/signup" className="text-primary hover:underline">
                create an account
              </Link>{' '}
              first — then you&apos;ll be charged via Stripe to unlock.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
