"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Film, Clock, Star, RefreshCw } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

interface Video {
  id: string
  title: string
  cover_image_path?: string
  dashboard_section?: string
  status?: string
  is_public?: boolean
}

interface MockRelease {
  id: string
  title: string
  genre: string
  releaseDate: string
  isMock: true
}

export function NewReleases() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Mock releases to fill empty slots
  const mockReleases: MockRelease[] = [
    {
      id: 'mock-1',
      title: 'The Last Frontier',
      genre: 'Sci-Fi',
      releaseDate: 'Coming Soon',
      isMock: true
    },
    {
      id: 'mock-2',
      title: 'Midnight Dreams',
      genre: 'Thriller',
      releaseDate: 'Coming Soon',
      isMock: true
    },
    {
      id: 'mock-3',
      title: 'Ocean\'s Heart',
      genre: 'Adventure',
      releaseDate: 'Coming Soon',
      isMock: true
    },
    {
      id: 'mock-4',
      title: 'City Lights',
      genre: 'Drama',
      releaseDate: 'Coming Soon',
      isMock: true
    },
    {
      id: 'mock-5',
      title: 'The Silent Echo',
      genre: 'Mystery',
      releaseDate: 'Coming Soon',
      isMock: true
    }
  ]

  useEffect(() => {
    // Fetch videos when component mounts
    fetchNewReleases()
  }, [])

  const getCoverImageUrl = (coverImagePath?: string): string | null => {
    if (!coverImagePath) {
      console.log('No coverImagePath provided to getCoverImageUrl')
      return null
    }
    
    console.log('getCoverImageUrl called with:', coverImagePath)
    
    // If it's already a full URL, return it
    if (coverImagePath.startsWith('http://') || coverImagePath.startsWith('https://')) {
      console.log('Returning full URL:', coverImagePath)
      return coverImagePath
    }
    
    // If it's a storage path, try both buckets
    if (coverImagePath.startsWith('videos/') || coverImagePath.startsWith('covers/')) {
      // Try both buckets
      for (const bucketName of ['covionfilms', 'videos']) {
        try {
          const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(coverImagePath)
          const url = data?.publicUrl || null
          if (url) {
            console.log(`Converted storage path to URL using "${bucketName}":`, coverImagePath, '->', url)
            return url
          }
        } catch (err) {
          console.log(`Failed to get URL from "${bucketName}":`, err)
        }
      }
      return null
    }
    
    // If it starts with /, it's a relative path
    if (coverImagePath.startsWith('/')) {
      console.log('Returning relative path:', coverImagePath)
      return coverImagePath
    }
    
    // Try to get public URL from storage (assume it's a storage path without prefix)
    // Try both buckets
    for (const bucketName of ['covionfilms', 'videos']) {
      try {
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(coverImagePath)
        const url = data?.publicUrl || null
        if (url) {
          console.log(`Tried to get public URL from "${bucketName}":`, coverImagePath, '->', url)
          return url
        }
      } catch (err) {
        console.log(`Failed to get URL from "${bucketName}":`, err)
      }
    }
    return null
  }

  const fetchNewReleases = async () => {
    try {
      setLoading(true)
      
      // Fetch from both videos and video_assets tables
      const [videosData, videoAssetsData] = await Promise.all([
        // Fetch from videos table
        supabase
          .from('videos')
          .select('id, title, cover_image_path, dashboard_section, status, is_public, created_at')
          .eq('dashboard_section', 'new_releases')
          .eq('status', 'ready')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Fetch from video_assets table
        supabase
          .from('video_assets')
          .select('id, title, cover_image_path, dashboard_section, status, is_public, created_at')
          .eq('dashboard_section', 'new_releases')
          .eq('status', 'ready')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      // Combine results
      let allVideos: Video[] = [
        ...(videosData.data || []),
        ...(videoAssetsData.data || [])
      ]

      // Sort by created_at and limit to 5
      allVideos.sort((a, b) => 
        new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime()
      )
      allVideos = allVideos.slice(0, 5)

      // Only show videos explicitly set to new_releases section
      // No fallback to recent videos - only show what's in the new_releases section

      // Convert cover image paths to public URLs
      const videosWithCoverUrls = allVideos.map(video => ({
        ...video,
        cover_image_path: getCoverImageUrl(video.cover_image_path) || undefined
      }))

      console.log('Fetched videos:', videosWithCoverUrls)
      setVideos(videosWithCoverUrls)
    } catch (error) {
      console.error('Error fetching new releases:', error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  // Combine actual videos with mock releases to always show 5 items
  const getDisplayItems = () => {
    const actualVideos = videos.slice(0, 5) // Take up to 5 actual videos
    const remainingSlots = 5 - actualVideos.length
    
    if (remainingSlots <= 0) {
      return actualVideos
    }
    
    // Fill remaining slots with mock releases
    const selectedMocks = mockReleases.slice(0, remainingSlots)
    return [...actualVideos, ...selectedMocks]
  }

  const handleVideoClick = (videoId: string) => {
    // Only navigate if it's a real video (not a mock)
    if (!videoId.startsWith('mock-')) {
      console.log('Clicking on video with ID:', videoId)
      console.log('Video details:', videos.find(v => v.id === videoId))
      router.push(`/watch/${videoId}`)
    }
  }

  // Show mock data immediately without loading state
  const displayItems = getDisplayItems()

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">New Releases</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {videos.length > 0 ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {videos.length} new video{videos.length !== 1 ? 's' : ''} available
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Coming soon
              </span>
            )}
          </div>
          <button
            onClick={fetchNewReleases}
            disabled={loading}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Check for new videos"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      {loading && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Checking for new videos...</span>
          </div>
        </div>
      )}
      
      {/* Debug info - remove this later */}
      {videos.length > 0 && (
        <div className="bg-gray-800 p-3 rounded text-xs text-muted-foreground">
          <div className="font-medium mb-2">Debug: Fetched Videos</div>
          {videos.map((video, index) => (
            <div key={video.id} className="flex gap-4 mb-1">
              <span>{index + 1}.</span>
              <span className="text-white">{video.title}</span>
              <span>Section: {video.dashboard_section || 'none'}</span>
              <span>Status: {video.status}</span>
              <span>Public: {video.is_public ? 'Yes' : 'No'}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Debug display items */}
      <div className="bg-gray-800 p-3 rounded text-xs text-muted-foreground">
        <div className="font-medium mb-2">Debug: Display Items (what user sees)</div>
        {displayItems.map((item, index) => (
          <div key={index} className="flex gap-4 mb-1">
            <span>{index + 1}.</span>
            <span className="text-white">
              {('isMock' in item) ? `Mock: ${(item as MockRelease).title}` : `Video: ${(item as Video).title}`}
            </span>
            <span>ID: {('isMock' in item) ? (item as MockRelease).id : (item as Video).id}</span>
            <span>Type: {('isMock' in item) ? 'Mock' : 'Real'}</span>
          </div>
        ))}
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap rounded-md border border-gray-700">
        <div className="flex w-max space-x-4 p-4">
          {displayItems.map((item) => {
            // Check if it's a mock release
            if ('isMock' in item) {
              const mockItem = item as MockRelease
              return (
                <Card
                  key={mockItem.id}
                  className="w-[150px] h-[225px] flex items-center justify-center bg-card relative overflow-hidden border border-gray-700 hover:border-primary/50 transition-colors group"
                >
                  <CardContent className="p-0 w-full h-full">
                    <div className="flex flex-col items-center justify-center h-full space-y-3 p-4 text-center">
                      <div className="relative">
                        <Film className="h-12 w-12 text-muted-foreground opacity-60 group-hover:opacity-80 transition-opacity" />
                        <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                          <Clock className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                          {mockItem.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {mockItem.genre}
                        </p>
                        <div className="flex items-center justify-center gap-1 text-xs text-yellow-500">
                          <Star className="h-3 w-3" />
                          <span>Coming Soon</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }
            
            // Actual video
            const video = item as Video
            return (
              <Card
                key={video.id}
                className="w-[150px] h-[225px] flex items-center justify-center bg-card relative overflow-hidden border border-gray-700 hover:border-primary/50 transition-colors group cursor-pointer"
                onClick={() => handleVideoClick(video.id)}
              >
                <CardContent className="p-0 w-full h-full">
                  {/* New badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      NEW
                    </div>
                  </div>
                  
                  {video.cover_image_path ? (
                    <Image
                      src={video.cover_image_path}
                      alt={video.title}
                      width={150}
                      height={225}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
                      <Film className="h-12 w-12 text-muted-foreground opacity-50 group-hover:opacity-70 transition-opacity" />
                      <p className="text-center text-sm text-muted-foreground opacity-50 group-hover:opacity-70 transition-opacity">
                        {video.title}
                      </p>
                    </div>
                  )}
                  {/* Overlay with title on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex items-end">
                    <div className="w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-sm font-medium text-center">
                        {video.title}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}

