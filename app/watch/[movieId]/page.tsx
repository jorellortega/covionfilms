"use client"

import { useParams } from "next/navigation"
import { FullScreenPlayer } from "@/components/full-screen-player"

export default function WatchMovie() {
  const params = useParams()
  const movieId = params.movieId as string

  // In a real application, you would fetch the movie details based on the movieId
  const movieUrl =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Let%20Him%20Cook-isKfCTVLTppLzecVTitfIZy4d0Ufsr.mp4"
  const movieTitle = "Firepit Chronicles"

  return (
    <div className="w-full h-screen">
      <FullScreenPlayer videoUrl={movieUrl} title={movieTitle} movieId={movieId} />
    </div>
  )
}

