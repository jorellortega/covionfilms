"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { FullScreenPlayer } from "@/components/full-screen-player"
import { supabase } from "@/lib/supabaseClient"

interface Video {
  id: string
  title: string
  description: string
  file_path: string
  cover_image_path?: string
  duration_seconds?: number
  genre: string
  content_type: string
}

export default function WatchMovie() {
  const params = useParams()
  const movieId = params.movieId as string
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVideo()
  }, [movieId])

  const fetchVideo = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', movieId)
        .eq('status', 'ready')
        .eq('is_public', true)
        .single()

      if (fetchError) {
        console.error('Error fetching video:', fetchError)
        setError('Video not found or not available')
        return
      }

      if (!data) {
        setError('Video not found')
        return
      }

      setVideo(data)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load video')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-lg">{error || 'Video not found'}</p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen">
      <FullScreenPlayer 
        videoUrl={video.file_path} 
        title={video.title} 
        movieId={video.id} 
      />
    </div>
  )
}

