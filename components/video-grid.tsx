"use client"

import { VideoPreview } from "@/components/video-preview"
import { useVideos, Video } from "@/hooks/use-videos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Film, TrendingUp, Clock, Star } from "lucide-react"
import Link from "next/link"
import React from "react"

interface VideoGridProps {
  title: string
  subtitle?: string
  fetchFunction: () => Promise<void>
  videos: Video[]
  loading: boolean
  error: string | null
  mode: 'vertical' | 'horizontal' | 'grid'
  limit?: number
  showViewAll?: boolean
  viewAllLink?: string
  icon?: React.ReactNode
}

export function VideoGrid({
  title,
  subtitle,
  fetchFunction,
  videos,
  loading,
  error,
  mode,
  limit = 6,
  showViewAll = true,
  viewAllLink,
  icon
}: VideoGridProps) {
  const displayVideos = videos.slice(0, limit)

  const getIcon = () => {
    if (icon) return icon
    
    switch (title.toLowerCase()) {
      case 'trending':
      case 'top movies':
        return <TrendingUp className="h-5 w-5" />
      case 'new releases':
        return <Clock className="h-5 w-5" />
      case 'featured':
        return <Star className="h-5 w-5" />
      default:
        return <Film className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <Card className="border border-gray-700 bg-card">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            {getIcon()}
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading videos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-gray-700 bg-card">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            {getIcon()}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">Error loading videos: {error}</p>
            <Button onClick={fetchFunction} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (videos.length === 0) {
    return (
      <Card className="border border-gray-700 bg-card">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            {getIcon()}
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Film className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-muted-foreground">No videos available</p>
            {title.toLowerCase().includes('new') && (
              <p className="text-sm text-gray-500 mt-1">Upload some content to get started!</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderVideos = () => {
    switch (mode) {
      case 'vertical':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {displayVideos.map((video) => (
              <VideoPreview key={video.id} video={video} mode="vertical" />
            ))}
          </div>
        )
      
      case 'horizontal':
        return (
          <div className="space-y-4">
            {displayVideos.map((video) => (
              <VideoPreview key={video.id} video={video} mode="horizontal" />
            ))}
          </div>
        )
      
      case 'grid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayVideos.map((video) => (
              <VideoPreview key={video.id} video={video} mode="vertical" />
            ))}
          </div>
        )
      
      default:
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayVideos.map((video) => (
              <VideoPreview key={video.id} video={video} mode="vertical" />
            ))}
          </div>
        )
    }
  }

  return (
    <Card className="border border-gray-700 bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-primary flex items-center gap-2">
              {getIcon()}
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {showViewAll && videos.length > limit && (
            <Button variant="outline" size="sm" asChild>
              {viewAllLink ? (
                <Link href={viewAllLink}>
                  View All ({videos.length})
                </Link>
              ) : (
                <span>View All ({videos.length})</span>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderVideos()}
      </CardContent>
    </Card>
  )
}

// Specialized video grid components for different sections
export function NewReleasesGrid() {
  const { videos, loading, error, fetchNewReleases } = useVideos()
  
  return (
    <VideoGrid
      title="New Releases"
      subtitle="Latest videos from creators"
      fetchFunction={fetchNewReleases}
      videos={videos}
      loading={loading}
      error={error}
      mode="vertical"
      limit={6}
      showViewAll={true}
      viewAllLink="/new-releases"
    />
  )
}

export function TopMoviesGrid() {
  const { videos, loading, error, fetchTopVideos } = useVideos()
  
  return (
    <VideoGrid
      title="Top Movies"
      subtitle="Most popular videos"
      fetchFunction={fetchTopVideos}
      videos={videos}
      loading={loading}
      error={error}
      mode="horizontal"
      limit={4}
      showViewAll={true}
      viewAllLink="/top-movies"
    />
  )
}

export function FeaturedMoviesGrid() {
  const { videos, loading, error, fetchVideos } = useVideos({ limit: 6 })
  
  return (
    <VideoGrid
      title="Featured Movies"
      subtitle="Curated content for you"
      fetchFunction={fetchVideos}
      videos={videos}
      loading={loading}
      error={error}
      mode="grid"
      limit={6}
      showViewAll={true}
      viewAllLink="/featured"
    />
  )
}

export function UserVideosGrid({ userId }: { userId: string }) {
  const { videos, loading, error, fetchUserVideos } = useVideos()
  
  // Fetch user videos when component mounts
  React.useEffect(() => {
    fetchUserVideos(userId)
  }, [userId, fetchUserVideos])
  
  return (
    <VideoGrid
      title="My Videos"
      subtitle="Your uploaded content"
      fetchFunction={() => fetchUserVideos(userId)}
      videos={videos}
      loading={loading}
      error={error}
      mode="vertical"
      limit={4}
      showViewAll={true}
      viewAllLink="/my-videos"
    />
  )
}
