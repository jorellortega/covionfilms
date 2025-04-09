"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import Link from "next/link"

const SAMPLE_CLIPS = [
  { id: 1, url: "https://example.com/clip1.mp4", title: "Exciting Chase Scene" },
  { id: 2, url: "https://example.com/clip2.mp4", title: "Dramatic Dialogue" },
  { id: 3, url: "https://example.com/clip3.mp4", title: "Epic Battle Sequence" },
]

export default function ClipsPage() {
  const [currentClipIndex, setCurrentClipIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setCurrentClipIndex((prev) => (prev + 1) % SAMPLE_CLIPS.length)
      } else if (e.key === "ArrowLeft") {
        setCurrentClipIndex((prev) => (prev - 1 + SAMPLE_CLIPS.length) % SAMPLE_CLIPS.length)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const currentClip = SAMPLE_CLIPS[currentClipIndex]

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video src={currentClip.url} className="w-full h-full object-contain" autoPlay controls playsInline />
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white">
        <h2 className="text-2xl font-bold">{currentClip.title}</h2>
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <X className="h-6 w-6" />
          </Button>
        </Link>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
        <Button
          onClick={() => setCurrentClipIndex((prev) => (prev - 1 + SAMPLE_CLIPS.length) % SAMPLE_CLIPS.length)}
          className="bg-white/20 hover:bg-white/40 text-white"
        >
          Previous
        </Button>
        <Button
          onClick={() => setCurrentClipIndex((prev) => (prev + 1) % SAMPLE_CLIPS.length)}
          className="bg-white/20 hover:bg-white/40 text-white"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

