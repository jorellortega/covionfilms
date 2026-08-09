"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Film, Clock, Star, RefreshCw, ViewIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { fetchDashboardVideos } from "@/lib/dashboard-videos"

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

type DisplayItem = Video | MockRelease

export function NewReleases() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"scroll" | "grid" | "list">("scroll")
  const router = useRouter()

  const mockReleases: MockRelease[] = [
    {
      id: "mock-1",
      title: "The Last Frontier",
      genre: "Sci-Fi",
      releaseDate: "Coming Soon",
      isMock: true,
    },
    {
      id: "mock-2",
      title: "Midnight Dreams",
      genre: "Thriller",
      releaseDate: "Coming Soon",
      isMock: true,
    },
    {
      id: "mock-3",
      title: "Ocean's Heart",
      genre: "Adventure",
      releaseDate: "Coming Soon",
      isMock: true,
    },
    {
      id: "mock-4",
      title: "City Lights",
      genre: "Drama",
      releaseDate: "Coming Soon",
      isMock: true,
    },
    {
      id: "mock-5",
      title: "The Silent Echo",
      genre: "Mystery",
      releaseDate: "Coming Soon",
      isMock: true,
    },
  ]

  useEffect(() => {
    void fetchNewReleases()
  }, [])

  const fetchNewReleases = async () => {
    try {
      setLoading(true)
      const allVideos = await fetchDashboardVideos("new_releases", 5)
      setVideos(allVideos)
    } catch (error) {
      console.error("Error fetching new releases:", error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const getDisplayItems = (): DisplayItem[] => {
    const actualVideos = videos.slice(0, 5)
    const remainingSlots = 5 - actualVideos.length

    if (remainingSlots <= 0) {
      return actualVideos
    }

    return [...actualVideos, ...mockReleases.slice(0, remainingSlots)]
  }

  const handleVideoClick = (videoId: string) => {
    if (!videoId.startsWith("mock-")) {
      router.push(`/watch/${videoId}`)
    }
  }

  const displayItems = getDisplayItems()

  const renderMockCard = (mockItem: MockRelease, className: string) => (
    <Card
      key={mockItem.id}
      className={`flex items-center justify-center bg-card relative overflow-hidden border border-gray-700 hover:border-primary/50 transition-colors group ${className}`}
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
            <p className="text-xs text-muted-foreground">{mockItem.genre}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-yellow-500">
              <Star className="h-3 w-3" />
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderVideoCard = (video: Video, className: string) => (
    <Card
      key={video.id}
      className={`flex items-center justify-center bg-card relative overflow-hidden border border-gray-700 hover:border-primary/50 transition-colors group cursor-pointer ${className}`}
      onClick={() => handleVideoClick(video.id)}
    >
      <CardContent className="p-0 w-full h-full">
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            NEW
          </div>
        </div>

        {video.cover_image_path ? (
          <div className="w-full h-full bg-black flex items-center justify-center relative">
            <Image
              src={video.cover_image_path}
              alt={video.title}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg"
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
            <Film className="h-12 w-12 text-muted-foreground opacity-50 group-hover:opacity-70 transition-opacity" />
            <p className="text-center text-sm text-muted-foreground opacity-50 group-hover:opacity-70 transition-opacity">
              {video.title}
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex items-end">
          <div className="w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-white text-sm font-medium text-center">{video.title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderItem = (item: DisplayItem, className: string) => {
    if ("isMock" in item) {
      return renderMockCard(item, className)
    }
    return renderVideoCard(item, className)
  }

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {displayItems.map((item) =>
        renderItem(item, "w-full aspect-[2/3] transition-transform duration-300 ease-in-out group-hover:scale-105")
      )}
    </div>
  )

  const renderScrollView = () => (
    <div className="flex w-max space-x-4 p-4">
      {displayItems.map((item) => renderItem(item, "w-[150px] h-[225px] flex-shrink-0"))}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-4 p-4">
      {displayItems.map((item) => {
        if ("isMock" in item) {
          return (
            <div
              key={item.id}
              className="flex items-center space-x-4 p-2 bg-card rounded-md border border-gray-800"
            >
              <div className="w-16 h-24 flex-shrink-0 flex items-center justify-center bg-muted rounded-md">
                <Film className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <div>
                <p className="font-semibold text-primary futuristic-text">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.genre} · Coming Soon</p>
              </div>
            </div>
          )
        }

        return (
          <div
            key={item.id}
            className="flex items-center space-x-4 p-2 bg-card rounded-md border border-gray-800 cursor-pointer hover:border-primary/50"
            onClick={() => handleVideoClick(item.id)}
          >
            <div className="w-16 h-24 relative flex-shrink-0">
              {item.cover_image_path ? (
                <Image
                  src={item.cover_image_path}
                  alt={item.title}
                  fill
                  className="object-contain bg-black rounded-md"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                  <Film className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-primary futuristic-text">{item.title}</p>
              <p className="text-sm text-green-400">New release</p>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-wider uppercase bg-gradient-to-r from-[#00ff87] to-[#60efff] text-transparent bg-clip-text futuristic-text">
          New Releases
        </h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block text-sm text-muted-foreground">
            {videos.length > 0 ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {videos.length} new video{videos.length !== 1 ? "s" : ""} available
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                Coming soon
              </span>
            )}
          </div>
          <button
            onClick={() => void fetchNewReleases()}
            disabled={loading}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Check for new videos"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button
            onClick={() =>
              setViewMode((current) => {
                if (current === "scroll") return "grid"
                if (current === "grid") return "list"
                return "scroll"
              })
            }
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
      </div>

      {loading && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Checking for new videos...</span>
          </div>
        </div>
      )}

      <ScrollArea className="w-full rounded-md border border-gray-800">
        {viewMode === "grid" && renderGridView()}
        {viewMode === "scroll" && renderScrollView()}
        {viewMode === "list" && renderListView()}
        {viewMode === "scroll" && <ScrollBar orientation="horizontal" />}
      </ScrollArea>
    </section>
  )
}
