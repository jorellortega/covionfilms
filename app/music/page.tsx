"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, SkipForward, SkipBack, Volume2, List, Grid, Maximize2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

// Sample data for music and videos
const SAMPLE_MUSIC = [
  { id: 1, title: "Neon Dreams", artist: "Cyber Punk", cover: "/placeholder.svg?height=300&width=300" },
  { id: 2, title: "Electric Horizon", artist: "Synth Wave", cover: "/placeholder.svg?height=300&width=300" },
  { id: 3, title: "Digital Echoes", artist: "Tech Noir", cover: "/placeholder.svg?height=300&width=300" },
  // Add more sample music...
]

const SAMPLE_VIDEOS = [
  {
    id: 1,
    title: "Neon Dreams - Official Video",
    artist: "Cyber Punk",
    thumbnail: "/placeholder.svg?height=180&width=320",
  },
  {
    id: 2,
    title: "Electric Horizon - Live Performance",
    artist: "Synth Wave",
    thumbnail: "/placeholder.svg?height=180&width=320",
  },
  {
    id: 3,
    title: "Digital Echoes - Animated Visualizer",
    artist: "Tech Noir",
    thumbnail: "/placeholder.svg?height=180&width=320",
  },
  // Add more sample videos...
]

export default function MusicPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(SAMPLE_MUSIC[0])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const router = useRouter()

  const togglePlay = () => setIsPlaying(!isPlaying)

  const handleVideoClick = (videoId: number) => {
    router.push(`/music/video/${videoId}`)
  }

  const renderMusicGrid = (items: typeof SAMPLE_MUSIC) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="bg-card hover:bg-card/80 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <Image
              src={item.cover || "/placeholder.svg"}
              alt={item.title}
              width={300}
              height={300}
              className="w-full rounded-md mb-2"
            />
            <h3 className="text-sm font-semibold truncate">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.artist}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderMusicList = (items: typeof SAMPLE_MUSIC) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center space-x-4 p-2 hover:bg-card/80 rounded-md transition-colors cursor-pointer"
        >
          <Image
            src={item.cover || "/placeholder.svg"}
            alt={item.title}
            width={50}
            height={50}
            className="rounded-md"
          />
          <div>
            <h3 className="text-sm font-semibold">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.artist}</p>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
        COVION Music
      </h1>

      <div className="mb-8">
        <Input
          type="search"
          placeholder="Search for music or videos..."
          className="w-full max-w-md mx-auto bg-card/50 border-primary"
        />
      </div>

      <Tabs defaultValue="music" className="mb-8">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="videos">Music Videos</TabsTrigger>
        </TabsList>
        <TabsContent value="music" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
          <ScrollArea className="h-[60vh]">
            {viewMode === "grid" ? renderMusicGrid(SAMPLE_MUSIC) : renderMusicList(SAMPLE_MUSIC)}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="videos" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_VIDEOS.map((video) => (
              <Card
                key={video.id}
                className="bg-card hover:bg-card/80 transition-colors cursor-pointer"
                onClick={() => handleVideoClick(video.id)}
              >
                <CardContent className="p-4">
                  <div className="relative">
                    <Image
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      width={320}
                      height={180}
                      className="w-full rounded-md mb-2"
                    />
                    <Button variant="secondary" size="icon" className="absolute bottom-2 right-2">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="text-sm font-semibold truncate">{video.title}</h3>
                  <p className="text-xs text-muted-foreground">{video.artist}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-primary p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <Image
              src={currentTrack.cover || "/placeholder.svg"}
              alt={currentTrack.title}
              width={50}
              height={50}
              className="rounded-md"
            />
            <div>
              <h3 className="text-sm font-semibold">{currentTrack.title}</h3>
              <p className="text-xs text-muted-foreground">{currentTrack.artist}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button variant="ghost" size="icon">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <Volume2 className="h-4 w-4" />
            <Button variant="ghost" size="icon">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

