"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThumbsUp, ThumbsDown, Share2, Save, MoreHorizontal } from "lucide-react"
import Image from "next/image"

// This would typically come from an API or database
const getVideoById = (id: number) => {
  return SAMPLE_VIDEOS.find((video) => video.id === id) || null
}

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

export default function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const [video, setVideo] = useState<(typeof SAMPLE_VIDEOS)[0] | null>(null)

  useEffect(() => {
    const videoId = Number.parseInt(params.id as string, 10)
    const fetchedVideo = getVideoById(videoId)
    setVideo(fetchedVideo)
  }, [params.id])

  if (!video) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
            <Image src={video.thumbnail || "/placeholder.svg"} alt={video.title} layout="fill" objectFit="cover" />
            {/* Placeholder for actual video player */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button variant="secondary" size="lg">
                Play Video
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold">{video.title}</h1>
            <p className="text-muted-foreground">{video.artist}</p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex space-x-4">
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
                <Button variant="ghost" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Card className="mt-6">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-sm text-muted-foreground">
                This is a placeholder description for the music video. In a real application, this would contain
                detailed information about the video, the artist, and potentially lyrics or other relevant content.
              </p>
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Up Next</h2>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-4">
              {SAMPLE_VIDEOS.map((relatedVideo) => (
                <Card
                  key={relatedVideo.id}
                  className="flex items-center space-x-4 p-2 cursor-pointer hover:bg-accent"
                  onClick={() => router.push(`/music/video/${relatedVideo.id}`)}
                >
                  <Image
                    src={relatedVideo.thumbnail || "/placeholder.svg"}
                    alt={relatedVideo.title}
                    width={120}
                    height={67}
                    className="rounded"
                  />
                  <div>
                    <h3 className="font-semibold text-sm">{relatedVideo.title}</h3>
                    <p className="text-xs text-muted-foreground">{relatedVideo.artist}</p>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

