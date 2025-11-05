"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Upload, X, ImageIcon, Video, AlertCircle, CheckCircle, Play, Globe } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export default function UploadPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [contentType, setContentType] = useState("")
  const [genre, setGenre] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<string>('')
  const [manifestUrl, setManifestUrl] = useState<string>('')
  const [videoInfo, setVideoInfo] = useState<{
    duration: number
    resolution: string
    fileSize: string
    quality: string
  } | null>(null)
  const [uploadStep, setUploadStep] = useState<'form' | 'converting' | 'uploading' | 'complete'>('form')
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file')
  const [externalUrl, setExternalUrl] = useState("")
  const [urlType, setUrlType] = useState<'dropbox' | 'youtube' | 'direct'>('direct')
  const [dashboardSection, setDashboardSection] = useState<string>('none')
  const router = useRouter()
  const { user } = useAuth()

  // Dashboard sections available for assignment
  const DASHBOARD_SECTIONS = [
    { value: 'featured', label: 'Featured Movies', description: 'Curated content at the top' },
    { value: 'new_releases', label: 'New Releases', description: 'Latest uploads section' },
    { value: 'top_movies', label: 'Top Movies', description: 'Most popular videos' },
    { value: 'trending', label: 'Trending Now', description: 'Currently popular content' },
    { value: 'coming_soon', label: 'Coming Soon', description: 'Upcoming releases' },
    { value: 'none', label: 'No Section', description: 'Hidden from dashboard' }
  ]

  // Helper function to get file size limits and display text
  const getFileSizeInfo = () => {
    if (user?.role === 'admin') {
      return {
        maxSize: 100 * 1024 * 1024 * 1024, // 100GB for admin
        displayLimit: '100GB',
        color: 'text-red-500'
      }
    }
    
    switch (user?.subscription) {
      case 'free':
        return {
          maxSize: 500 * 1024 * 1024, // 500MB
          displayLimit: '500MB',
          color: 'text-yellow-500'
        }
      case 'standard':
        return {
          maxSize: 2 * 1024 * 1024 * 1024, // 2GB
          displayLimit: '2GB',
          color: 'text-blue-500'
        }
      case 'premium':
        return {
          maxSize: 25 * 1024 * 1024 * 1024, // 25GB
          displayLimit: '25GB',
          color: 'text-purple-500'
        }
      case 'family':
        return {
          maxSize: 50 * 1024 * 1024 * 1024, // 50GB
          displayLimit: '50GB',
          color: 'text-green-500'
        }
      default:
        return {
          maxSize: 500 * 1024 * 1024, // 500MB default
          displayLimit: '500MB',
          color: 'text-gray-500'
        }
    }
  }

  // Check if user has permission to upload
  useEffect(() => {
    if (user && !['creator', 'admin', 'management'].includes(user.role)) {
      toast({
        title: "Access Denied",
        description: "You need creator permissions to upload content.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [user, router])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 handleFileChange called!')
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      console.log('✅ File selected:', selectedFile.name, 'Size:', selectedFile.size, 'Type:', selectedFile.type)
      
      // Check file size based on user role and subscription
      const { maxSize } = getFileSizeInfo()
      
      if (selectedFile.size > maxSize) {
        const maxSizeGB = (maxSize / (1024 * 1024 * 1024)).toFixed(1)
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
        const sizeDisplay = maxSize >= 1024 * 1024 * 1024 ? `${maxSizeGB}GB` : `${maxSizeMB}MB`
        
        toast({
          title: "File Too Large",
          description: `Your ${user?.role === 'admin' ? 'admin role' : user?.subscription} plan allows files up to ${sizeDisplay}. Please upgrade your plan or choose a smaller file.`,
          variant: "destructive",
        })
        return
      }
      
      // Set file immediately for UI feedback
      setFile(selectedFile)
      console.log('✅ File set in state')
      
      // Set basic info immediately without complex video processing
      const basicInfo = {
        duration: 0,
        resolution: 'Unknown',
        fileSize: (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB',
        quality: 'Unknown'
      }
      
      console.log('🔄 Setting basic info:', basicInfo)
      setVideoInfo(basicInfo)
      console.log('✅ Basic info set')
      
      // Try to get video metadata in a simpler way
      try {
        console.log('🚀 Starting simple video info detection...')
        
        // Create a simple video element
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.muted = true
        
        video.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded!')
          const duration = Math.round(video.duration)
          const resolution = `${video.videoWidth}x${video.videoHeight}`
          
          let quality = '480p'
          if (video.videoHeight >= 2160) quality = '4K'
          else if (video.videoHeight >= 1080) quality = '1080p'
          else if (video.videoHeight >= 720) quality = '720p'
          
          const updatedInfo = {
            duration,
            resolution,
            fileSize: basicInfo.fileSize,
            quality
          }
          
          console.log('🎯 Updated video info:', updatedInfo)
          setVideoInfo(updatedInfo)
        }
        
        video.onerror = (error) => {
          console.log('❌ Video metadata error:', error)
        }
        
        const objectUrl = URL.createObjectURL(selectedFile)
        video.src = objectUrl
        
      } catch (error) {
        console.log('❌ Error in video processing:', error)
      }
      
    } else {
      console.log('❌ No file selected')
    }
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

  const convertToHLS = async (videoFile: File): Promise<{ manifestUrl: string, videoId: string }> => {
    console.log('🎬 Starting HLS conversion...')
    setStatus('Loading ffmpeg.wasm... (first time is slow)')
    
    const ffmpeg = new FFmpeg()
    
    try {
      console.log('🔄 Loading FFmpeg core files...')
      
      // Load FFmpeg with multiple version fallbacks
      const loadFFmpeg = async () => {
        const sources = [
          // Version 0.12.6 - most stable
          {
            core: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
            wasm: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm',
            worker: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/ffmpeg-core.worker.js'
          },
          // Version 0.12.4 - alternative stable version
          {
            core: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js',
            wasm: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/ffmpeg-core.wasm',
            worker: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/ffmpeg-core.worker.js'
          },
          // Version 0.11.0 - older but very stable
          {
            core: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
            wasm: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm',
            worker: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js'
          }
        ]
        
        for (let i = 0; i < sources.length; i++) {
          try {
            console.log(`🔄 Trying FFmpeg version ${i + 1}...`)
            await ffmpeg.load({
              coreURL: await toBlobURL(sources[i].core, 'text/javascript'),
              wasmURL: await toBlobURL(sources[i].wasm, 'application/wasm'),
              workerURL: await toBlobURL(sources[i].worker, 'text/javascript'),
            })
            console.log(`✅ FFmpeg loaded successfully from version ${i + 1}`)
            return
          } catch (error: any) {
            console.warn(`⚠️ Version ${i + 1} failed:`, error.message)
            if (i === sources.length - 1) {
              console.error('❌ All FFmpeg versions failed to load')
              throw new Error('Failed to load FFmpeg from all sources. Please check your network connection.')
            }
          }
        }
      }
      
      await loadFFmpeg()
      
      console.log('✅ FFmpeg loaded successfully')
      
      setStatus('Preparing input...')
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))
      
      // Convert to HLS with CMAF (fMP4) segments
      setStatus('Converting to HLS/CMAF...')
      setUploadProgress(20)
      
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1',
        '-c:a', 'aac', '-b:a', '128k',
        '-g', '96', '-keyint_min', '96', '-sc_threshold', '0',
        '-hls_time', '4',
        '-hls_playlist_type', 'vod',
        '-hls_segment_type', 'fmp4',
        '-hls_flags', 'independent_segments',
        '-master_pl_name', 'master.m3u8',
        '-hls_segment_filename', 'v0/chunk-%05d.m4s',
        'v0/stream.m3u8'
      ])
      
      setUploadProgress(40)
      
      // Get all generated files
      const list = await ffmpeg.listDir('.')
      const chunkFiles = list
        .filter((f: any) => f.name.endsWith('.m3u8') || f.name.endsWith('.m4s') || f.name.endsWith('.mp4'))
        .map((f: any) => f.name)
      
      console.log('📁 Generated files:', chunkFiles)
      
      // Generate unique video ID
      const videoId = crypto.randomUUID()
      const basePath = `hls/${videoId}`
      
      setStatus('Uploading HLS segments to Supabase...')
      setUploadProgress(60)
      
      // Upload function for individual files
      async function uploadFile(path: string, mime: string) {
        const data = await ffmpeg.readFile(path)
        const blob = new Blob([data], { type: mime })
        
        const { error } = await supabase.storage
          .from('videos')
          .upload(`${basePath}/${path}`, blob, {
            contentType: mime,
            upsert: true,
          })
        
        if (error) throw error
        console.log(`✅ Uploaded: ${path}`)
      }
      
      // Upload all files with correct MIME types
      let uploadedCount = 0
      for (const f of chunkFiles) {
        const mime =
          f.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' :
          f.endsWith('.m4s')  ? 'video/mp4' :
          f.endsWith('.mp4')  ? 'video/mp4' :
          'application/octet-stream'
        
        await uploadFile(f, mime)
        uploadedCount++
        setUploadProgress(60 + (uploadedCount / chunkFiles.length) * 30)
      }
      
      setUploadProgress(90)
      
      // Get public URL to master.m3u8
      const { data: pub } = supabase.storage
        .from('videos')
        .getPublicUrl(`${basePath}/master.m3u8`)
      
      const manifestUrl = pub?.publicUrl ?? ''
      if (!manifestUrl) {
        throw new Error('Failed to get public URL for manifest')
      }
      
      setUploadProgress(100)
      setStatus('HLS conversion complete!')
      
      return { manifestUrl, videoId }
      
    } catch (error) {
      console.error('❌ HLS conversion failed:', error)
      
      // Fallback: Upload original file directly
      console.log('🔄 FFmpeg failed, falling back to direct upload...')
      setStatus('FFmpeg failed, uploading original file...')
      setUploadProgress(50) // Start at 50% for fallback
      
      try {
        const videoId = crypto.randomUUID()
        const fileName = `${videoId}_${videoFile.name}`
        
        // Upload to videos bucket (HLS bucket)
        const { data, error: uploadError } = await supabase.storage
          .from('videos')
          .upload(`direct/${fileName}`, videoFile, {
            contentType: 'video/mp4',
            upsert: false
          })
        
        if (uploadError) throw uploadError
        
        setUploadProgress(75) // Upload complete
        
        // Get public URL
        const { data: pub } = supabase.storage
          .from('videos')
          .getPublicUrl(`direct/${fileName}`)
        
        const directUrl = pub?.publicUrl ?? ''
        if (!directUrl) {
          throw new Error('Failed to get public URL for direct upload')
        }
        
        setUploadProgress(90) // URL retrieved
        
        // Create a simple HLS-like manifest for the direct file
        const manifestUrl = directUrl
        
        setUploadProgress(100) // Complete
        setStatus('Direct upload complete (no HLS conversion)')
        return { manifestUrl, videoId }
        
      } catch (fallbackError: any) {
        console.error('❌ Fallback upload also failed:', fallbackError)
        throw new Error(`Both HLS conversion and fallback upload failed: ${fallbackError.message}`)
      }
    }
  }

  // Convert Dropbox share link to direct download URL
  const convertDropboxUrl = (url: string): string => {
    // Dropbox share links: https://www.dropbox.com/s/xxxxx/file.mp4?dl=0
    // Convert to: https://www.dropbox.com/s/xxxxx/file.mp4?dl=1
    if (url.includes('dropbox.com') && url.includes('?dl=0')) {
      return url.replace('?dl=0', '?dl=1')
    }
    if (url.includes('dropbox.com') && !url.includes('?dl=')) {
      return url + (url.includes('?') ? '&' : '?') + 'dl=1'
    }
    return url
  }

  // Extract YouTube video ID and convert to embed URL
  const convertYouTubeUrl = (url: string): string => {
    // YouTube URLs can be in various formats:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/embed/VIDEO_ID
    
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(youtubeRegex)
    
    if (match && match[1]) {
      // Return embed URL for iframe embedding
      return `https://www.youtube.com/embed/${match[1]}`
    }
    
    // If already an embed URL, return as-is
    if (url.includes('youtube.com/embed/')) {
      return url
    }
    
    return url
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate based on upload type
    if (uploadType === 'file') {
      if (!file || !title || !description || !contentType || !genre) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields and select a video file.",
          variant: "destructive",
        })
        return
      }
    } else {
      if (!externalUrl || !title || !description || !contentType || !genre) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields and provide an external URL.",
          variant: "destructive",
        })
        return
      }
    }

    setUploading(true)
    setUploadStep('uploading')
    setUploadProgress(0)
    setStatus('Processing video...')

    try {
      let finalManifestUrl: string
      let videoId: string

      if (uploadType === 'file') {
        // Step 1: Convert to HLS
        setUploadStep('converting')
        setStatus('Converting to HLS...')
        const result = await convertToHLS(file!)
        finalManifestUrl = result.manifestUrl
        videoId = result.videoId
      } else {
        // External URL handling
        setStatus('Processing external URL...')
        setUploadProgress(50)
        
        videoId = crypto.randomUUID()
        
        // Convert URL based on type
        if (urlType === 'dropbox') {
          finalManifestUrl = convertDropboxUrl(externalUrl)
        } else if (urlType === 'youtube') {
          finalManifestUrl = convertYouTubeUrl(externalUrl)
        } else {
          // Direct URL - use as-is
          finalManifestUrl = externalUrl
        }
        
        setUploadProgress(75)
      }
      
      // Step 2: Upload cover image if provided
      let coverImagePath: string | null = null
      if (coverFile) {
        console.log('📸 Uploading cover image:', coverFile.name, 'Size:', coverFile.size, 'Type:', coverFile.type)
        setStatus('Uploading cover image...')
        
        // Try both buckets - videos and covionfilms
        const bucketsToTry = ['covionfilms', 'videos']
        let uploadSuccess = false
        
        for (const bucketName of bucketsToTry) {
          if (uploadSuccess) break
          
          try {
            const coverFileExt = coverFile.name.split('.').pop()
            const coverFileName = `${videoId}_cover.${coverFileExt}`
            const coverPath = `covers/${coverFileName}`
            
            console.log(`📸 Trying bucket "${bucketName}" with path:`, coverPath)
            
            const { data: uploadData, error: coverError } = await supabase.storage
              .from(bucketName)
              .upload(coverPath, coverFile, {
                contentType: coverFile.type,
                upsert: true
              })
            
            if (coverError) {
              console.error(`❌ Failed to upload to "${bucketName}":`, coverError)
              console.error('Cover upload error details:', JSON.stringify(coverError, null, 2))
              continue // Try next bucket
            } else {
              console.log(`✅ Cover image uploaded successfully to "${bucketName}":`, uploadData)
              // Get public URL
              const { data: coverUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(coverPath)
              
              coverImagePath = coverUrlData?.publicUrl || null
              console.log('✅ Cover image public URL:', coverImagePath)
              
              if (!coverImagePath) {
                console.error('❌ Failed to get public URL for cover image')
                continue // Try next bucket
              }
              
              uploadSuccess = true
              break
            }
          } catch (coverErr) {
            console.error(`❌ Error uploading to "${bucketName}" (catch):`, coverErr)
            continue // Try next bucket
          }
        }
        
        if (!uploadSuccess) {
          console.error('❌ Failed to upload cover image to all buckets')
          toast({
            title: "Cover Image Upload Failed",
            description: "Could not upload cover image. Please check your storage bucket permissions.",
            variant: "destructive"
          })
        }
      } else {
        console.log('ℹ️ No cover file provided for upload')
      }
      
      console.log('📸 Final coverImagePath to save:', coverImagePath)
      
      // Step 3: Save to database
      setUploadStep('uploading')
      setStatus('Saving video metadata...')
      setUploadProgress(uploadType === 'file' ? 90 : 95)
      
      const insertData = {
        title,
        description,
        manifest_url: finalManifestUrl,
        file_size: uploadType === 'file' ? file!.size : null,
        duration: videoInfo?.duration || 0,
        resolution: videoInfo?.resolution || 'Unknown',
        user_id: user?.id,
        status: 'ready',
        dashboard_section: dashboardSection,
        genre: genre,
        content_type: contentType,
        is_public: true,
        cover_image_path: coverImagePath
      }
      
      console.log('💾 Saving to database with data:', {
        ...insertData,
        cover_image_path: coverImagePath
      })
      
      const { data: insertResult, error: dbError } = await supabase
        .from('video_assets')
        .insert(insertData)
        .select()
      
      console.log('💾 Insert result:', insertResult)

      if (dbError) {
        console.error('❌ Database error:', dbError)
        throw new Error(`Failed to save video metadata: ${dbError.message}`)
      }

      // Success!
      setUploadStep('complete')
      setManifestUrl(finalManifestUrl)
      setStatus(uploadType === 'file' 
        ? 'Upload complete! Video is ready for streaming.'
        : 'External URL saved! Video is ready for streaming.')
      
      toast({
        title: "Video Saved! 🎉",
        description: uploadType === 'file'
          ? "Your video has been converted to HLS and is ready for streaming."
          : "External video URL has been saved and is ready for streaming.",
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

    } catch (error: any) {
      console.error('❌ Upload failed:', error)
      
      let errorMessage = "Upload failed. Please try again."
      if (error.message?.includes('ffmpeg')) {
        errorMessage = "Video conversion failed. Please check your file format."
      } else if (error.message?.includes('storage')) {
        errorMessage = "Storage upload failed. Please check your connection."
      } else if (error.message?.includes('database')) {
        errorMessage = "Failed to save video metadata. Please try again."
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      setUploading(false)
      setUploadStep('form')
      setUploadProgress(0)
      setStatus('')
      
    } finally {
      setUploading(false)
    }
  }

  if (!user || !['creator', 'admin', 'management'].includes(user.role)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need creator permissions to upload content.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
            Upload Video Content
          </CardTitle>
          <CardDescription className="text-center">
            Upload your video and we'll convert it to HLS for smooth streaming
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Type Selection */}
            <div className="space-y-2">
              <Label>Upload Type</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={uploadType === 'file' ? 'default' : 'outline'}
                  onClick={() => {
                    setUploadType('file')
                    setFile(null)
                    setExternalUrl('')
                  }}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
                <Button
                  type="button"
                  variant={uploadType === 'url' ? 'default' : 'outline'}
                  onClick={() => {
                    setUploadType('url')
                    setFile(null)
                    setExternalUrl('')
                  }}
                  disabled={uploading}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  External URL
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {uploadType === 'file' 
                  ? 'Upload and convert video file to HLS format'
                  : 'Use external video links from Dropbox, YouTube, or direct URLs'}
              </p>
            </div>

            {uploadType === 'file' ? (
              /* Video File Upload */
              <div className="space-y-2">
                <Label htmlFor="video">Video File *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="video"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="video" className="cursor-pointer">
                    {file ? (
                      <div className="space-y-2">
                        <Video className="mx-auto h-12 w-12 text-primary" />
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        {videoInfo && (
                          <div className="text-xs text-gray-400 space-y-1">
                            <p>Duration: {videoInfo.duration}s</p>
                            <p>Resolution: {videoInfo.resolution}</p>
                            <p>Quality: {videoInfo.quality}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Video className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="font-medium">Click to upload video</p>
                        <p className="text-sm text-gray-500">
                          MP4, MOV, AVI up to {getFileSizeInfo().displayLimit}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            ) : (
              /* External URL Input */
              <div className="space-y-2">
                <Label htmlFor="urlType">URL Source</Label>
                <Select 
                  value={urlType} 
                  onValueChange={(value: 'dropbox' | 'youtube' | 'direct') => setUrlType(value)}
                  disabled={uploading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dropbox">Dropbox</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="direct">Direct URL</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label htmlFor="externalUrl">Video URL *</Label>
                  <Input
                    id="externalUrl"
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder={
                      urlType === 'dropbox' 
                        ? 'https://www.dropbox.com/s/xxxxx/video.mp4?dl=0'
                        : urlType === 'youtube'
                        ? 'https://www.youtube.com/watch?v=VIDEO_ID'
                        : 'https://example.com/video.mp4'
                    }
                    disabled={uploading}
                    required={uploadType === 'url'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {urlType === 'dropbox' && 'Paste your Dropbox share link. It will be converted to a direct download URL.'}
                    {urlType === 'youtube' && 'Paste your YouTube video URL. It will be converted to an embed URL.'}
                    {urlType === 'direct' && 'Paste a direct video URL (MP4, M3U8, etc.)'}
                  </p>
                </div>
              </div>
            )}

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image (Optional)</Label>
              <div className="flex items-center space-x-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors flex-1">
                  <input
                    type="file"
                    id="cover"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="cover" className="cursor-pointer">
                    {coverPreview ? (
                      <div className="space-y-2">
                        <Image
                          src={coverPreview}
                          alt="Cover preview"
                          width={80}
                          height={80}
                          className="mx-auto rounded object-cover"
                        />
                        <p className="text-sm text-gray-500">Cover image</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Click to upload cover image</p>
                      </div>
                    )}
                  </label>
                </div>
                {coverFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCoverFile(null)
                      setCoverPreview(null)
                    }}
                    className="shrink-0"
                    disabled={uploading}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={uploading}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description"
                rows={3}
                disabled={uploading}
                required
              />
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type *</Label>
              <Select value={contentType} onValueChange={setContentType} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
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

            {/* Genre */}
            <div className="space-y-2">
              <Label htmlFor="genre">Genre *</Label>
              <Select value={genre} onValueChange={setGenre} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
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

            {/* Dashboard Section - Admin only */}
            {(user?.role === 'admin' || user?.role === 'management') && (
              <div className="space-y-2">
                <Label htmlFor="dashboardSection">Dashboard Section</Label>
                <Select 
                  value={dashboardSection} 
                  onValueChange={setDashboardSection} 
                  disabled={uploading}
                >
                  <SelectTrigger>
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
                <p className="text-xs text-muted-foreground">
                  Choose which section on the dashboard this video should appear in
                </p>
              </div>
            )}

            {/* Upload Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-[#8e2de2] text-white"
              disabled={
                uploading || 
                !title || 
                !description || 
                !contentType || 
                !genre ||
                (uploadType === 'file' && !file) ||
                (uploadType === 'url' && !externalUrl)
              }
            >
              {uploading 
                ? "Processing..." 
                : uploadType === 'file'
                  ? "Upload & Convert to HLS"
                  : "Save External Video URL"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Upload Progress Modal */}
      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">
                {uploadStep === 'converting' ? 'Converting to HLS...' : 
                 uploadStep === 'uploading' ? 'Uploading Segments...' : 'Complete!'}
              </h3>
              
              {uploadStep === 'converting' && (
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{uploadProgress}% Complete</p>
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    🎬 Converting your video to HLS segments for smooth streaming...
                  </p>
                </div>
              )}
              
              {uploadStep === 'uploading' && (
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{uploadProgress}% Complete</p>
                  <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    📤 Uploading HLS segments to storage...
                  </p>
                </div>
              )}
              
              {uploadStep === 'complete' && (
                <div className="text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>HLS conversion complete! Video is ready for streaming.</p>
                  {manifestUrl && (
                    <div className="mt-4">
                      <Button
                        onClick={() => window.open(manifestUrl, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Test Stream
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

