"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronUp, ChevronDown, ThumbsUp, ThumbsDown, MessageSquare, Volume2, VolumeX } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const SAMPLE_REELS = [
  {
    id: 1,
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Let%20Him%20Cook-isKfCTVLTppLzecVTitfIZy4d0Ufsr.mp4",
    title: "Let Him Cook",
    creator: "JOR",
  },
  {
    id: 2,
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/clip%201-XDkwPQ7DMyh02nV6jArfdBRbZVNjuj.mp4",
    title: "Clip 1",
    creator: "Unknown",
  },
]

export default function ReelMode() {
  const [currentReelIndex, setCurrentReelIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [showComments, setShowComments] = useState(false)
  const [swipeMetrics, setSwipeMetrics] = useState({ left: 0, right: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentReel = SAMPLE_REELS[currentReelIndex]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        setCurrentReelIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === "ArrowDown") {
        setCurrentReelIndex((prev) => (prev < SAMPLE_REELS.length - 1 ? prev + 1 : prev))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play()
    }
  }, [currentReelIndex])

  const handleSwipe = (direction: "left" | "right") => {
    setSwipeMetrics((prev) => ({ ...prev, [direction]: prev[direction] + 1 }))
    if (direction === "left") {
      console.log("Marked as 'never see again'")
    } else {
      console.log("Added to Playlist Library")
    }
    setCurrentReelIndex((prev) => (prev < SAMPLE_REELS.length - 1 ? prev + 1 : 0))
  }

  const toggleMute = () => {
    setMuted(!muted)
    if (videoRef.current) {
      videoRef.current.muted = !muted
    }
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <Card className="w-full max-w-md aspect-[9/16] relative overflow-hidden neon-border">
        <CardContent className="p-0 h-full">
          <video
            ref={videoRef}
            src={currentReel.url}
            className="w-full h-full object-cover"
            loop
            muted={muted}
            autoPlay
            playsInline
          />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div className="flex justify-between items-start">
              <Button variant="ghost" size="icon" className="text-white hover:bg-black/20" onClick={toggleMute}>
                {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </Button>
              <div className="text-right">
                <h2 className="text-xl font-bold text-neon-pink">{currentReel.title}</h2>
                <p className="text-sm text-neon-blue">{currentReel.creator}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-black/20"
                    onClick={() => handleSwipe("left")}
                  >
                    <ThumbsDown className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-black/20"
                    onClick={() => handleSwipe("right")}
                  >
                    <ThumbsUp className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="comments" checked={showComments} onCheckedChange={setShowComments} />
                  <Label htmlFor="comments" className="text-white">
                    <MessageSquare className="h-6 w-6" />
                  </Label>
                </div>
              </div>
              <p className="text-neon-green text-sm">
                L{swipeMetrics.left} R{swipeMetrics.right}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="absolute right-4 inset-y-0 flex flex-col items-center justify-center space-y-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-black/20"
          onClick={() => setCurrentReelIndex((prev) => (prev > 0 ? prev - 1 : prev))}
        >
          <ChevronUp className="h-8 w-8" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-black/20"
          onClick={() => setCurrentReelIndex((prev) => (prev < SAMPLE_REELS.length - 1 ? prev + 1 : 0))}
        >
          <ChevronDown className="h-8 w-8" />
        </Button>
      </div>
    </div>
  )
}

