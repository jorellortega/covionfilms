"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Play, Film } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ViewIcon } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { useDashboardVisibility } from "@/hooks/use-dashboard-visibility"

const INITIAL_SAMPLE_REELS = [
  {
    id: 1,
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Let%20Him%20Cook-isKfCTVLTppLzecVTitfIZy4d0Ufsr.mp4",
    title: "Let Him Cook",
    creator: "JOR",
    thumbnail: "/placeholder.svg?height=200&width=150",
  },
  {
    id: 2,
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/clip%201-XDkwPQ7DMyh02nV6jArfdBRbZVNjuj.mp4",
    title: "Clip 1",
    creator: "Unknown",
    thumbnail: "/placeholder.svg?height=200&width=150",
  },
  // Add more placeholder reels to fill the row
  ...Array(8)
    .fill(null)
    .map((_, index) => ({
      id: index + 3,
      url: "",
      title: `Reel ${index + 3}`,
      creator: "Coming Soon",
      thumbnail: "/placeholder.svg?height=200&width=150",
    })),
]

interface ReelsRowProps {
  shuffleMode: boolean
}

interface NewReleaseVideo {
  id: string
  title: string
  cover_image_path?: string
  dashboard_section?: string
  status?: string
  is_public?: boolean
}

export function ReelsRow({ shuffleMode }: ReelsRowProps) {
  const [reels, setReels] = useState(INITIAL_SAMPLE_REELS)
  const [viewMode, setViewMode] = useState<"scroll" | "grid" | "list">("scroll")
  const [newReleases, setNewReleases] = useState<NewReleaseVideo[]>([])
  const router = useRouter()
  const { isVisible } = useDashboardVisibility()

  // Fetch new releases videos
  useEffect(() => {
    fetchNewReleases()
  }, [])

  const getCoverImageUrl = (coverImagePath?: string): string | null => {
    if (!coverImagePath) return null
    
    if (coverImagePath.startsWith('http://') || coverImagePath.startsWith('https://')) {
      return coverImagePath
    }
    
    // Try both buckets
    for (const bucketName of ['covionfilms', 'videos']) {
      try {
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(coverImagePath)
        const url = data?.publicUrl || null
        if (url) return url
      } catch (err) {
        // Continue to next bucket
      }
    }
    return null
  }

  const fetchNewReleases = async () => {
    try {
      // Fetch from both videos and video_assets tables
      const [videosData, videoAssetsData] = await Promise.all([
        supabase
          .from('videos')
          .select('id, title, cover_image_path, dashboard_section, status, is_public, created_at')
          .eq('dashboard_section', 'new_releases')
          .eq('status', 'ready')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(5),
        
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
      let allVideos: NewReleaseVideo[] = [
        ...(videosData.data || []),
        ...(videoAssetsData.data || [])
      ]

      // Sort by created_at and limit to 5
      allVideos.sort((a, b) => 
        new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime()
      )
      allVideos = allVideos.slice(0, 5)

      // Convert cover image paths to public URLs
      const videosWithCoverUrls = allVideos.map(video => ({
        ...video,
        cover_image_path: getCoverImageUrl(video.cover_image_path) || undefined
      }))

      setNewReleases(videosWithCoverUrls)
    } catch (error) {
      console.error('Error fetching new releases:', error)
      setNewReleases([])
    }
  }

  useEffect(() => {
    if (shuffleMode) {
      const shuffled = [...INITIAL_SAMPLE_REELS].sort(() => Math.random() - 0.5)
      setReels(shuffled)
    } else {
      setReels(INITIAL_SAMPLE_REELS)
    }
  }, [shuffleMode])

  const toggleViewMode = () => {
    setViewMode((current) => {
      if (current === "scroll") return "grid"
      if (current === "grid") return "list"
      return "scroll"
    })
  }

  const renderListView = () => (
    <div className="space-y-4 p-4">
      {reels.map((reel) => (
        <Link href="/reel-mode" key={reel.id}>
          <div className="flex items-center space-x-4 p-2 bg-card rounded-md border border-gray-800">
            <div className="w-16 h-24 relative flex-shrink-0">
              <Image
                src={reel.thumbnail || "/placeholder.svg"}
                alt={reel.title}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>
            <div>
              <p className="font-semibold text-primary">{reel.title}</p>
              <p className="text-sm text-muted-foreground">{reel.creator}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )

  // Only render if trending_reels or new_releases is visible
  const trendingVisible = isVisible('trending_reels')
  const newReleasesVisible = isVisible('new_releases')
  
  console.log('🎬 ReelsRow visibility check:', {
    trending_reels: trendingVisible,
    new_releases: newReleasesVisible,
    shouldRender: trendingVisible || newReleasesVisible
  })
  
  if (!trendingVisible && !newReleasesVisible) {
    return null
  }

  return (
    <section className="space-y-4">
      {isVisible('trending_reels') && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-wider uppercase bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text futuristic-text">
              Trending Reels
            </h2>
            <Button
              onClick={toggleViewMode}
              variant="outline"
              size="sm"
              className="bg-black/50 border-primary text-primary hover:bg-primary hover:text-black transition-colors duration-300"
            >
              <ViewIcon className="h-5 w-5 mr-2" />
              <span className="uppercase tracking-wider text-xs font-bold futuristic-subtext">
                {viewMode === "scroll" ? "Grid" : viewMode === "grid" ? "List" : "Scroll"}
              </span>
            </Button>
          </div>
          <ScrollArea className="w-full rounded-md border border-gray-800">
        {viewMode === "scroll" && (
          <div className="flex w-max space-x-4 p-4">
            {reels.map((reel) => (
              <Link href="/reel-mode" key={reel.id}>
                <Card className="w-[150px] h-[200px] bg-card relative overflow-hidden border border-gray-800 group glass">
                  <CardContent className="p-0 w-full h-full">
                    <Image
                      src={reel.thumbnail || "/placeholder.svg"}
                      alt={reel.title}
                      width={150}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-12 h-12 text-white glow" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-75">
                      <p className="text-sm font-semibold text-primary truncate futuristic-text">{reel.title}</p>
                      <p className="text-xs text-muted-foreground truncate futuristic-subtext">{reel.creator}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        {viewMode === "grid" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
            {reels.map((reel) => (
              <Link href="/reel-mode" key={reel.id}>
                <Card className="w-[150px] h-[200px] bg-card relative overflow-hidden border border-gray-800 group glass">
                  <CardContent className="p-0 w-full h-full">
                    <Image
                      src={reel.thumbnail || "/placeholder.svg"}
                      alt={reel.title}
                      width={150}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-12 h-12 text-white glow" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-75">
                      <p className="text-sm font-semibold text-primary truncate futuristic-text">{reel.title}</p>
                      <p className="text-xs text-muted-foreground truncate futuristic-subtext">{reel.creator}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
            {viewMode === "list" && renderListView()}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      )}

      {isVisible('new_releases') && (
        <div className="mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-wider uppercase bg-gradient-to-r from-[#00ff87] to-[#60efff] text-transparent bg-clip-text futuristic-text">
              New Releases
            </h2>
          <Button
            onClick={toggleViewMode}
            variant="outline"
            size="sm"
            className="bg-black/50 border-primary text-primary hover:bg-primary hover:text-black transition-colors duration-300"
          >
            <ViewIcon className="h-5 w-5 mr-2" />
            <span className="uppercase tracking-wider text-xs font-bold futuristic-subtext">
              {viewMode === "scroll" ? "Grid" : viewMode === "grid" ? "List" : "Scroll"}
            </span>
          </Button>
        </div>
        <ScrollArea className="w-full rounded-md border border-gray-800 mt-4">
          {viewMode === "scroll" && (
            <div className="flex w-max space-x-4 p-4">
              {newReleases.length > 0 ? (
                newReleases.map((video) => (
                  <Card
                    key={video.id}
                    className="w-[150px] h-[225px] bg-card relative overflow-hidden border border-gray-800 group glass cursor-pointer"
                    onClick={() => router.push(`/watch/${video.id}`)}
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
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg"
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
                          <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                          <p className="text-center text-sm text-muted-foreground opacity-50">
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
                ))
              ) : (
                // Show placeholders if no videos
                [1, 2, 3, 4, 5].map((item) => (
                  <Card
                    key={item}
                    className="w-[150px] h-[225px] bg-card relative overflow-hidden border border-gray-800 group glass"
                  >
                    <CardContent className="p-0 w-full h-full flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Film className="h-12 w-12 text-muted-foreground opacity-50 mx-auto" />
                        <p className="text-sm text-muted-foreground opacity-50">Coming Soon</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
          {viewMode === "grid" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
              {newReleases.length > 0 ? (
                newReleases.map((video) => (
                  <Card
                    key={video.id}
                    className="w-[150px] h-[225px] bg-card relative overflow-hidden border border-gray-800 group glass cursor-pointer"
                    onClick={() => router.push(`/watch/${video.id}`)}
                  >
                    <CardContent className="p-0 w-full h-full">
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
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg"
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
                          <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                          <p className="text-center text-sm text-muted-foreground opacity-50">
                            {video.title}
                          </p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex items-end">
                        <div className="w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-white text-sm font-medium text-center">
                            {video.title}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                [1, 2, 3, 4, 5].map((item) => (
                  <Card
                    key={item}
                    className="w-[150px] h-[225px] bg-card relative overflow-hidden border border-gray-800 group glass"
                  >
                    <CardContent className="p-0 w-full h-full flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Film className="h-12 w-12 text-muted-foreground opacity-50 mx-auto" />
                        <p className="text-sm text-muted-foreground opacity-50">Coming Soon</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
          {viewMode === "list" && (
            <div className="space-y-4 p-4">
              {newReleases.length > 0 ? (
                newReleases.map((video) => (
                  <Card 
                    key={video.id} 
                    className="flex items-center space-x-2 bg-card rounded-md border border-gray-800 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => router.push(`/watch/${video.id}`)}
                  >
                    <div className="w-16 h-24 relative flex-shrink-0">
                      {video.cover_image_path ? (
                        <Image
                          src={video.cover_image_path}
                          alt={video.title}
                          width={64}
                          height={96}
                          className="object-cover rounded-md"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center rounded-md">
                          <Film className="h-8 w-8 text-primary opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-primary">{video.title}</p>
                      <p className="text-sm text-muted-foreground">New Release</p>
                    </div>
                    <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      NEW
                    </div>
                  </Card>
                ))
              ) : (
                [1, 2, 3, 4, 5].map((item) => (
                  <Card key={item} className="flex items-center space-x-2 bg-card rounded-md border border-gray-800">
                    <div className="w-16 h-24 bg-primary/20 flex items-center justify-center rounded-md">
                      <Film className="h-8 w-8 text-primary opacity-50" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">Coming Soon</p>
                      <p className="text-sm text-muted-foreground">New Release</p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        </div>
      )}
    </section>
  )
}

