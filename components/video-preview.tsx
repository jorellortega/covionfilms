"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Volume2, VolumeX, Maximize, Clock, Eye, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface VideoPreviewProps {
  video: {
    id: string
    title: string
    description: string
    cover_image_path?: string
    file_path: string
    duration_seconds?: number
    quality?: string
    genre: string
    content_type: string
    view_count: number
    rating_average: number
    rating_count: number
    user_id: string
    created_at: string
  }
  mode: 'vertical' | 'horizontal' | 'full'
  showControls?: boolean
  autoPlay?: boolean
}

export function VideoPreview({ video, mode, showControls = true, autoPlay = false }: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showFullPreview, setShowFullPreview] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration)
      }
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime)
      }
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('timeupdate', handleTimeUpdate)
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = clickX / rect.width
      const newTime = percentage * duration
      videoRef.current.currentTime = newTime
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case '4K': return 'bg-purple-600'
      case '1080p': return 'bg-blue-600'
      case '720p': return 'bg-green-600'
      case '480p': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  const renderVerticalPreview = () => (
    <Card className="w-64 bg-card border-gray-700 hover:border-primary transition-colors">
      <CardHeader className="p-0">
        <div className="relative group">
          {video.cover_image_path ? (
            <Image
              src={video.cover_image_path}
              alt={video.title}
              width={256}
              height={144}
              className="w-full h-36 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-36 bg-gray-800 rounded-t-lg flex items-center justify-center">
              <Play className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <Button
              size="icon"
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={() => setShowFullPreview(true)}
            >
              <Play className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Quality badge */}
          {video.quality && (
            <Badge className={`absolute top-2 right-2 ${getQualityColor(video.quality)}`}>
              {video.quality}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{video.title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Clock className="h-3 w-3" />
          {video.duration_seconds ? formatTime(video.duration_seconds) : 'Unknown'}
          <Eye className="h-3 w-3" />
          {video.view_count}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {video.genre}
          </Badge>
          {video.rating_average > 0 && (
            <div className="flex items-center gap-1 text-xs text-yellow-500">
              <Star className="h-3 w-3 fill-current" />
              {video.rating_average.toFixed(1)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderHorizontalPreview = () => (
    <Card className="w-full bg-card border-gray-700 hover:border-primary transition-colors">
      <div className="flex">
        <div className="relative w-48 h-32 flex-shrink-0">
          {video.cover_image_path ? (
            <Image
              src={video.cover_image_path}
              alt={video.title}
              width={192}
              height={128}
              className="w-full h-full object-cover rounded-l-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 rounded-l-lg flex items-center justify-center">
              <Play className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          {/* Quality badge */}
          {video.quality && (
            <Badge className={`absolute top-2 right-2 ${getQualityColor(video.quality)}`}>
              {video.quality}
            </Badge>
          )}
        </div>
        
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">{video.title}</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFullPreview(true)}
            >
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {video.description}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {video.duration_seconds ? formatTime(video.duration_seconds) : 'Unknown'}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {video.view_count} views
            </div>
            {video.rating_average > 0 && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                {video.rating_average.toFixed(1)} ({video.rating_count})
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-3">
            <Badge variant="outline">{video.genre}</Badge>
            <Badge variant="outline">{video.content_type}</Badge>
          </div>
        </div>
      </div>
    </Card>
  )

  const renderFullPreview = () => (
    <Card className="w-full bg-card border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{video.title}</CardTitle>
          <div className="flex items-center gap-2">
            {video.quality && (
              <Badge className={getQualityColor(video.quality)}>
                {video.quality}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFullPreview(false)}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <video
            ref={videoRef}
            src={video.file_path}
            className="w-full h-96 object-cover rounded-lg"
            poster={video.cover_image_path}
            autoPlay={autoPlay}
            muted={isMuted}
          />
          
          {/* Video Controls */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <div className="flex items-center gap-4">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <div className="flex-1">
                  <div
                    ref={progressRef}
                    className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-200"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-muted-foreground">{video.description}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Genre:</span>
                <span>{video.genre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span>{video.content_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{video.duration_seconds ? formatTime(video.duration_seconds) : 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Views:</span>
                <span>{video.view_count}</span>
              </div>
              {video.rating_average > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    {video.rating_average.toFixed(1)} ({video.rating_count})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (showFullPreview) {
    return renderFullPreview()
  }

  switch (mode) {
    case 'vertical':
      return renderVerticalPreview()
    case 'horizontal':
      return renderHorizontalPreview()
    case 'full':
      return renderFullPreview()
    default:
      return renderVerticalPreview()
  }
}
