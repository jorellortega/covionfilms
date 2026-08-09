'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Receipt, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabaseClient'

type PurchaseRow = {
  id: string
  userId: string
  userEmail: string | null
  userName: string | null
  userRole: string | null
  videoId: string
  videoTitle: string
  parentTitle: string | null
  episodeNumber: number | null
  purchaseType: 'movie' | 'episode'
  amount: number
  amountLabel: string
  createdAt: string
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
}

type PurchasesResponse = {
  purchases: PurchaseRow[]
  summary: {
    total: number
    movies: number
    episodes: number
    revenue: number
    revenueLabel: string
  }
}

export default function AdminPurchasesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<PurchasesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'episode'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadPurchases = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (search.trim()) params.set('q', search.trim())

      const response = await fetch(`/api/admin/content-purchases?${params.toString()}`, {
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
  }, [search, typeFilter])

  useEffect(() => {
    if (authLoading) return

    if (!user || user.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    void loadPurchases()
  }, [user, authLoading, router, loadPurchases])

  const handleDelete = async (purchase: PurchaseRow) => {
    const confirmed = window.confirm(
      `Remove this ${purchase.purchaseType} purchase for ${purchase.userEmail || purchase.userId}? This is useful for clearing sandbox test buys.`
    )
    if (!confirmed) return

    try {
      setDeletingId(purchase.id)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/admin/content-purchases', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ purchaseId: purchase.id }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete purchase')
      }

      toast({
        title: 'Purchase removed',
        description: `${purchase.videoTitle} unlock cleared for ${purchase.userEmail || 'user'}.`,
      })
      await loadPurchases()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete purchase',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (authLoading || (loading && !data)) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span>Loading purchases...</span>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
            Purchase Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Admin view of every user&apos;s movie and episode purchases. Delete clears sandbox unlocks.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadPurchases()} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total purchases</CardDescription>
              <CardTitle className="text-2xl">{data.summary.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Movies</CardDescription>
              <CardTitle className="text-2xl">{data.summary.movies}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Episodes</CardDescription>
              <CardTitle className="text-2xl">{data.summary.episodes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Revenue</CardDescription>
              <CardTitle className="text-2xl">{data.summary.revenueLabel}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            All user purchases
          </CardTitle>
          <CardDescription>
            Admin-only: delete removes the unlock from the app (useful for clearing Stripe sandbox
            test buys). The Stripe charge itself stays in Stripe Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search email, name, title, Stripe session…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-sm"
            />
            <Select
              value={typeFilter}
              onValueChange={(value: 'all' | 'movie' | 'episode') => setTypeFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="movie">Movies</SelectItem>
                <SelectItem value="episode">Episodes</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => void loadPurchases()} disabled={loading}>
              Apply
            </Button>
          </div>

          {error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={() => void loadPurchases()}>Retry</Button>
            </div>
          ) : !data || data.purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No purchases found.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Stripe</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(purchase.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {purchase.userName || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {purchase.userEmail || purchase.userId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/watch/${purchase.videoId}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {purchase.videoTitle}
                        </Link>
                        {purchase.parentTitle && (
                          <div className="text-xs text-muted-foreground">
                            {purchase.parentTitle}
                            {purchase.episodeNumber != null
                              ? ` · Ep ${purchase.episodeNumber}`
                              : ''}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={purchase.purchaseType === 'movie' ? 'default' : 'secondary'}>
                          {purchase.purchaseType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{purchase.amountLabel}</TableCell>
                      <TableCell className="max-w-[140px]">
                        {purchase.stripeCheckoutSessionId ? (
                          <span
                            className="block truncate text-xs text-muted-foreground font-mono"
                            title={purchase.stripeCheckoutSessionId}
                          >
                            {purchase.stripeCheckoutSessionId}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === purchase.id}
                          onClick={() => void handleDelete(purchase)}
                        >
                          {deletingId === purchase.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
