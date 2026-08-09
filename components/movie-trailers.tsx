"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Shuffle, Film } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDashboardVideos } from "@/hooks/use-dashboard-videos"
import { getCloudflareStreamIframeUrl } from "@/lib/stream-url"
import { cn } from "@/lib/utils"

interface MovieTrailersProps {
  shuffleMode: boolean
}

const CONTROLS_HIDE_DELAY_MS = 3000

export function MovieTrailers({ shuffleMode }: MovieTrailersProps) {
  const { videos: allVideos, loading } = useDashboardVideos("new_releases", 8)
  // Dashboard hero plays trailers only — never the full movie stream
  const videos = allVideos.filter((video) => Boolean(video.trailer_cloudflare_stream_uid))
  const [activeIndex, setActiveIndex] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false)
    }, CONTROLS_HIDE_DELAY_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    revealControls()
  }, [activeIndex, revealControls])

  useEffect(() => {
    if (videos.length === 0) {
      setActiveIndex(0)
      return
    }
    if (activeIndex >= videos.length) {
      setActiveIndex(0)
    }
  }, [videos, activeIndex])

  useEffect(() => {
    if (!shuffleMode || videos.length === 0) return
    const shuffled = Math.floor(Math.random() * videos.length)
    setActiveIndex(shuffled)
  }, [shuffleMode, videos.length])

  const handleShuffle = () => {
    if (videos.length <= 1) return
    let next = activeIndex
    while (next === activeIndex) {
      next = Math.floor(Math.random() * videos.length)
    }
    setActiveIndex(next)
  }

  const activeVideo = videos[activeIndex]

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="relative aspect-video w-full max-w-4xl mx-auto overflow-hidden rounded-lg border border-gray-800 flex items-center justify-center bg-card">
          <p className="text-muted-foreground">Loading featured videos...</p>
        </div>
      </section>
    )
  }

  if (!activeVideo) {
    return (
      <section className="space-y-4">
        <div className="relative aspect-video w-full max-w-4xl mx-auto overflow-hidden rounded-lg border border-gray-800 flex flex-col items-center justify-center bg-card gap-3 p-6 text-center">
          <Film className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            No trailers in the main player yet. In{" "}
            <Link href="/manage-media" className="text-primary underline">
              Manage Media
            </Link>
            , set a video&apos;s dashboard section to <strong>New Releases</strong> and add a{" "}
            <strong>Trailer Cloudflare Video ID</strong>.
          </p>
        </div>
      </section>
    )
  }

  const playbackUid = activeVideo.trailer_cloudflare_stream_uid

  const iframeSrc = playbackUid
    ? getCloudflareStreamIframeUrl(playbackUid)
    : null

  return (
    <section className="space-y-4">
      <div
        className="group relative aspect-video w-full max-w-4xl mx-auto overflow-hidden rounded-lg border border-gray-800 neon-border bg-black"
        onMouseMove={revealControls}
        onMouseEnter={revealControls}
      >
        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            className="relative z-0 w-full h-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={activeVideo.title}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Video player unavailable
          </div>
        )}

        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-2 left-2 w-16 h-24 overflow-hidden rounded border border-white/20 bg-black/50">
            {activeVideo.cover_image_path ? (
              <Image
                src={activeVideo.cover_image_path}
                alt={activeVideo.title}
                width={64}
                height={96}
                className="object-contain w-full h-full bg-black"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="h-6 w-6 text-white/60" />
              </div>
            )}
          </div>

          {videos.length > 1 && (
            <div className="absolute top-2 right-2 pointer-events-auto">
              <Button
                onClick={handleShuffle}
                className="bg-black/70 text-white hover:bg-black/90 glass shrink-0"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Shuffle
              </Button>
            </div>
          )}

          <h2
            className={cn(
              "absolute top-2 left-20 right-4 text-xl sm:text-2xl font-bold text-white drop-shadow-lg truncate transition-opacity duration-300",
              controlsVisible ? "opacity-100" : "opacity-0"
            )}
          >
            {activeVideo.title}
          </h2>

          <Button
            size="sm"
            variant="link"
            className={cn(
              "absolute bottom-5 left-1/2 -translate-x-1/2 text-primary h-auto p-0 text-base sm:text-lg font-semibold drop-shadow-lg hover:text-primary/90 transition-opacity duration-300",
              controlsVisible
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            )}
            onClick={() => router.push(`/watch/${activeVideo.id}`)}
          >
            Watch full video
          </Button>
        </div>
      </div>

      {videos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto max-w-4xl mx-auto pb-2">
          {videos.map((video, index) => (
            <button
              key={video.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 w-24 h-14 rounded border overflow-hidden transition-all ${
                index === activeIndex ? "border-primary ring-2 ring-primary" : "border-gray-700 opacity-70 hover:opacity-100"
              }`}
            >
              {video.cover_image_path ? (
                <Image
                  src={video.cover_image_path}
                  alt={video.title}
                  width={96}
                  height={56}
                  className="object-contain w-full h-full bg-black"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Film className="h-4 w-4" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
