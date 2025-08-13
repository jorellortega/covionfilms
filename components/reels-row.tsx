"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Play } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ViewIcon } from "lucide-react"

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

export function ReelsRow({ shuffleMode }: ReelsRowProps) {
  const [reels, setReels] = useState(INITIAL_SAMPLE_REELS)
  const [viewMode, setViewMode] = useState<"scroll" | "grid" | "list">("scroll")

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

  return (
    <section className="space-y-4">
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
              {[1, 2, 3, 4, 5].map((item) => (
                <Card
                  key={item}
                  className="w-[150px] h-[200px] bg-card relative overflow-hidden border border-gray-800 group glass"
                >
                  <CardContent className="p-0 w-full h-full flex items-center justify-center">
                    <p className="text-lg font-semibold text-primary truncate futuristic-text">New Release {item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {viewMode === "grid" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <Card
                  key={item}
                  className="w-[150px] h-[200px] bg-card relative overflow-hidden border border-gray-800 group glass"
                >
                  <CardContent className="p-0 w-full h-full flex items-center justify-center">
                    <p className="text-lg font-semibold text-primary truncate futuristic-text">New Release {item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {viewMode === "list" && (
            <div className="space-y-4 p-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <Card key={item} className="flex items-center space-x-2 bg-card rounded-md border border-gray-800">
                  <div className="w-16 h-24 bg-primary/20 flex items-center justify-center rounded-md">
                    <p className="text-xs font-semibold text-primary">New</p>
                  </div>
                  <div>
                    <p className="font-semibold text-primary">New Release {item}</p>
                    <p className="text-sm text-muted-foreground">Just released!</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  )
}

