"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, ThumbsUp, ThumbsDown, Share2, Volume2, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

const SAMPLE_CONTENT = [
  {
    id: 1,
    type: "video",
    title: "Neon Dreams - Official Video",
    artist: "Cyber Punk",
    thumbnail: "/placeholder.svg?height=1080&width=1920",
    duration: "3:45",
  },
  {
    id: 2,
    type: "music",
    title: "Electric Horizon",
    artist: "Synth Wave",
    cover: "/placeholder.svg?height=300&width=300",
    duration: "4:20",
  },
  {
    id: 3,
    type: "video",
    title: "Digital Echoes - Animated Visualizer",
    artist: "Tech Noir",
    thumbnail: "/placeholder.svg?height=1080&width=1920",
    duration: "5:10",
  },
  {
    id: 4,
    type: "music",
    title: "Quantum Beats",
    artist: "AI Composer",
    cover: "/placeholder.svg?height=300&width=300",
    duration: "3:30",
  },
  {
    id: 5,
    type: "video",
    title: "Holographic Memories - Live Performance",
    artist: "Virtual Band",
    thumbnail: "/placeholder.svg?height=1080&width=1920",
    duration: "6:15",
  },
  // Add more sample content...
]

export default function MusicFeedPage() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewMode, setViewMode] = useState("list") // Added state for view mode
  const router = useRouter()

  const togglePlay = (id: number) => {
    if (currentlyPlaying === id) {
      setIsPlaying(!isPlaying)
    } else {
      setCurrentlyPlaying(id)
      setIsPlaying(true)
    }
  }

  const renderContent = (item: (typeof SAMPLE_CONTENT)[0]) => (
    <Card
      key={item.id}
      className={`${item.type === "video" ? "w-[320px]" : "w-[150px] h-[200px]"} bg-card relative overflow-hidden border border-gray-800 group glass`}
    >
      <CardContent className="p-0">
        <div className="relative">
          <div className="relative w-full pb-[56.25%]">
            <Image
              src={item.type === "video" ? item.thumbnail : item.cover}
              alt={item.title}
              layout="fill"
              objectFit="cover"
              className="absolute top-0 left-0 w-full h-full rounded-md"
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 left-4"
            onClick={() => togglePlay(item.id)}
          >
            {currentlyPlaying === item.id && isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
            {item.duration}
          </div>
        </div>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-1 text-primary">{item.title}</h2>
          <p className="text-sm text-muted-foreground mb-4">{item.artist}</p>
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Like
              </Button>
              <Button variant="ghost" size="sm">
                <ThumbsDown className="mr-2 h-4 w-4" />
                Dislike
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
            <Link href={item.type === "video" ? `/music/video/${item.id}` : `/music/${item.id}`}>
              <Button variant="link">View Full {item.type === "video" ? "Video" : "Track"}</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black to-gray-900 text-white overflow-hidden">
      <div className="absolute top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-white hover:text-primary">
          <X className="h-6 w-6" />
          <span className="sr-only">Exit Music Feed</span>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 h-full flex flex-col">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
          COVION Music Feed
        </h1>

        <Tabs defaultValue="all" className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="videos">Music Videos</TabsTrigger>
            <TabsTrigger value="tracks">Music Tracks</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="flex-grow">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                  {SAMPLE_CONTENT.map(renderContent)}
                </div>
              ) : (
                SAMPLE_CONTENT.map(renderContent)
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="videos" className="flex-grow">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                  {SAMPLE_CONTENT.filter((item) => item.type === "video").map(renderContent)}
                </div>
              ) : (
                SAMPLE_CONTENT.filter((item) => item.type === "video").map(renderContent)
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="tracks" className="flex-grow">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                  {SAMPLE_CONTENT.filter((item) => item.type === "music").map(renderContent)}
                </div>
              ) : (
                SAMPLE_CONTENT.filter((item) => item.type === "music").map(renderContent)
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {currentlyPlaying && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t border-primary p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <Image
                src={
                  SAMPLE_CONTENT.find((item) => item.id === currentlyPlaying)?.type === "video"
                    ? SAMPLE_CONTENT.find((item) => item.id === currentlyPlaying)?.thumbnail || "/placeholder.svg"
                    : SAMPLE_CONTENT.find((item) => item.id === currentlyPlaying)?.cover || "/placeholder.svg"
                }
                alt={SAMPLE_CONTENT.find((item) => item.id === currentlyPlaying)?.title || ""}
                width={50}
                height={50}
                className="rounded-md"
              />
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  {SAMPLE_CONTENT.find((item) => item.id === currentlyPlaying)?.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {SAMPLE_CONTENT.find((item) => item.id === currentlyPlaying)?.artist}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => togglePlay(currentlyPlaying)}>
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              <Volume2 className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

