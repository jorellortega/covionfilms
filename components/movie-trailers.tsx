"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shuffle, Volume2, VolumeX } from "lucide-react"
import Image from "next/image"

const SAMPLE_TRAILERS = [
  {
    id: 1,
    title: "Let Him Cook",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Let%20Him%20Cook-isKfCTVLTppLzecVTitfIZy4d0Ufsr.mp4",
    thumbnail: "/placeholder.svg?height=100&width=180",
  },
  {
    id: 2,
    title: "Neon Nights",
    url: "/placeholder.svg?height=720&width=1280",
    thumbnail: "/placeholder.svg?height=100&width=180",
  },
  {
    id: 3,
    title: "Cyber Dreams",
    url: "/placeholder.svg?height=720&width=1280",
    thumbnail: "/placeholder.svg?height=100&width=180",
  },
  {
    id: 4,
    title: "Quantum Leap",
    url: "/placeholder.svg?height=720&width=1280",
    thumbnail: "/placeholder.svg?height=100&width=180",
  },
]

interface MovieTrailersProps {
  shuffleMode: boolean
}

export function MovieTrailers({ shuffleMode }: MovieTrailersProps) {
  const [muted, setMuted] = useState(true)
  const [activeTrailer, setActiveTrailer] = useState(SAMPLE_TRAILERS[0])
  const [trailers, setTrailers] = useState(SAMPLE_TRAILERS)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted
    }
  }, [muted])

  useEffect(() => {
    if (shuffleMode) {
      const shuffled = [...SAMPLE_TRAILERS].sort(() => Math.random() - 0.5)
      setTrailers(shuffled)
      setActiveTrailer(shuffled[0])
    } else {
      setTrailers(SAMPLE_TRAILERS)
      setActiveTrailer(SAMPLE_TRAILERS[0])
    }
  }, [shuffleMode])

  const handleTrailerClick = (trailer: (typeof SAMPLE_TRAILERS)[0]) => {
    setActiveTrailer(trailer)
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play()
    }
  }

  const handleShuffle = () => {
    const shuffled = [...SAMPLE_TRAILERS].sort(() => Math.random() - 0.5)
    setTrailers(shuffled)
    setActiveTrailer(shuffled[0])
  }

  const toggleFullScreen = () => {
    if (!videoRef.current) return

    if (!document.fullscreenElement) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      } else if (videoRef.current.mozRequestFullScreen) {
        // Firefox
        videoRef.current.mozRequestFullScreen()
      } else if (videoRef.current.webkitRequestFullscreen) {
        // Chrome, Safari and Opera
        videoRef.current.webkitRequestFullscreen()
      } else if (videoRef.current.msRequestFullscreen) {
        // IE/Edge
        videoRef.current.msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.mozCancelFullScreen) {
        // Firefox
        document.mozCancelFullScreen()
      } else if (document.webkitExitFullscreen) {
        // Chrome, Safari and Opera
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        // IE/Edge
        document.msExitFullscreen()
      }
    }
  }

  return (
    <section className="space-y-4">
      <div className="relative aspect-video w-full max-w-4xl mx-auto overflow-hidden rounded-lg border border-gray-800 neon-border">
        <video
          ref={videoRef}
          src={activeTrailer.url}
          className="w-full h-full object-cover cursor-pointer"
          autoPlay
          loop
          muted={muted}
          playsInline
          onClick={toggleFullScreen}
        />
        <div className="absolute top-2 left-2 w-16 h-24 overflow-hidden rounded border border-white/20">
          <Image
            src={activeTrailer.thumbnail || "/placeholder.svg"}
            alt={activeTrailer.title}
            width={64}
            height={96}
            className="object-cover"
          />
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">{activeTrailer.title}</h2>
          <Button variant="ghost" size="icon" onClick={() => setMuted(!muted)} className="text-white hover:bg-white/10">
            {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </Button>
          <Button
            onClick={() => handleShuffle()}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white hover:bg-black/90 glass"
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle
          </Button>
        </div>
      </div>
    </section>
  )
}

