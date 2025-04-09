"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Film, ViewIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

const INITIAL_TOP_MOVIES = [
  {
    id: 1,
    title: "Firepit Chronicles",
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Firepit-Cover-cEkwphXNyfxfQa7oe6FiuWpdzdjKeU.png",
  },
  // Placeholder slots for remaining top movies
  ...Array(9)
    .fill(null)
    .map((_, index) => ({
      id: index + 2,
      title: `Coming Soon ${index + 2}`,
      imageUrl: null,
    })),
]

interface TopMoviesProps {
  shuffleMode: boolean
}

export function TopMovies({ shuffleMode }: TopMoviesProps) {
  const [topMovies, setTopMovies] = useState(INITIAL_TOP_MOVIES)
  const [viewMode, setViewMode] = useState<"scroll" | "grid" | "list">("scroll")

  useEffect(() => {
    if (shuffleMode) {
      const shuffled = [...INITIAL_TOP_MOVIES].sort(() => Math.random() - 0.5)
      setTopMovies(shuffled)
    } else {
      setTopMovies(INITIAL_TOP_MOVIES)
    }
  }, [shuffleMode])

  const toggleViewMode = () => {
    setViewMode((current) => {
      if (current === "scroll") return "grid"
      if (current === "grid") return "list"
      return "scroll"
    })
  }

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {topMovies.map((movie, index) => (
        <div key={movie.id} className="relative group">
          <Card className="w-full aspect-[2/3] bg-card overflow-hidden border border-gray-800 transition-transform duration-300 ease-in-out transform group-hover:scale-105">
            <CardContent className="p-0 w-full h-full">
              {movie.imageUrl ? (
                <Image
                  src={movie.imageUrl || "/placeholder.svg"}
                  alt={movie.title}
                  layout="fill"
                  objectFit="cover"
                  className="transition-opacity duration-300 group-hover:opacity-75"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
                  <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="text-center text-sm text-muted-foreground opacity-50">Movie {movie.id}</p>
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
          className={`w-[150px] h-[225px] flex-shrink-0 bg-card relative overflow-hidden border border-gray-800 glass`}
        >
          <CardContent className="p-0 w-full h-full">
            {movie.imageUrl ? (
              <Image
                src={movie.imageUrl || "/placeholder.svg"}
                alt={movie.title}
                width={150}
                height={225}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
                <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-center text-sm text-muted-foreground opacity-50">Movie {movie.id}</p>
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
        <div key={movie.id} className="flex items-center space-x-4 p-2 bg-card rounded-md border border-gray-800">
          <div className="w-16 h-24 relative flex-shrink-0">
            {movie.imageUrl ? (
              <Image
                src={movie.imageUrl || "/placeholder.svg"}
                alt={movie.title}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
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
        {viewMode === "grid" && renderGridView()}
        {viewMode === "scroll" && renderScrollView()}
        {viewMode === "list" && renderListView()}
      </ScrollArea>
    </section>
  )
}

