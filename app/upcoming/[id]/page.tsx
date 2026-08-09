'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clapperboard, Clock, Film, User } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCoverImageUrl } from '@/lib/cover-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type UpcomingTitle = {
  id: string
  title: string
  description?: string | null
  genre?: string | null
  producer?: string | null
  release_year?: number | null
  cover_image_path?: string | null
  content_type?: string | null
  dashboard_section?: string | null
  cloudflare_stream_uid?: string | null
  trailer_cloudflare_stream_uid?: string | null
  status?: string | null
}

export default function UpcomingMoviePage() {
  const params = useParams()
  const router = useRouter()
  const [movie, setMovie] = useState<UpcomingTitle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const id = params.id as string
      if (!id) return

      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('video_assets')
          .select(
            'id, title, description, genre, producer, release_year, cover_image_path, content_type, dashboard_section, cloudflare_stream_uid, trailer_cloudflare_stream_uid, status'
          )
          .eq('id', id)
          .maybeSingle()

        if (fetchError) throw fetchError
        if (!data) {
          setError('Title not found')
          return
        }

        // If it already has full playback, send people to the watch page
        if (data.cloudflare_stream_uid) {
          router.replace(`/watch/${id}`)
          return
        }

        setMovie(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load title')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        Loading upcoming title...
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-4">
        <p className="text-red-400">{error || 'Title not found'}</p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const coverUrl = getCoverImageUrl(movie.cover_image_path)

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        {coverUrl && (
          <div className="absolute inset-0">
            <Image
              src={coverUrl}
              alt=""
              fill
              className="object-cover opacity-25 blur-xl scale-110"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-background/90 to-background" />
          </div>
        )}

        <div className="relative container mx-auto px-4 py-8 max-w-5xl">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="grid gap-8 md:grid-cols-[240px_1fr] items-start">
            <Card className="overflow-hidden border-gray-800 bg-card/80">
              <CardContent className="p-0">
                <div className="relative aspect-[2/3] w-full bg-zinc-900">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      unoptimized
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                      <Film className="h-16 w-16 opacity-50" />
                      <span className="text-sm">No poster yet</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-amber-500 text-black hover:bg-amber-500 gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-amber-400 font-semibold">
                  Upcoming Movie
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{movie.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {movie.genre && (
                    <Badge variant="secondary" className="capitalize">
                      {movie.genre}
                    </Badge>
                  )}
                  {movie.content_type && (
                    <Badge variant="outline" className="capitalize">
                      {movie.content_type}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-800 bg-card/50 p-4 flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Release
                    </p>
                    <p className="font-medium text-lg">
                      {movie.release_year ? String(movie.release_year) : 'Date TBA'}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-card/50 p-4 flex items-start gap-3">
                  <User className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Producer
                    </p>
                    <p className="font-medium text-lg">{movie.producer || 'TBA'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Clapperboard className="h-4 w-4" />
                  Synopsis
                </div>
                <p className="text-base leading-relaxed text-zinc-200 whitespace-pre-wrap">
                  {movie.description?.trim() || 'Details coming soon.'}
                </p>
              </div>

              <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
                This title isn&apos;t available to stream yet. Check back when it releases
                {movie.release_year ? ` in ${movie.release_year}` : ''}.
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button variant="outline">Browse more titles</Button>
                </Link>
                <Link href="/subscribe">
                  <Button>Get notified with a plan</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
