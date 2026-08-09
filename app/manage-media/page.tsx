"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Pencil, Trash2, Eye, Play, Download, ExternalLink, Loader2, Film, Settings, ImageIcon, X, Star, Lock, Unlock, Layers, Plus } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { EPISODE_PURCHASE_PRICE, MOVIE_PURCHASE_PRICE, formatUsd } from "@/lib/content-pricing"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Video {
  id: string
  title: string
  description: string
  content_type?: string
  parent_id?: string
  episode_number?: number
  is_free?: boolean
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
  cloudflare_stream_uid?: string
  trailer_cloudflare_stream_uid?: string
  producer?: string
  release_year?: number
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
  { value: 'top_movies', label: 'Top Movies', description: 'Top 10 Movies section (falls back to most viewed if empty)' },
  { value: 'trending', label: 'Trending Now', description: 'Trending reels row' },
  { value: 'coming_soon', label: 'Upcoming Movies', description: 'Upcoming / coming soon row on dashboard' },
  { value: 'none', label: 'Hidden', description: 'Not shown on dashboard' }
]

export default function ManageMediaPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string | undefined>()
  const [filterStatus, setFilterStatus] = useState<string | undefined>()
  const [filterPricing, setFilterPricing] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<'all' | 'titles'>('titles')
  const [managingSeriesId, setManagingSeriesId] = useState<string | null>(null)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    genre: '',
    content_type: '',
    parent_id: '',
    episode_number: '',
    is_free: false,
    dashboard_section: 'none',
    is_public: true,
    manifest_url: '',
    cloudflare_stream_uid: '',
    trailer_cloudflare_stream_uid: '',
    producer: '',
    release_year: '',
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingEpisodeThumbId, setUploadingEpisodeThumbId] = useState<string | null>(null)

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
        ...(videoAssetsData.data || []).map((v) => ({
            ...v,
            source: 'video_assets' as const,
            duration_seconds: v.duration,
            file_size_bytes: v.file_size,
            file_path: v.manifest_url,
            view_count: (v as { view_count?: number }).view_count ?? 0,
            rating_average: 0,
            rating_count: 0,
            cover_image_path: v.cover_image_path || undefined,
            backup_url: (v as { backup_url?: string }).backup_url || undefined,
            cloudflare_stream_uid: v.cloudflare_stream_uid || undefined,
            trailer_cloudflare_stream_uid: v.trailer_cloudflare_stream_uid || undefined,
            producer: v.producer || undefined,
            release_year: v.release_year ?? undefined,
          }))
      ]

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

  const parentTitles = videos.reduce<Record<string, string>>((acc, video) => {
    acc[video.id] = video.title
    return acc
  }, {})

  const episodeCountByParent = videos.reduce<Record<string, number>>((acc, video) => {
    if (video.parent_id) {
      acc[video.parent_id] = (acc[video.parent_id] || 0) + 1
    }
    return acc
  }, {})

  const parentOptions = videos.filter(
    (video) =>
      video.source === 'video_assets' &&
      (video.content_type === 'movie' || video.content_type === 'series')
  )

  const seriesEpisodes = managingSeriesId
    ? videos
        .filter((video) => video.parent_id === managingSeriesId)
        .sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0))
    : []

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || video.content_type === filterType
    const matchesStatus = !filterStatus || video.status === filterStatus
    const matchesPricing =
      !filterPricing ||
      (filterPricing === 'free' && video.is_free) ||
      (filterPricing === 'paid' && !video.is_free)
    const matchesView =
      viewMode === 'all' ||
      video.content_type !== 'episode'

    return matchesSearch && matchesType && matchesStatus && matchesPricing && matchesView
  })

  const handleToggleFree = async (video: Video) => {
    if (video.source !== 'video_assets') {
      toast({
        title: "Not supported",
        description: "Pricing controls only apply to video_assets entries.",
        variant: "destructive",
      })
      return
    }

    try {
      const nextValue = !video.is_free
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('You must be signed in to update pricing.')
      }

      const response = await fetch('/api/media/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          videoId: video.id,
          updates: { is_free: nextValue },
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update pricing')
      }

      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, is_free: nextValue } : v))
      )

      toast({
        title: nextValue ? "Marked as free" : "Marked as paid",
        description: `"${video.title}" is now ${nextValue ? 'free' : 'paid'} to watch.`,
      })
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update pricing",
        variant: "destructive",
      })
    }
  }

  const managingSeries = managingSeriesId
    ? videos.find((v) => v.id === managingSeriesId) || null
    : null


  const getPricingLabel = (video: Video) => {
    if (video.is_free) return 'Free'
    if (video.content_type === 'episode') return formatUsd(EPISODE_PURCHASE_PRICE)
    return formatUsd(MOVIE_PURCHASE_PRICE)
  }

  const getContentTypeLabel = (video: Video) => {
    if (video.content_type === 'episode' && video.episode_number) {
      return `Ep ${video.episode_number}`
    }
    return video.content_type || 'unknown'
  }

  const handleDelete = async (video: Video) => {
    if (confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      try {
        const table = video.source || 'videos'
        
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', video.id)

        if (error) throw error

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
      parent_id: video.parent_id || '',
      episode_number: video.episode_number ? String(video.episode_number) : '',
      is_free: Boolean((video as any).is_free),
      dashboard_section: video.dashboard_section || 'none',
      is_public: video.is_public !== false,
      manifest_url: video.manifest_url || video.file_path || '',
      cloudflare_stream_uid: (video as any).cloudflare_stream_uid || '',
      trailer_cloudflare_stream_uid: (video as any).trailer_cloudflare_stream_uid || '',
      producer: (video as any).producer || '',
      release_year: (video as any).release_year ? String((video as any).release_year) : '',
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

  const handleEpisodeThumbnailUpload = async (
    episode: Video,
    file: File
  ) => {
    if (episode.source !== 'video_assets') {
      toast({
        title: 'Not supported',
        description: 'Thumbnail upload only applies to video_assets entries.',
        variant: 'destructive',
      })
      return
    }

    try {
      setUploadingEpisodeThumbId(episode.id)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('You must be signed in to upload a thumbnail.')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('videoId', episode.id)

      const uploadResponse = await fetch('/api/media/cover', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      const uploadResult = (await uploadResponse.json()) as {
        coverImagePath?: string
        error?: string
      }

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || 'Thumbnail upload failed')
      }

      const coverImagePath = uploadResult.coverImagePath
      if (!coverImagePath) {
        throw new Error('Thumbnail upload did not return a path')
      }

      const response = await fetch('/api/media/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          videoId: episode.id,
          updates: { cover_image_path: coverImagePath },
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save thumbnail')
      }

      setVideos((prev) =>
        prev.map((v) =>
          v.id === episode.id
            ? { ...v, cover_image_path: coverImagePath }
            : v
        )
      )

      toast({
        title: 'Thumbnail updated',
        description: `Custom thumbnail saved for "${episode.title}".`,
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to upload thumbnail',
        variant: 'destructive',
      })
    } finally {
      setUploadingEpisodeThumbId(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingVideo) return

    try {
      setUploadingCover(true)
      
      // Upload cover image if provided
      let coverImagePath: string | null = null
      if (coverFile) {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          throw new Error('You must be signed in to upload a cover image.')
        }

        const formData = new FormData()
        formData.append('file', coverFile)
        formData.append('videoId', editingVideo.id)

        const uploadResponse = await fetch('/api/media/cover', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        })

        const uploadResult = (await uploadResponse.json()) as {
          coverImagePath?: string
          error?: string
        }

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || 'Cover image upload failed')
        }

        coverImagePath = uploadResult.coverImagePath || null
      }

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

      if (table === 'video_assets') {
        updates.parent_id = editForm.parent_id || null
        updates.episode_number = editForm.episode_number
          ? parseInt(editForm.episode_number, 10)
          : null
        updates.is_free = editForm.is_free
        updates.cloudflare_stream_uid = editForm.cloudflare_stream_uid.trim() || null
        updates.trailer_cloudflare_stream_uid = editForm.trailer_cloudflare_stream_uid.trim() || null
        updates.producer = editForm.producer.trim() || null
        const parsedYear = editForm.release_year.trim() ? parseInt(editForm.release_year, 10) : NaN
        updates.release_year = Number.isFinite(parsedYear) ? parsedYear : null
        if (editForm.manifest_url.trim()) {
          updates.manifest_url = editForm.manifest_url.trim()
        }
      }

      // Update cover_image_path if new cover was uploaded
      if (coverImagePath) {
        updates.cover_image_path = coverImagePath
      }

      // Update manifest_url / file_path for legacy videos table only
      if (table === 'videos' && editForm.manifest_url) {
        updates.file_path = editForm.manifest_url
      }

      let savedVideo: Record<string, unknown> | null = null

      if (table === 'video_assets') {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          throw new Error('You must be signed in to save changes.')
        }

        const response = await fetch('/api/media/update', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            videoId: editingVideo.id,
            updates,
          }),
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Failed to update video')
        }

        savedVideo = result.video
      } else {
        const { data, error } = await supabase
          .from(table)
          .update(updates)
          .eq('id', editingVideo.id)
          .select('*')
          .maybeSingle()

        if (error) throw error
        if (!data) {
          throw new Error('Update did not save. You may not have permission to edit this video.')
        }
        savedVideo = data
      }

      // Update local state from what was actually saved
      setVideos((prev) =>
        prev.map((v) =>
          v.id === editingVideo.id
            ? {
                ...v,
                ...savedVideo,
                source: table,
                trailer_cloudflare_stream_uid:
                  (savedVideo?.trailer_cloudflare_stream_uid as string) ||
                  editForm.trailer_cloudflare_stream_uid.trim() ||
                  undefined,
                cloudflare_stream_uid:
                  (savedVideo?.cloudflare_stream_uid as string) ||
                  editForm.cloudflare_stream_uid.trim() ||
                  undefined,
              }
            : v
        )
      )

      setEditingVideo(null)
      setCoverFile(null)
      setCoverPreview(null)
      setUploadingCover(false)
      
      toast({
        title: "Video Updated",
        description: coverImagePath
          ? "Video and cover image have been updated successfully."
          : editForm.trailer_cloudflare_stream_uid.trim()
            ? "Saved, including Trailer Cloudflare Video ID."
            : "Changes have been saved successfully.",
      })
    } catch (error: any) {
      console.error('Error updating video:', error)
      setUploadingCover(false)
      toast({
        title: "Error",
        description: error?.message || "Failed to update video. Please try again.",
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
      return null
    }

    if (video.cover_image_path.startsWith('http://') || video.cover_image_path.startsWith('https://')) {
      return video.cover_image_path
    }

    if (video.cover_image_path.startsWith('videos/') || video.cover_image_path.startsWith('covers/')) {
      for (const bucketName of ['covionfilms', 'videos']) {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(video.cover_image_path)
        if (data?.publicUrl) {
          return data.publicUrl
        }
      }
      return null
    }

    if (video.cover_image_path.startsWith('/')) {
      return video.cover_image_path
    }

    for (const bucketName of ['covionfilms', 'videos']) {
      const { data } = supabase.storage.from(bucketName).getPublicUrl(video.cover_image_path)
      if (data?.publicUrl) {
        return data.publicUrl
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
        <CardContent className="pt-6 space-y-4 text-sm">
          <div>
            <p className="font-medium text-primary">Main top player (hero video)</p>
            <p className="text-muted-foreground">
              Click the <strong>star button</strong> on a video, or set <strong>Show on Dashboard</strong> to <strong>New Releases</strong>.
              Video must be <strong>Public</strong> and <strong>Ready</strong>. Set a <strong>Trailer Video ID</strong> in edit to preview a trailer in the hero player while keeping a separate full movie ID.
            </p>
          </div>
          <div className="border-t border-primary/20 pt-4">
            <p className="font-medium text-primary">Episodes & pricing</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li><strong>Series / Movie</strong> — parent title; add episodes from <Link href="/upload" className="text-primary hover:underline">Upload</Link></li>
              <li><strong>Episode</strong> — link to a parent, set episode number, free or paid ({formatUsd(EPISODE_PURCHASE_PRICE)}/ep)</li>
              <li><strong>Standalone movie</strong> — paid by default at {formatUsd(MOVIE_PURCHASE_PRICE)} unless marked free</li>
              <li><strong>Standard / Family</strong> subscribers watch everything for free</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Uploaded Videos</CardTitle>
          <CardDescription>View and manage all your uploaded content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
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
                <SelectItem value="series">Series</SelectItem>
                <SelectItem value="episode">Episode</SelectItem>
                <SelectItem value="documentary">Documentary</SelectItem>
                <SelectItem value="short">Short Film</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPricing} onValueChange={setFilterPricing}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by pricing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined}>All Pricing</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
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
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'all' | 'titles')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="titles">Titles only</SelectItem>
                <SelectItem value="all">Titles + episodes</SelectItem>
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
                  <TableHead>Parent / Episodes</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Dashboard</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      {(() => {
                        const coverUrl = getCoverImageUrl(video)
                        return coverUrl ? (
                          <div className="w-[68px] h-[100px] relative rounded overflow-hidden bg-black">
                            <Image
                              src={coverUrl}
                              alt={video.title}
                              fill
                              className="object-contain"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-[68px] h-[100px] bg-muted rounded flex items-center justify-center">
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
                        {getContentTypeLabel(video)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {video.parent_id ? (
                        <span className="text-sm text-muted-foreground">
                          {parentTitles[video.parent_id] || video.parent_id.slice(0, 8) + '…'}
                        </span>
                      ) : (video.content_type === 'series' || video.content_type === 'movie') ? (
                        <div className="space-y-1">
                          <span className="text-sm">{episodeCountByParent[video.id] || 0} episodes</span>
                          {video.source === 'video_assets' && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-primary"
                              onClick={() => setManagingSeriesId(video.id)}
                            >
                              <Layers className="h-3 w-3 mr-1 inline" />
                              Manage
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {video.source === 'video_assets' ? (
                        <div className="space-y-2">
                          <Badge
                            variant={video.is_free ? 'default' : 'secondary'}
                            className={video.is_free ? 'bg-green-600' : ''}
                          >
                            {getPricingLabel(video)}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={Boolean(video.is_free)}
                              onCheckedChange={() => handleToggleFree(video)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {video.is_free ? 'Free' : 'Paid'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline">Legacy</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{video.genre}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(video.status)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{(video.view_count ?? 0).toLocaleString()}</span>
                    </TableCell>
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
                      <div className="flex flex-col gap-2">
                        {(video.content_type === 'series' || video.content_type === 'movie') && video.source === 'video_assets' && (
                          <Link href={`/upload?parent=${video.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              <Plus className="h-4 w-4 mr-1" />
                              Add Ep
                            </Button>
                          </Link>
                        )}
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

          {managingSeriesId && managingSeries && (
            <Dialog
              open={Boolean(managingSeriesId)}
              onOpenChange={(open) => {
                if (!open) setManagingSeriesId(null)
              }}
            >
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Manage — {managingSeries.title}
                  </DialogTitle>
                  <DialogDescription>
                    Control free/paid pricing for the full title and each episode.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                  <div className="rounded-lg border border-gray-700 bg-card/50 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">Full title / series</p>
                        <p className="text-sm text-muted-foreground">
                          {managingSeries.is_free
                            ? 'Free to watch'
                            : `Paid — ${formatUsd(MOVIE_PURCHASE_PRICE)} unlocks the whole title`}
                        </p>
                      </div>
                      <Badge
                        variant={managingSeries.is_free ? 'default' : 'secondary'}
                        className={managingSeries.is_free ? 'bg-green-600' : ''}
                      >
                        {managingSeries.is_free ? 'Free' : formatUsd(MOVIE_PURCHASE_PRICE)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-md border border-gray-800 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">Mark full title free</p>
                        <p className="text-xs text-muted-foreground">
                          When off, viewers pay {formatUsd(MOVIE_PURCHASE_PRICE)} (or subscribe)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={Boolean(managingSeries.is_free)}
                          onCheckedChange={() => handleToggleFree(managingSeries)}
                        />
                        <span className="text-xs text-muted-foreground w-10">
                          {managingSeries.is_free ? 'Free' : 'Paid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">Episodes ({seriesEpisodes.length})</p>
                        <p className="text-sm text-muted-foreground">
                          Paid episodes cost {formatUsd(EPISODE_PURCHASE_PRICE)} each. Default thumbnails are fine; upload a custom one optionally.
                        </p>
                      </div>
                      <Link href={`/upload?parent=${managingSeriesId}`}>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Episode
                        </Button>
                      </Link>
                    </div>

                    {seriesEpisodes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-gray-700 rounded-lg">
                        No episodes yet. Add episodes to set per-episode pricing.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                        {seriesEpisodes.map((episode) => {
                          const episodeThumb = getCoverImageUrl(episode)
                          return (
                          <div
                            key={episode.id}
                            className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-800 px-3 py-2"
                          >
                            <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                              {episodeThumb ? (
                                <Image
                                  src={episodeThumb}
                                  alt={episode.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/placeholder.svg'
                                  }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Film className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {episode.episode_number || '?'}
                              </span>
                              {!episode.is_free && (
                                <Lock className="absolute top-1 right-1 h-3 w-3 text-white drop-shadow" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{episode.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {episode.is_free
                                  ? 'Free episode'
                                  : `Paid — ${formatUsd(EPISODE_PURCHASE_PRICE)}`}
                              </p>
                              <label
                                htmlFor={`episode-thumb-${episode.id}`}
                                className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline"
                              >
                                {uploadingEpisodeThumbId === episode.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Uploading…
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="h-3 w-3" />
                                    {episodeThumb ? 'Replace thumbnail' : 'Upload thumbnail'}
                                  </>
                                )}
                              </label>
                              <input
                                id={`episode-thumb-${episode.id}`}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                disabled={uploadingEpisodeThumbId === episode.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    void handleEpisodeThumbnailUpload(episode, file)
                                  }
                                  e.target.value = ''
                                }}
                              />
                            </div>
                            <Badge
                              variant={episode.is_free ? 'default' : 'secondary'}
                              className={episode.is_free ? 'bg-green-600' : ''}
                            >
                              {episode.is_free ? 'Free' : formatUsd(EPISODE_PURCHASE_PRICE)}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={Boolean(episode.is_free)}
                                onCheckedChange={() => handleToggleFree(episode)}
                              />
                              <span className="text-xs text-muted-foreground w-10">
                                {episode.is_free ? 'Free' : 'Paid'}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setManagingSeriesId(null)
                                handleEdit(episode)
                              }}
                              title="Edit episode"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setManagingSeriesId(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
              {editingVideo.source === 'video_assets' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Producer</Label>
                    <Input
                      value={editForm.producer}
                      onChange={(e) => setEditForm({ ...editForm, producer: e.target.value })}
                      placeholder="Production company or producer"
                      disabled={uploadingCover}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      min="1900"
                      max="2100"
                      value={editForm.release_year}
                      onChange={(e) => setEditForm({ ...editForm, release_year: e.target.value })}
                      placeholder="2026"
                      disabled={uploadingCover}
                    />
                  </div>
                </div>
              )}
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
                      <SelectItem value="episode">Episode</SelectItem>
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
              {editForm.content_type === 'episode' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parent Movie / Series</Label>
                    <Select
                      value={editForm.parent_id}
                      onValueChange={(value) => setEditForm({ ...editForm, parent_id: value })}
                      disabled={uploadingCover}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentOptions.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.title} ({parent.content_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Episode Number</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editForm.episode_number}
                      onChange={(e) => setEditForm({ ...editForm, episode_number: e.target.value })}
                      disabled={uploadingCover}
                    />
                  </div>
                </div>
              )}
              {(editForm.content_type === 'movie' || editForm.content_type === 'series') && (
                <div className="rounded-lg border border-dashed border-gray-700 p-4 text-sm text-muted-foreground">
                  Add episodes from{' '}
                  <Link href={`/upload?parent=${editingVideo.id}`} className="text-primary hover:underline">
                    Upload → Episode
                  </Link>
                  . Whole title: {formatUsd(MOVIE_PURCHASE_PRICE)} unless marked free below.
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Free to watch</Label>
                  <p className="text-xs text-muted-foreground">
                    {editForm.content_type === 'episode'
                      ? `Paid episodes cost ${formatUsd(EPISODE_PURCHASE_PRICE)} each on the watch page`
                      : `Paid titles cost ${formatUsd(MOVIE_PURCHASE_PRICE)} on the watch page`}
                  </p>
                </div>
                <Switch
                  checked={editForm.is_free}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_free: checked })}
                  disabled={uploadingCover}
                />
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

              {editingVideo.source === 'video_assets' ? (
                <div className="space-y-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Full Movie Cloudflare Video ID</Label>
                    <Input
                      value={editForm.cloudflare_stream_uid}
                      onChange={(e) => setEditForm({ ...editForm, cloudflare_stream_uid: e.target.value })}
                      placeholder="Cloudflare Stream ID for watch page playback"
                      disabled={uploadingCover}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used on the watch page for full movie or episode playback.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Trailer Cloudflare Video ID</Label>
                    <Input
                      value={editForm.trailer_cloudflare_stream_uid}
                      onChange={(e) =>
                        setEditForm({ ...editForm, trailer_cloudflare_stream_uid: e.target.value })
                      }
                      placeholder="Separate ID for dashboard hero preview"
                      disabled={uploadingCover}
                    />
                    <p className="text-xs text-muted-foreground">
                      Plays in the dashboard main player when set. Required for New Releases hero — full movie ID is not used there.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Video URL</Label>
                    <Input
                      type="url"
                      value={editForm.manifest_url}
                      onChange={(e) => setEditForm({ ...editForm, manifest_url: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                      disabled={uploadingCover}
                    />
                    <p className="text-xs text-muted-foreground">
                      Legacy video entry — use Upload for new Cloudflare Stream titles.
                    </p>
                  </div>
                </div>
              )}
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

