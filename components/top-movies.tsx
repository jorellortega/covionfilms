"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Film, ViewIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDashboardVideos } from "@/hooks/use-dashboard-videos"

interface TopMoviesProps {
  shuffleMode: boolean
}

export function TopMovies({ shuffleMode }: TopMoviesProps) {
  const { videos, loading } = useDashboardVideos("top_movies", 10)
  const [viewMode, setViewMode] = useState<"scroll" | "grid" | "list">("scroll")
  const router = useRouter()

  const topMovies = shuffleMode ? [...videos].sort(() => Math.random() - 0.5) : videos

  const handleMovieClick = (id: string) => {
    router.push(`/watch/${id}`)
  }

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {topMovies.map((movie, index) => (
        <div key={movie.id} className="relative group cursor-pointer" onClick={() => handleMovieClick(movie.id)}>
          <Card className="w-full aspect-[2/3] bg-card overflow-hidden border border-gray-800 transition-transform duration-300 ease-in-out transform group-hover:scale-105">
            <CardContent className="p-0 w-full h-full relative">
              {movie.cover_image_path ? (
                <Image
                  src={movie.cover_image_path}
                  alt={movie.title}
                  fill
                  className="object-contain bg-black transition-opacity duration-300 group-hover:opacity-75"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
                  <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="text-center text-sm text-muted-foreground opacity-50">{movie.title}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-white text-sm font-semibold truncate futuristic-text">{movie.title}</p>
            <p className="text-primary text-xs">Rank: {index + 1}</p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderScrollView = () => (
    <div className="flex space-x-4 p-4">
      {topMovies.map((movie) => (
        <Card
          key={movie.id}
          className="w-[150px] h-[225px] flex-shrink-0 bg-card relative overflow-hidden border border-gray-800 glass cursor-pointer hover:border-primary/50"
          onClick={() => handleMovieClick(movie.id)}
        >
          <CardContent className="p-0 w-full h-full relative">
            {movie.cover_image_path ? (
              <Image
                src={movie.cover_image_path}
                alt={movie.title}
                fill
                className="object-contain bg-black"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
                <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-center text-sm text-muted-foreground opacity-50">{movie.title}</p>
              </div>
            )}
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
            <p className="text-white text-xs font-semibold truncate futuristic-text">{movie.title}</p>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-4 p-4">
      {topMovies.map((movie, index) => (
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
            <p className="text-sm text-muted-foreground">Rank: {index + 1}</p>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-wider uppercase bg-gradient-to-r from-[#ff0050] to-[#ff2975] text-transparent bg-clip-text futuristic-text">
          Top 10 Movies
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
        <p className="text-muted-foreground text-center py-8">Loading top movies...</p>
      ) : topMovies.length === 0 ? (
        <div className="text-center py-8 border border-gray-800 rounded-lg">
          <p className="text-muted-foreground mb-2">No top movies yet.</p>
          <p className="text-sm text-muted-foreground">
            In <Link href="/manage-media" className="text-primary underline">Manage Media</Link>, set a video&apos;s dashboard section to <strong>Top Movies</strong>.
          </p>
        </div>
      ) : (
        <ScrollArea className="w-full rounded-md border border-gray-800">
          {viewMode === "grid" && renderGridView()}
          {viewMode === "scroll" && renderScrollView()}
          {viewMode === "list" && renderListView()}
        </ScrollArea>
      )}
    </section>
  )
}
