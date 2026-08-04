'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Play, Eye, Film, TrendingUp } from 'lucide-react'
import type { StreamingAnalyticsSummary } from '@/lib/streaming-analytics'

export default function StreamingAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<StreamingAnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user || user.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    const loadAnalytics = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('Not authenticated')
        }

        const response = await fetch('/api/admin/streaming-analytics', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load analytics')
        }

        setAnalytics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span>Loading streaming analytics...</span>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-400 mb-4">{error || 'Failed to load analytics'}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const chartData = analytics.viewsLast7Days.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    plays: day.count,
  }))

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
            Streaming Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            View counts and play activity across all video assets
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Views</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              {analytics.totalViews.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All-time play starts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plays (7 days)</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Play className="h-6 w-6 text-primary" />
              {analytics.totalPlayEvents.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Play sessions this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Videos Watched</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Film className="h-6 w-6 text-primary" />
              {analytics.uniqueVideosWatched.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Unique titles (7 days)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top Title Views</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              {analytics.topVideos[0]?.view_count.toLocaleString() || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground truncate">
              {analytics.topVideos[0]?.title || 'No data yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plays — Last 7 Days</CardTitle>
          <CardDescription>Daily play session count</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="plays" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Videos</CardTitle>
            <CardDescription>Ranked by total view count</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topVideos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No views recorded yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topVideos.map((video, index) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{video.title}</p>
                        <div className="flex gap-2 mt-1">
                          {video.content_type && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {video.content_type}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {video.recent_plays} plays this week
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary">{video.view_count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Plays</CardTitle>
            <CardDescription>Latest streaming activity</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentPlays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {analytics.recentPlays.map((play) => (
                  <div
                    key={play.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/watch/${play.video_id}`}
                        className="font-medium hover:text-primary truncate block"
                      >
                        {play.video_title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(play.created_at).toLocaleString()}
                        {play.user_id ? ' · logged in' : ' · guest'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {play.completed ? (
                        <Badge className="bg-green-600">Completed</Badge>
                      ) : (
                        <Badge variant="secondary">{play.watch_seconds}s</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
