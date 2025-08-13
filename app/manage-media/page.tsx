"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Pencil, Trash2, Eye, Play, Download, ExternalLink, Loader2, Film, Settings } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Video {
  id: string
  title: string
  description: string
  content_type: string
  genre: string
  duration_seconds?: number
  quality?: string
  file_size?: number
  cover_image_path?: string
  file_path: string
  status: string
  view_count: number
  rating_average: number
  rating_count: number
  created_at: string
  is_public: boolean
  dashboard_section?: string
}

// Dashboard sections available for assignment
const DASHBOARD_SECTIONS = [
  { value: 'featured', label: 'Featured Movies', description: 'Curated content at the top' },
  { value: 'new_releases', label: 'New Releases', description: 'Latest uploads section' },
  { value: 'top_movies', label: 'Top Movies', description: 'Most popular videos' },
  { value: 'trending', label: 'Trending Now', description: 'Currently popular content' },
  { value: 'coming_soon', label: 'Coming Soon', description: 'Upcoming releases' },
  { value: 'none', label: 'No Section', description: 'Hidden from dashboard' }
]

export default function ManageMediaPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string | undefined>()
  const [filterStatus, setFilterStatus] = useState<string | undefined>()

  // Fetch user's videos from database
  useEffect(() => {
    if (user?.id) {
      fetchUserVideos()
    }
  }, [user?.id])

  const fetchUserVideos = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setVideos(data || [])
    } catch (error: any) {
      console.error('Error fetching videos:', error)
      toast({
        title: "Error",
        description: "Failed to load your videos. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || video.content_type === filterType
    const matchesStatus = !filterStatus || video.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      try {
        // Delete from database
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', id)

        if (error) throw error

        // Remove from local state
        setVideos(videos.filter((video) => video.id !== id))
        
        toast({
          title: "Video Deleted",
          description: "The video has been successfully removed.",
        })
      } catch (error: any) {
        console.error('Error deleting video:', error)
        toast({
          title: "Error",
          description: "Failed to delete video. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const handleTogglePublic = async (video: Video) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ is_public: !video.is_public })
        .eq('id', video.id)

      if (error) throw error

      // Update local state
      setVideos(videos.map(v => 
        v.id === video.id ? { ...v, is_public: !v.is_public } : v
      ))

      toast({
        title: "Visibility Updated",
        description: `Video is now ${!video.is_public ? 'public' : 'private'}.`,
      })
    } catch (error: any) {
      console.error('Error updating video:', error)
      toast({
        title: "Error",
        description: "Failed to update video visibility. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSectionChange = async (videoId: string, newSection: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ dashboard_section: newSection })
        .eq('id', videoId)

      if (error) throw error

      setVideos(videos.map(v => 
        v.id === videoId ? { ...v, dashboard_section: newSection } : v
      ))

      toast({
        title: "Section Updated",
        description: `Video moved to ${DASHBOARD_SECTIONS.find(s => s.value === newSection)?.label || 'No Section'}.`,
      })
    } catch (error: any) {
      console.error('Error updating section:', error)
      toast({
        title: "Error",
        description: "Failed to update video section. Please try again.",
        variant: "destructive"
      })
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-600">Ready</Badge>
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-600">Processing</Badge>
      case 'uploading':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Uploading</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getQualityBadge = (quality?: string) => {
    if (!quality) return <Badge variant="outline">Unknown</Badge>
    
    switch (quality.toLowerCase()) {
      case '4k':
        return <Badge variant="default" className="bg-purple-600">4K</Badge>
      case '1080p':
        return <Badge variant="default" className="bg-blue-600">1080p</Badge>
      case '720p':
        return <Badge variant="default" className="bg-green-600">720p</Badge>
      case '480p':
        return <Badge variant="secondary">480p</Badge>
      default:
        return <Badge variant="outline">{quality}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-lg">Loading your videos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
        Manage Your Media
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Uploaded Videos</CardTitle>
          <CardDescription>View and manage all your uploaded content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined}>All Types</SelectItem>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="shortFilm">Short Film</SelectItem>
                <SelectItem value="reel">Reel</SelectItem>
                <SelectItem value="clip">Clip</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined}>All Status</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="uploading">Uploading</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Film className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium mb-2">No videos found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType || filterStatus 
                  ? "Try adjusting your search or filters"
                  : "You haven't uploaded any videos yet"
                }
              </p>
              {!searchTerm && !filterType && !filterStatus && (
                <Link href="/upload">
                  <Button>Upload Your First Video</Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Dashboard Section</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <Image
                        src={video.cover_image_path || "/placeholder.svg"}
                        alt={video.title}
                        width={100}
                        height={56}
                        className="rounded object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{video.title}</div>
                        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {video.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {video.content_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{video.genre}</Badge>
                    </TableCell>
                    <TableCell>{formatDuration(video.duration_seconds)}</TableCell>
                    <TableCell>{getQualityBadge(video.quality)}</TableCell>
                    <TableCell>{getStatusBadge(video.status)}</TableCell>
                    <TableCell>
                      <Select 
                        value={video.is_public ? 'public' : 'private'} 
                        onValueChange={(value) => {
                          const newIsPublic = value === 'public'
                          handleTogglePublic({ ...video, is_public: newIsPublic })
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={video.dashboard_section || 'none'} 
                        onValueChange={(value) => handleSectionChange(video.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DASHBOARD_SECTIONS.map((section) => (
                            <SelectItem key={section.value} value={section.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{section.label}</span>
                                <span className="text-xs text-muted-foreground">{section.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{video.view_count}</div>
                        <div className="text-xs text-muted-foreground">
                          {video.rating_count > 0 && `★ ${video.rating_average.toFixed(1)}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(video.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(video.file_size)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.open(`/watch/${video.id}`, '_blank')}
                          title="Watch video"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleTogglePublic(video)}
                          title={video.is_public ? "Make private" : "Make public"}
                          className={video.is_public ? "text-green-500 hover:text-green-600" : "text-red-500 hover:text-red-600"}
                        >
                          {video.is_public ? (
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span className="text-xs">Public</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span className="text-xs">Private</span>
                            </div>
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(video.id)}
                          title="Delete video"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex justify-between items-center w-full">
            <p className="text-sm text-muted-foreground">
              Total videos: {filteredVideos.length} of {videos.length}
            </p>
            <Link href="/upload">
              <Button>Upload New Video</Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

