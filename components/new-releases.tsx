"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Film, RefreshCw, ViewIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { fetchDashboardVideos } from "@/lib/dashboard-videos"

interface Video {
  id: string
  title: string
  cover_image_path?: string
  dashboard_section?: string
  status?: string
  is_public?: boolean
}

export function NewReleases() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"scroll" | "grid" | "list">("scroll")
  const router = useRouter()
  const { user } = useAuth()
  const canManageMedia =
    user?.role === "admin" || user?.role === "management" || user?.role === "creator"

  useEffect(() => {
    void fetchNewReleases()
  }, [])

  const fetchNewReleases = async () => {
    try {
      setLoading(true)
      const allVideos = await fetchDashboardVideos("new_releases", 20)
      setVideos(allVideos)
    } catch (error) {
      console.error("Error fetching new releases:", error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleVideoClick = (videoId: string) => {
    router.push(`/watch/${videoId}`)
  }

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

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {videos.map((video) =>
        renderVideoCard(
          video,
          "w-full aspect-[2/3] transition-transform duration-300 ease-in-out group-hover:scale-105"
        )
      )}
    </div>
  )

  const renderScrollView = () => (
    <div className="flex w-max space-x-4 p-4">
      {videos.map((video) => renderVideoCard(video, "w-[150px] h-[225px] flex-shrink-0"))}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-4 p-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="flex items-center space-x-4 p-2 bg-card rounded-md border border-gray-800 cursor-pointer hover:border-primary/50"
          onClick={() => handleVideoClick(video.id)}
        >
          <div className="w-16 h-24 relative flex-shrink-0">
            {video.cover_image_path ? (
              <Image
                src={video.cover_image_path}
                alt={video.title}
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
            <p className="font-semibold text-primary futuristic-text">{video.title}</p>
            <p className="text-sm text-green-400">New release</p>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-wider uppercase bg-gradient-to-r from-[#00ff87] to-[#60efff] text-transparent bg-clip-text futuristic-text">
          New Releases
        </h2>
        <div className="flex items-center gap-2 sm:gap-4">
          {videos.length > 0 && (
            <div className="hidden sm:block text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {videos.length} new video{videos.length !== 1 ? "s" : ""} available
              </span>
            </div>
          )}
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

      {loading && videos.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading new releases...</span>
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-8 border border-gray-800 rounded-lg">
          <p className="text-muted-foreground mb-2">No new releases yet.</p>
          {canManageMedia ? (
            <p className="text-sm text-muted-foreground">
              In{" "}
              <Link href="/manage-media" className="text-primary underline">
                Manage Media
              </Link>
              , set a video&apos;s dashboard section to <strong>New Releases</strong>.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Check back soon for new titles.</p>
          )}
        </div>
      ) : (
        <ScrollArea className="w-full rounded-md border border-gray-800">
          {viewMode === "grid" && renderGridView()}
          {viewMode === "scroll" && renderScrollView()}
          {viewMode === "list" && renderListView()}
          {viewMode === "scroll" && <ScrollBar orientation="horizontal" />}
        </ScrollArea>
      )}
    </section>
  )
}
