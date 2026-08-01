"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Pencil, Trash2, Eye, Play, Download, ExternalLink, Loader2, Film, Settings, ImageIcon, X, Star } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Video {
  id: string
  title: string
  description: string
  content_type?: string
  genre?: string
  duration?: number
  duration_seconds?: number
  quality?: string
  file_size?: number
  file_size_bytes?: number
  cover_image_path?: string
  file_path?: string
  manifest_url?: string
  backup_url?: string
  resolution?: string
  status: string
  view_count?: number
  rating_average?: number
  rating_count?: number
  created_at: string
  is_public?: boolean
  dashboard_section?: string
  source?: 'videos' | 'video_assets' // Track which table the video comes from
}

// Dashboard sections — controls where videos appear on the home dashboard
const DASHBOARD_SECTIONS = [
  { value: 'new_releases', label: 'New Releases', description: 'Main top player + new releases row' },
  { value: 'featured', label: 'Featured Movies', description: 'Featured section (optional)' },
  { value: 'top_movies', label: 'Top Movies', description: 'Top 10 Movies section' },
  { value: 'trending', label: 'Trending Now', description: 'Trending reels row' },
  { value: 'coming_soon', label: 'Coming Soon', description: 'Coming soon section' },
  { value: 'none', label: 'Hidden', description: 'Not shown on dashboard' }
]

export default function ManageMediaPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string | undefined>()
  const [filterStatus, setFilterStatus] = useState<string | undefined>()
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    genre: '',
    content_type: '',
    dashboard_section: 'none',
    is_public: true,
    manifest_url: '',
    backup_url: ''
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  // Fetch user's videos from database
  useEffect(() => {
    if (user?.id) {
      fetchVideos()
    }
  }, [user?.id])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      
      // Fetch from both tables
      const videosQuery = user?.role === 'admin'
        ? supabase.from('videos').select('*').order('created_at', { ascending: false })
        : supabase.from('videos').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
      
      const videoAssetsQuery = user?.role === 'admin'
        ? supabase.from('video_assets').select('*').order('created_at', { ascending: false })
        : supabase.from('video_assets').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
      
      const [videosData, videoAssetsData] = await Promise.all([
        videosQuery,
        videoAssetsQuery
      ])

      // Combine and normalize data
      const allVideos: Video[] = [
        ...(videosData.data || []).map(v => ({
          ...v,
          source: 'videos' as const,
          duration: v.duration_seconds,
          file_size: v.file_size_bytes,
          cover_image_path: v.cover_image_path || undefined
        })),
        ...(videoAssetsData.data || []).map(v => {
          console.log('Video asset cover_image_path:', v.id, v.title, ':', v.cover_image_path)
          return {
            ...v,
            source: 'video_assets' as const,
            duration_seconds: v.duration,
            file_size_bytes: v.file_size,
            file_path: v.manifest_url,
            view_count: 0,
            rating_average: 0,
            rating_count: 0,
            cover_image_path: v.cover_image_path || undefined,
            backup_url: (v as any).backup_url || undefined
          }
        })
      ]
      
      console.log('All videos after normalization:', allVideos.map(v => ({
        id: v.id,
        title: v.title,
        cover_image_path: v.cover_image_path
      })))

      // Sort by created_at
      allVideos.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setVideos(allVideos)
    } catch (error: any) {
      console.error('Error fetching videos:', error)
      toast({
        title: "Error",
        description: "Failed to load videos. Please try again.",
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

  const handleDelete = async (video: Video) => {
    if (confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      try {
        const table = video.source || 'videos'
        
        // Delete from appropriate table
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', video.id)

        if (error) throw error

        // Remove from local state
        setVideos(videos.filter((v) => v.id !== video.id))
        
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

  const handleEdit = (video: Video) => {
    setEditingVideo(video)
    setEditForm({
      title: video.title,
      description: video.description || '',
      genre: video.genre || '',
      content_type: video.content_type || '',
      dashboard_section: video.dashboard_section || 'none',
      is_public: video.is_public !== false,
      manifest_url: video.manifest_url || video.file_path || '',
      backup_url: (video as any).backup_url || ''
    })
    // Set cover preview
    const coverUrl = getCoverImageUrl(video)
    setCoverPreview(coverUrl)
    setCoverFile(null)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCoverFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingVideo) return

    try {
      setUploadingCover(true)
      
      // Upload cover image if provided
      let coverImagePath: string | null = null
      if (coverFile) {
        console.log('📸 Editing: Uploading cover image:', coverFile.name, 'Size:', coverFile.size, 'Type:', coverFile.type)
        
        // Try both buckets - videos and covionfilms
        const bucketsToTry = ['covionfilms', 'videos']
        let uploadSuccess = false
        
        for (const bucketName of bucketsToTry) {
          if (uploadSuccess) break
          
          try {
            const coverFileExt = coverFile.name.split('.').pop()
            const coverFileName = `${editingVideo.id}_cover.${coverFileExt}`
            const coverPath = `covers/${coverFileName}`
            
            console.log(`📸 Editing: Trying bucket "${bucketName}" with path:`, coverPath)
            
            const { data: uploadData, error: coverError } = await supabase.storage
              .from(bucketName)
              .upload(coverPath, coverFile, {
                contentType: coverFile.type,
                upsert: true
              })
            
            if (coverError) {
              console.error(`❌ Editing: Failed to upload to "${bucketName}":`, coverError)
              console.error('Cover upload error details:', JSON.stringify(coverError, null, 2))
              continue // Try next bucket
            } else {
              console.log(`✅ Editing: Cover image uploaded successfully to "${bucketName}":`, uploadData)
              // Get public URL
              const { data: coverUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(coverPath)
              
              coverImagePath = coverUrlData?.publicUrl || null
              console.log('✅ Editing: Cover image public URL:', coverImagePath)
              
              if (!coverImagePath) {
                console.error('❌ Editing: Failed to get public URL for cover image')
                continue // Try next bucket
              }
              
              uploadSuccess = true
              break
            }
          } catch (coverErr) {
            console.error(`❌ Editing: Error uploading to "${bucketName}" (catch):`, coverErr)
            continue // Try next bucket
          }
        }
        
        if (!uploadSuccess) {
          console.error('❌ Editing: Failed to upload cover image to all buckets')
          toast({
            title: "Warning",
            description: "Video updated but cover image upload failed. Check console for details.",
            variant: "default"
          })
        }
      } else {
        console.log('ℹ️ Editing: No cover file provided for upload')
      }
      
      console.log('📸 Editing: Final coverImagePath to save:', coverImagePath)

      const table = editingVideo.source || 'videos'
      const updates: any = {
        title: editForm.title,
        description: editForm.description,
        genre: editForm.genre,
        dashboard_section: editForm.dashboard_section,
        is_public: editForm.is_public,
        updated_at: new Date().toISOString()
      }

      // Only add content_type if it exists in the table
      if (editForm.content_type) {
        updates.content_type = editForm.content_type
      }

      // Update cover_image_path if new cover was uploaded
      if (coverImagePath) {
        updates.cover_image_path = coverImagePath
        console.log('💾 Editing: Will update cover_image_path to:', coverImagePath)
      } else {
        console.log('ℹ️ Editing: Not updating cover_image_path (no new cover uploaded)')
      }

      // Update manifest_url for video_assets table
      if (table === 'video_assets' && editForm.manifest_url) {
        updates.manifest_url = editForm.manifest_url
      }

      // Update file_path for videos table
      if (table === 'videos' && editForm.manifest_url) {
        updates.file_path = editForm.manifest_url
      }

      // Update backup_url if provided (for video_assets)
      if (table === 'video_assets' && editForm.backup_url) {
        updates.backup_url = editForm.backup_url
      }

      console.log('💾 Editing: Updating database with:', updates)

      const { data: updateResult, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', editingVideo.id)
        .select()
      
      console.log('💾 Editing: Update result:', updateResult)

      if (error) throw error

      // Update local state
      setVideos(videos.map(v => 
        v.id === editingVideo.id 
          ? { ...v, ...updates }
          : v
      ))

      setEditingVideo(null)
      setCoverFile(null)
      setCoverPreview(null)
      setUploadingCover(false)
      
      toast({
        title: "Video Updated",
        description: coverImagePath ? "Video and cover image have been updated successfully." : "Changes have been saved successfully.",
      })
    } catch (error: any) {
      console.error('Error updating video:', error)
      setUploadingCover(false)
      toast({
        title: "Error",
        description: "Failed to update video. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleTogglePublic = async (video: Video) => {
    try {
      const table = video.source || 'videos'
      
      const { error } = await supabase
        .from(table)
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

  const handleSectionChange = async (video: Video, newSection: string) => {
    try {
      const table = video.source || 'videos'
      
      const { error } = await supabase
        .from(table)
        .update({ dashboard_section: newSection })
        .eq('id', video.id)

      if (error) throw error

      setVideos(videos.map(v => 
        v.id === video.id ? { ...v, dashboard_section: newSection } : v
      ))

      toast({
        title: "Dashboard Updated",
        description: `"${video.title}" is now in ${DASHBOARD_SECTIONS.find(s => s.value === newSection)?.label || 'Hidden'}.`,
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

  const handleSetAsMainPlayer = async (video: Video) => {
    try {
      const table = video.source || 'videos'

      const { error } = await supabase
        .from(table)
        .update({ dashboard_section: 'new_releases', is_public: true })
        .eq('id', video.id)

      if (error) throw error

      setVideos(videos.map(v =>
        v.id === video.id ? { ...v, dashboard_section: 'new_releases', is_public: true } : v
      ))

      toast({
        title: "Main Player Updated",
        description: `"${video.title}" will play in the top hero player on the dashboard.`,
      })
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set main player",
        variant: "destructive",
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

  const getVideoDuration = (video: Video) => {
    return video.duration || video.duration_seconds || 0
  }

  const getCoverImageUrl = (video: Video): string | null => {
    if (!video.cover_image_path) {
      console.log('No cover_image_path for video:', video.id, video.title)
      return null
    }
    
    console.log('Cover image path for video:', video.id, video.title, ':', video.cover_image_path)
    
    // If it's already a full URL, return it
    if (video.cover_image_path.startsWith('http://') || video.cover_image_path.startsWith('https://')) {
      console.log('Using full URL:', video.cover_image_path)
      return video.cover_image_path
    }
    
    // If it's a storage path, try both buckets
    if (video.cover_image_path.startsWith('videos/') || video.cover_image_path.startsWith('covers/')) {
      // Try both buckets
      for (const bucketName of ['covionfilms', 'videos']) {
        try {
          const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(video.cover_image_path)
          const url = data?.publicUrl || null
          if (url) {
            console.log(`Converted storage path to URL using "${bucketName}":`, video.cover_image_path, '->', url)
            return url
          }
        } catch (err) {
          console.log(`Failed to get URL from "${bucketName}":`, err)
        }
      }
      return null
    }
    
    // If it starts with /, it's a relative path
    if (video.cover_image_path.startsWith('/')) {
      console.log('Using relative path:', video.cover_image_path)
      return video.cover_image_path
    }
    
    // Try to get public URL from storage (assume it's a storage path without prefix)
    // Try both buckets
    for (const bucketName of ['covionfilms', 'videos']) {
      try {
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(video.cover_image_path)
        const url = data?.publicUrl || null
        if (url) {
          console.log(`Tried to get public URL from "${bucketName}":`, video.cover_image_path, '->', url)
          return url
        }
      } catch (err) {
        console.log(`Failed to get URL from "${bucketName}":`, err)
      }
    }
    return null
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
      <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
        Manage Your Media
      </h1>

      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="pt-6 space-y-3 text-sm">
          <p className="font-medium text-primary">Main top player (hero video)</p>
          <p className="text-muted-foreground">
            Click the <strong>star button</strong> on a video, or set <strong>Show on Dashboard</strong> to <strong>New Releases</strong>.
            Video must be <strong>Public</strong> and <strong>Ready</strong>.
          </p>
          <ul className="grid sm:grid-cols-2 gap-2 text-muted-foreground">
            <li><strong>★ New Releases</strong> → main top player</li>
            <li><strong>Top Movies</strong> → top 10 section</li>
            <li><strong>Hidden</strong> → not on dashboard</li>
          </ul>
        </CardContent>
      </Card>
      
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
                  <TableHead>Show on Dashboard</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      {(() => {
                        const coverUrl = getCoverImageUrl(video)
                        console.log('Rendering cover for video:', video.id, video.title, 'URL:', coverUrl, 'Original path:', video.cover_image_path)
                        return coverUrl ? (
                          <Image
                            src={coverUrl}
                            alt={video.title}
                            width={100}
                            height={56}
                            className="rounded object-cover"
                            unoptimized
                            onError={(e) => {
                              console.error('Image failed to load:', coverUrl, 'for video:', video.id, 'Original path:', video.cover_image_path)
                              // Fallback to placeholder if image fails to load
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', coverUrl)
                            }}
                          />
                        ) : (
                          <div className="w-[100px] h-[56px] bg-muted rounded flex items-center justify-center">
                            <Film className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )
                      })()}
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
                    <TableCell>{formatDuration(getVideoDuration(video))}</TableCell>
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
                        onValueChange={(value) => handleSectionChange(video, value)}
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
                          variant={video.dashboard_section === 'new_releases' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleSetAsMainPlayer(video)}
                          title="Show in main top player on dashboard"
                          className={video.dashboard_section === 'new_releases' ? 'bg-primary' : ''}
                        >
                          <Star className={`h-4 w-4 mr-1 ${video.dashboard_section === 'new_releases' ? 'fill-current' : ''}`} />
                          Main Player
                        </Button>
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
                          onClick={() => handleEdit(video)}
                          title="Edit video"
                        >
                          <Pencil className="h-4 w-4" />
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
                          onClick={() => handleDelete(video)}
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

      {/* Edit Dialog */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Video</CardTitle>
              <CardDescription>Update video information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex items-center space-x-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors flex-1">
                    <input
                      type="file"
                      id="edit-cover"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                      disabled={uploadingCover}
                    />
                    <label htmlFor="edit-cover" className="cursor-pointer">
                      {coverPreview ? (
                        <div className="space-y-2">
                          <Image
                            src={coverPreview}
                            alt="Cover preview"
                            width={150}
                            height={84}
                            className="mx-auto rounded object-cover"
                            unoptimized
                          />
                          <p className="text-sm text-gray-500">Click to change cover image</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="text-sm text-gray-500">Click to upload cover image</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {coverPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCoverFile(null)
                        setCoverPreview(getCoverImageUrl(editingVideo!))
                      }}
                      className="shrink-0"
                      disabled={uploadingCover}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  disabled={uploadingCover}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  disabled={uploadingCover}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select 
                    value={editForm.content_type} 
                    onValueChange={(value) => setEditForm({ ...editForm, content_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Movie</SelectItem>
                      <SelectItem value="series">Series</SelectItem>
                      <SelectItem value="documentary">Documentary</SelectItem>
                      <SelectItem value="short">Short Film</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select 
                    value={editForm.genre} 
                    onValueChange={(value) => setEditForm({ ...editForm, genre: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="action">Action</SelectItem>
                      <SelectItem value="comedy">Comedy</SelectItem>
                      <SelectItem value="drama">Drama</SelectItem>
                      <SelectItem value="horror">Horror</SelectItem>
                      <SelectItem value="romance">Romance</SelectItem>
                      <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                      <SelectItem value="thriller">Thriller</SelectItem>
                      <SelectItem value="documentary">Documentary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dashboard Section</Label>
                  <Select 
                    value={editForm.dashboard_section} 
                    onValueChange={(value) => setEditForm({ ...editForm, dashboard_section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DASHBOARD_SECTIONS.map((section) => (
                        <SelectItem key={section.value} value={section.value}>
                          {section.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select 
                    value={editForm.is_public ? 'public' : 'private'} 
                    onValueChange={(value) => setEditForm({ ...editForm, is_public: value === 'public' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Video URL Fields */}
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Primary Video URL</Label>
                  <Input
                    type="url"
                    value={editForm.manifest_url}
                    onChange={(e) => setEditForm({ ...editForm, manifest_url: e.target.value })}
                    placeholder="https://example.com/video.m3u8 or manifest URL"
                  />
                  <p className="text-xs text-muted-foreground">
                    Main streaming URL (HLS manifest, MP4, or YouTube/Dropbox link)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Backup Video URL (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      value={editForm.backup_url}
                      onChange={(e) => setEditForm({ ...editForm, backup_url: e.target.value })}
                      placeholder="https://backup.example.com/video.m3u8"
                      className="flex-1"
                    />
                    {editForm.backup_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Swap backup to primary
                          setEditForm({
                            ...editForm,
                            manifest_url: editForm.backup_url,
                            backup_url: editForm.manifest_url
                          })
                        }}
                        title="Use backup as primary"
                      >
                        Swap
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fallback URL if primary fails. Use "Swap" to make backup the primary URL.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingVideo(null)
                  setCoverFile(null)
                  setCoverPreview(null)
                }}
                disabled={uploadingCover}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={uploadingCover}>
                {uploadingCover ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}

