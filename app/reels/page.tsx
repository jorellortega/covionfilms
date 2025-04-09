"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, RefreshCw, MessageCircle } from "lucide-react"
import Link from "next/link"

const SAMPLE_REELS = [
  { id: 1, videoSrc: "/reel1.mp4", user: "User 1" },
  { id: 2, videoSrc: "/reel2.mp4", user: "User 2" },
  // Add more sample reels as needed
]

export default function ReelsPage() {
  const [currentReelIndex, setCurrentReelIndex] = useState(0)

  const handleNext = () => {
    setCurrentReelIndex((prevIndex) => (prevIndex + 1) % SAMPLE_REELS.length)
  }

  const handlePrevious = () => {
    setCurrentReelIndex((prevIndex) => (prevIndex - 1 + SAMPLE_REELS.length) % SAMPLE_REELS.length)
  }

  const currentReel = SAMPLE_REELS[currentReelIndex]

  return (
    <div className="fixed inset-0 bg-black">
      <div className="relative h-full w-full">
        <video src={currentReel.videoSrc} className="h-full w-full object-cover" autoPlay loop muted playsInline />
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="self-start">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/20">
                Back
              </Button>
            </Link>
          </div>
          <div className="self-end flex flex-col items-center space-y-4">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <Heart className="h-6 w-6" />
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <RefreshCw className="h-6 w-6" />
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
          <div className="self-start text-white font-bold">{currentReel.user}</div>
        </div>
        <Button
          className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white hover:bg-white/20"
          onClick={handlePrevious}
        >
          ←
        </Button>
        <Button
          className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white hover:bg-white/20"
          onClick={handleNext}
        >
          →
        </Button>
      </div>
    </div>
  )
}

