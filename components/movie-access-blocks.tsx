'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatUsd } from '@/lib/content-pricing'
import type { AccessResult } from '@/lib/content-access'
import { Lock, Play, Sparkles, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'

type MovieAccessBlocksProps = {
  title: string
  accessInfo: AccessResult
  isLoggedIn: boolean
  isPurchasing: boolean
  onPurchaseMovie: () => void
}

export function MovieAccessBlocks({
  title,
  accessInfo,
  isLoggedIn,
  isPurchasing,
  onPurchaseMovie,
}: MovieAccessBlocksProps) {
  const isLocked = !accessInfo.hasAccess
  const hasSubscription =
    accessInfo.subscriptionTier === 'standard' || accessInfo.subscriptionTier === 'family'

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-800">
          <SubscriptionBanner subscriptionTier={accessInfo.subscriptionTier} />
        </div>

        <div className="flex gap-6 px-4 border-b border-gray-800">
          <button type="button" className="py-3 text-sm border-b-2 -mb-px border-primary text-white font-medium">
            Watch
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">{title}</p>

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8 max-w-md">
            <button
              type="button"
              onClick={isLocked ? onPurchaseMovie : undefined}
              className={cn(
                'relative aspect-square rounded-md text-sm font-medium transition-colors',
                isLocked
                  ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  : 'bg-red-900/80 text-white ring-2 ring-red-500'
              )}
            >
              <span>1</span>
              {isLocked ? (
                <Lock className="absolute top-1 right-1 h-3 w-3 text-zinc-400" />
              ) : (
                <Unlock className="absolute top-1 right-1 h-3 w-3 text-green-400" />
              )}
            </button>
          </div>

          {isLocked && (
            <div className="space-y-3 pt-2">
              <Button className="w-full" onClick={onPurchaseMovie} disabled={isPurchasing}>
                <Play className="h-4 w-4 mr-2" />
                Buy full movie — {formatUsd(accessInfo.pricing.movie)}
              </Button>

              {!hasSubscription && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/subscribe">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Subscribe for unlimited access
                  </Link>
                </Button>
              )}

              {!isLoggedIn && (
                <p className="text-sm text-center text-muted-foreground">
                  <Link href="/login" className="text-primary hover:underline">Log in</Link>
                  {' '}to purchase
                </p>
              )}
            </div>
          )}

          {!isLocked && (
            <p className="text-sm text-green-500 flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              {accessInfo.reason === 'subscription'
                ? 'Included with your subscription'
                : accessInfo.reason === 'purchase'
                  ? 'You own this title'
                  : 'Free to watch'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SubscriptionBanner({ subscriptionTier }: { subscriptionTier: string }) {
  if (subscriptionTier === 'standard' || subscriptionTier === 'family') {
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
        <span className="text-zinc-300">Unlock with Standard or Family</span>
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
