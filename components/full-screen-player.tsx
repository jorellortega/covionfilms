"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, Pause, Play, Home } from "lucide-react"
import Link from "next/link"

interface FullScreenPlayerProps {
  videoUrl: string
  title: string
}

export function FullScreenPlayer({ videoUrl, title }: FullScreenPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [showComments, setShowComments] = useState(false)
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.play()
    } else {
      video.pause()
    }
  }, [isPlaying])

  const togglePlay = () => setIsPlaying(!isPlaying)

  const handleLike = () => setLikes(likes + 1)
  const handleDislike = () => setDislikes(dislikes + 1)

  const handleShare = () => {
    console.log("Sharing 5-second clip with logo")
  }

  const toggleComments = () => {
    setShowComments(!showComments)
    if (!showComments) {
      setIsPlaying(false)
    }
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <video ref={videoRef} src={videoUrl} className="w-full h-full object-cover" onClick={togglePlay} />
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={handleLike}>
              <ThumbsUp className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDislike}>
              <ThumbsDown className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleComments}>
              <MessageSquare className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-6 w-6" />
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="secondary" size="lg" className="px-8 py-2">
              <Home className="mr-2 h-5 w-5" />
              Home
            </Button>
          </Link>
        </div>
      </div>
      {showComments && (
        <Card className="absolute top-0 right-0 w-80 h-full bg-background/80 backdrop-blur-sm overflow-hidden">
          <ScrollArea className="h-full p-4">
            <h3 className="font-bold mb-4">Comments</h3>
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}

