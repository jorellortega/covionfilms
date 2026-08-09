'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Film, Loader2, Receipt, ExternalLink } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'
import { getCoverImageUrl } from '@/lib/cover-image'

type Receipt = {
  id: string
  videoId: string
  videoTitle: string
  parentTitle: string | null
  episodeNumber: number | null
  coverImagePath: string | null
  purchaseType: 'movie' | 'episode'
  amount: number
  amountLabel: string
  createdAt: string
  stripeCheckoutSessionId: string | null
  receiptNumber: string
}

type PurchasesResponse = {
  receipts: Receipt[]
  summary: {
    count: number
    movies: number
    episodes: number
    totalSpent: number
    totalSpentLabel: string
  }
}

export default function PurchasesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<PurchasesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.replace('/login?redirect=/purchases')
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          throw new Error('Please log in to view your purchases')
        }

        const response = await fetch('/api/purchases', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load purchases')
        }

        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load purchases')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span>Loading your receipts...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            My Purchases
          </h1>
          <p className="text-muted-foreground mt-1">
            Your movie and episode receipt history
          </p>
        </div>
        {user.role === 'admin' && (
          <Link href="/admin/purchases">
            <Button variant="outline">
              Purchase Tracker (all users)
            </Button>
          </Link>
        )}
      </div>

      {error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {data && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Receipts</CardDescription>
                  <CardTitle className="text-2xl">{data.summary.count}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Movies / Episodes</CardDescription>
                  <CardTitle className="text-2xl">
                    {data.summary.movies} / {data.summary.episodes}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total spent</CardDescription>
                  <CardTitle className="text-2xl">{data.summary.totalSpentLabel}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Receipts</CardTitle>
              <CardDescription>
                One-time unlocks for titles and episodes. Subscription access is managed separately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!data || data.receipts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-muted-foreground">No purchases yet.</p>
                  <Link href="/dashboard">
                    <Button variant="outline">Browse titles</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.receipts.map((receipt) => {
                    const thumb = getCoverImageUrl(receipt.coverImagePath)
                    return (
                      <div
                        key={receipt.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-gray-800 p-4"
                      >
                        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt={receipt.videoTitle}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Film className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium truncate">{receipt.videoTitle}</p>
                            <Badge
                              variant={receipt.purchaseType === 'movie' ? 'default' : 'secondary'}
                            >
                              {receipt.purchaseType}
                            </Badge>
                          </div>
                          {receipt.parentTitle && (
                            <p className="text-xs text-muted-foreground">
                              {receipt.parentTitle}
                              {receipt.episodeNumber != null
                                ? ` · Episode ${receipt.episodeNumber}`
                                : ''}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {receipt.receiptNumber} ·{' '}
                            {new Date(receipt.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0">
                          <p className="text-lg font-semibold">{receipt.amountLabel}</p>
                          <Link href={`/watch/${receipt.videoId}`}>
                            <Button size="sm" variant="outline">
                              Watch
                              <ExternalLink className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
