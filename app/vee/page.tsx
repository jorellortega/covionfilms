"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, MessageSquare, Share2 } from "lucide-react"
import Link from "next/link"

const SAMPLE_REELS = [
  { id: 1, url: "https://example.com/reel1.mp4", creator: "Creator 1" },
  { id: 2, url: "https://example.com/reel2.mp4", creator: "Creator 2" },
  // Add more sample reels
]

export default function VeePage() {
  const [currentReelIndex, setCurrentReelIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleSwipe = (direction: "up" | "down") => {
    if (direction === "up" && currentReelIndex < SAMPLE_REELS.length - 1) {
      setCurrentReelIndex(currentReelIndex + 1)
    } else if (direction === "down" && currentReelIndex > 0) {
      setCurrentReelIndex(currentReelIndex - 1)
    }
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Card className="w-full max-w-md aspect-[9/16] relative overflow-hidden">
        <video
          ref={videoRef}
          src={SAMPLE_REELS[currentReelIndex].url}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <div>
            <p className="text-white font-bold">{SAMPLE_REELS[currentReelIndex].creator}</p>
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost" size="icon" className="text-white">
              <ThumbsUp className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
              <ThumbsDown className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
              <MessageSquare className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
              <Share2 className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </Card>
      <div className="fixed top-4 left-4">
        <Link href="/">
          <Button variant="ghost" className="text-white">
            Back to Home
          </Button>
        </Link>
      </div>
      <div className="fixed right-4 inset-y-0 flex flex-col items-center justify-center space-y-4">
        <Button variant="ghost" className="text-white" onClick={() => handleSwipe("up")}>
          ▲
        </Button>
        <Button variant="ghost" className="text-white" onClick={() => handleSwipe("down")}>
          ▼
        </Button>
      </div>
    </div>
  )
}

