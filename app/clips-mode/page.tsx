"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, SkipForward, SkipBack, Play, Pause } from "lucide-react"
import Link from "next/link"

// Sample movie clips data
const SAMPLE_CLIPS = [
  { id: 1, url: "https://example.com/movie1-clip.mp4", title: "Movie 1" },
  { id: 2, url: "https://example.com/movie2-clip.mp4", title: "Movie 2" },
  { id: 3, url: "https://example.com/movie3-clip.mp4", title: "Movie 3" },
  { id: 4, url: "https://example.com/movie4-clip.mp4", title: "Movie 4" },
  { id: 5, url: "https://example.com/movie5-clip.mp4", title: "Movie 5" },
]

export default function ClipsModePage() {
  const [currentClipIndex, setCurrentClipIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isPlaying) {
      timer = setTimeout(() => {
        handleSkipForward()
      }, 5000) // Change clip every 5 seconds
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [currentClipIndex, isPlaying])

  const handleSkipForward = () => {
    setCurrentClipIndex((prevIndex) => (prevIndex + 1) % SAMPLE_CLIPS.length)
  }

  const handleSkipBackward = () => {
    setCurrentClipIndex((prevIndex) => (prevIndex - 1 + SAMPLE_CLIPS.length) % SAMPLE_CLIPS.length)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handlePlayMovie = () => {
    // This is a placeholder function. In a real application, you would
    // navigate to the full movie page or start playing the full movie.
    console.log("Playing full movie:", SAMPLE_CLIPS[currentClipIndex].title)
  }

  const currentClip = SAMPLE_CLIPS[currentClipIndex]

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          key={currentClip.id}
          src={currentClip.url}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white">
          <h2 className="text-2xl font-bold">{currentClip.title}</h2>
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-2">
          <Button onClick={handleSkipBackward} className="bg-white/20 hover:bg-white/40 text-white">
            <SkipBack className="h-6 w-6" />
          </Button>
          <Button onClick={togglePlayPause} className="bg-white/20 hover:bg-white/40 text-white">
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          <Button onClick={handleSkipForward} className="bg-white/20 hover:bg-white/40 text-white">
            <SkipForward className="h-6 w-6" />
          </Button>
          <Button onClick={handlePlayMovie} className="bg-white/20 hover:bg-white/40 text-white">
            Play Movie
          </Button>
        </div>
      </div>
    </div>
  )
}

