"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Film, Clock, ViewIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useDashboardVideos } from "@/hooks/use-dashboard-videos"

export function UpcomingMovies() {
  const { videos, loading } = useDashboardVideos("coming_soon", 12)
  const [viewMode, setViewMode] = useState<"scroll" | "grid" | "list">("scroll")
  const router = useRouter()
  const { user } = useAuth()
  const canManageMedia =
    user?.role === "admin" || user?.role === "management" || user?.role === "creator"

  const handleMovieClick = (id: string) => {
    router.push(`/upcoming/${id}`)
  }

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {videos.map((movie) => (
        <Card
          key={movie.id}
          className="w-full aspect-[2/3] bg-card relative overflow-hidden border border-gray-800 cursor-pointer group hover:border-primary/50 transition-transform duration-300 ease-in-out hover:scale-105"
          onClick={() => handleMovieClick(movie.id)}
        >
          <CardContent className="p-0 w-full h-full relative">
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Soon
              </div>
            </div>
            {movie.cover_image_path ? (
              <div className="w-full h-full bg-black relative">
                <Image
                  src={movie.cover_image_path}
                  alt={movie.title}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
                <Film className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex items-end">
              <div className="w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-sm font-medium text-center">{movie.title}</p>
                <p className="text-amber-400 text-xs text-center mt-0.5">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderScrollView = () => (
    <div className="flex w-max space-x-4 p-4">
      {videos.map((movie) => (
        <Card
          key={movie.id}
          className="w-[150px] h-[225px] flex-shrink-0 bg-card relative overflow-hidden border border-gray-800 glass cursor-pointer hover:border-primary/50 group"
          onClick={() => handleMovieClick(movie.id)}
        >
          <CardContent className="p-0 w-full h-full relative">
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                Soon
              </div>
            </div>
            {movie.cover_image_path ? (
              <div className="w-full h-full bg-black relative">
                <Image
                  src={movie.cover_image_path}
                  alt={movie.title}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
                <Film className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex items-end">
              <div className="w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-sm font-medium text-center">{movie.title}</p>
                <p className="text-amber-400 text-xs text-center mt-0.5">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-4 p-4">
      {videos.map((movie) => (
        <div
          key={movie.id}
          className="flex items-center space-x-4 p-2 bg-card rounded-md border border-gray-800 cursor-pointer hover:border-primary/50"
          onClick={() => handleMovieClick(movie.id)}
        >
          <div className="w-16 h-24 relative flex-shrink-0">
            {movie.cover_image_path ? (
              <Image
                src={movie.cover_image_path}
                alt={movie.title}
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
            <p className="font-semibold text-primary futuristic-text">{movie.title}</p>
            <p className="text-sm text-amber-400">Upcoming</p>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-bold tracking-wider uppercase bg-gradient-to-r from-amber-400 to-orange-500 text-transparent bg-clip-text futuristic-text">
          Upcoming Movies
        </h2>
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

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading upcoming movies...</p>
      ) : videos.length === 0 ? (
        <div className="text-center py-8 border border-gray-800 rounded-lg">
          <p className="text-muted-foreground mb-2">No upcoming movies yet.</p>
          {canManageMedia ? (
            <p className="text-sm text-muted-foreground">
              In{" "}
              <Link href="/manage-media" className="text-primary underline">
                Manage Media
              </Link>
              , set a video&apos;s dashboard section to <strong>Upcoming Movies</strong>.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              New titles will appear here when they&apos;re announced.
            </p>
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
