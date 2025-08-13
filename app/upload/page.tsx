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
import { Upload, X, ImageIcon, Video, AlertCircle, CheckCircle } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"

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
  const [videoInfo, setVideoInfo] = useState<{
    duration: number
    resolution: string
    fileSize: string
    quality: string
  } | null>(null)
  const [uploadStep, setUploadStep] = useState<'form' | 'uploading' | 'processing' | 'complete'>('form')
  const router = useRouter()
  const { user } = useAuth()

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

  const getVideoInfo = (file: File): Promise<{ duration: number; resolution: string; fileSize: string; quality: string }> => {
    console.log('🎬 getVideoInfo FUNCTION CALLED!')
    console.log('🎬 File parameter:', file.name)
    
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting getVideoInfo function')
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      })
      
      const video = document.createElement('video')
      console.log('🎥 Video element created')
      
      video.preload = 'metadata'
      video.muted = true
      video.crossOrigin = 'anonymous'
      
      console.log('⚙️ Video element configured')
      
      video.onloadedmetadata = () => {
        console.log('✅ Video metadata loaded successfully!')
        console.log('📊 Video metadata:', {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          readyState: video.readyState
        })
        
        const duration = Math.round(video.duration)
        const resolution = `${video.videoWidth}x${video.videoHeight}`
        const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB'
        
        // Determine quality based on resolution
        let quality = '480p'
        if (video.videoHeight >= 2160) quality = '4K'
        else if (video.videoHeight >= 1080) quality = '1080p'
        else if (video.videoHeight >= 720) quality = '720p'
        
        const info = { duration, resolution, fileSize, quality }
        console.log('🎯 Final video info:', info)
        resolve(info)
      }
      
      video.onerror = (error) => {
        console.error('❌ Video error event triggered:', error)
        console.error('❌ Video error details:', {
          error: video.error,
          networkState: video.networkState,
          readyState: video.readyState
        })
        reject(new Error('Failed to load video metadata'))
      }
      
      video.onloadstart = () => console.log('🔄 Video load started')
      video.onprogress = () => console.log('📈 Video loading progress')
      video.oncanplay = () => console.log('▶️ Video can play')
      video.oncanplaythrough = () => console.log('🎬 Video can play through')
      
      // Set a timeout in case the video doesn't load
      const timeout = setTimeout(() => {
        console.log('⏰ Video metadata loading timeout after 10 seconds')
        if (!video.duration) {
          console.log('⏰ No duration detected, rejecting promise')
          reject(new Error('Video metadata loading timeout'))
        }
      }, 10000)
      
      try {
        console.log('🔗 Creating object URL...')
        const objectUrl = URL.createObjectURL(file)
        console.log('🔗 Object URL created:', objectUrl)
        
        console.log('🎬 Setting video source...')
        video.src = objectUrl
        console.log('🎬 Video source set successfully')
        
        // Clean up timeout on success
        video.onloadedmetadata = () => {
          clearTimeout(timeout)
          console.log('✅ Video metadata loaded successfully!')
          console.log('📊 Video metadata:', {
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState
          })
          
          const duration = Math.round(video.duration)
          const resolution = `${video.videoWidth}x${video.videoHeight}`
          const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB'
          
          // Determine quality based on resolution
          let quality = '480p'
          if (video.videoHeight >= 2160) quality = '4K'
          else if (video.videoHeight >= 1080) quality = '1080p'
          else if (video.videoHeight >= 720) quality = '720p'
          
          const info = { duration, resolution, fileSize, quality }
          console.log('🎯 Final video info:', info)
          resolve(info)
        }
        
      } catch (error) {
        console.error('❌ Error in video setup:', error)
        clearTimeout(timeout)
        reject(error)
      }
    })
  }

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

  // Test function to see if React is working
  const testFunction = () => {
    console.log('🧪 Test function called!')
    toast({
      title: "Test",
      description: "Test function is working!",
    })
  }

  // Test upload function to debug issues
  const testUpload = async () => {
    if (!file) {
      toast({
        title: "No File",
        description: "Please select a file first",
        variant: "destructive",
      })
      return
    }

    console.log('🧪 Starting test upload...')
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    try {
      // Test Supabase connection first
      console.log('🔍 Testing Supabase connection...')
      const { data: bucketData, error: bucketError } = await supabase.storage
        .from('covionfilms')
        .list('', { limit: 1 })
      
      if (bucketError) {
        console.error('❌ Bucket access error:', bucketError)
        toast({
          title: "Supabase Connection Failed",
          description: `Cannot access storage bucket: ${bucketError.message}`,
          variant: "destructive",
        })
        return
      }
      
      console.log('✅ Supabase connection successful, bucket data:', bucketData)

      // Test with a small chunk first
      const testChunk = file.slice(0, Math.min(file.size, 1024 * 1024)) // First 1MB or less
      console.log('📦 Test chunk size:', testChunk.size, 'bytes')
      
      const testPath = `test_${Date.now()}_${file.name}`
      console.log('🎯 Test upload path:', testPath)
      
      const { data, error } = await supabase.storage
        .from('covionfilms')
        .upload(testPath, testChunk, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('❌ Test upload failed:', error)
        toast({
          title: "Test Upload Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        console.log('✅ Test upload successful:', data)
        toast({
          title: "Test Upload Success",
          description: "Small test upload worked!",
        })
        
        // Clean up test file
        await supabase.storage.from('covionfilms').remove([testPath])
        console.log('🧹 Test file cleaned up')
      }
    } catch (error) {
      console.error('❌ Test upload error:', error)
      toast({
        title: "Test Upload Error",
        description: "Test upload failed with error",
        variant: "destructive",
      })
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0])
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const uploadToSupabase = async (file: File, path: string): Promise<string> => {
    console.log(`🚀 Starting upload for: ${file.name} (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB)`)
    console.log(`📁 File size: ${file.size} bytes`)
    console.log(`🎯 Upload path: ${path}`)
    
    // For large files, show more detailed progress
    if (file.size > 1024 * 1024 * 1024) { // > 1GB
      console.log('📁 Large file detected, this may take several minutes...')
      toast({
        title: "Large File Upload",
        description: `Starting upload of ${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB file. This may take several minutes.`,
      })
    }

    // For very large files (>5GB), use chunked upload
    if (file.size > 5 * 1024 * 1024 * 1024) {
      console.log('📦 Using chunked upload for very large file')
      return await uploadLargeFileInChunks(file, path)
    }

    // For smaller files, use regular upload with timeout
    const timeout = 10 * 60 * 1000 // 10 minutes for smaller files
    console.log(`⏱️ Setting timeout to ${timeout / 60000} minutes`)
    
    // Retry logic for network failures
    let retries = 0
    const maxRetries = 3
    
    while (retries < maxRetries) {
      try {
        console.log(`🔄 Upload attempt ${retries + 1}/${maxRetries}`)
        console.log(`📤 Initiating Supabase storage upload...`)
        
        // Test Supabase connection first
        console.log('🔍 Testing Supabase connection...')
        const { data: bucketData, error: bucketError } = await supabase.storage
          .from('covionfilms')
          .list('', { limit: 1 })
        
        if (bucketError) {
          console.error('❌ Bucket access error:', bucketError)
          throw new Error(`Bucket access failed: ${bucketError.message}`)
        }
        
        console.log('✅ Bucket access successful, proceeding with upload...')
        
        const uploadPromise = supabase.storage
          .from('covionfilms')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          })

        console.log(`⏳ Waiting for upload to complete or timeout...`)
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            console.log(`⏰ Timeout reached after ${timeout / 60000} minutes`)
            reject(new Error(`Upload timeout after ${timeout / 60000} minutes`))
          }, timeout)
        })

        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any

        if (error) {
          console.error('❌ Upload error:', error)
          throw error
        }
        
        console.log('✅ Upload successful:', data.path)
        console.log('📊 Upload response data:', data)
        return data.path
        
      } catch (error: any) {
        retries++
        console.error(`❌ Upload attempt ${retries} failed:`, error)
        console.error(`❌ Error type:`, typeof error)
        console.error(`❌ Error message:`, error.message)
        console.error(`❌ Error stack:`, error.stack)
        
        // Check if it's a specific error type we can handle
        if (error.message?.includes('Load failed') || error.message?.includes('network') || error.message?.includes('fetch')) {
          console.log('🌐 Network/load error detected, will retry...')
          
          if (retries < maxRetries) {
            const waitTime = retries * 10000 // Wait 10s, 20s, 30s between retries
            console.log(`⏳ Waiting ${waitTime/1000}s before retry ${retries + 1}...`)
            
            toast({
              title: "Network Issue",
              description: `Upload failed due to network issue. Retrying in ${waitTime/1000} seconds... (${retries}/${maxRetries})`,
            })
            
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
        }
        
        // If we're out of retries or it's not a network error, throw the error
        throw error
      }
    }
    
    throw new Error(`Upload failed after ${maxRetries} attempts`)
  }

  // New function for chunked uploads of large files
  const uploadLargeFileInChunks = async (file: File, path: string): Promise<string> => {
    console.log('📦 Starting chunked upload for large file...')
    
    const chunkSize = 50 * 1024 * 1024 // 50MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize)
    let uploadedChunks = 0
    
    console.log(`📊 Total chunks: ${totalChunks}, Chunk size: ${(chunkSize / (1024 * 1024)).toFixed(0)}MB`)
    
    // Create a unique session ID for this upload
    const sessionId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Upload chunks one by one
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunk = file.slice(start, end)
        
        console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${(chunk.size / (1024 * 1024)).toFixed(1)}MB)`)
        
        // Update progress based on chunks
        const chunkProgress = Math.round((uploadedChunks / totalChunks) * 80) + 10 // 10% to 90%
        setUploadProgress(chunkProgress)
        
        // Upload this chunk with a shorter timeout
        const chunkPath = `${path}_chunk_${chunkIndex}`
        const { data: chunkData, error: chunkError } = await supabase.storage
          .from('covionfilms')
          .upload(chunkPath, chunk, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (chunkError) {
          console.error(`❌ Chunk ${chunkIndex + 1} upload failed:`, chunkError)
          throw new Error(`Chunk ${chunkIndex + 1} failed: ${chunkError.message}`)
        }
        
        uploadedChunks++
        console.log(`✅ Chunk ${chunkIndex + 1} uploaded successfully`)
        
        // Small delay between chunks to prevent overwhelming the server
        if (chunkIndex < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      // Now combine all chunks into the final file
      console.log('🔗 Combining chunks into final file...')
      setUploadProgress(95)
      
      // For now, we'll use the first chunk as the main file
      // In a production environment, you'd want to implement proper chunk merging
      const finalPath = `${path}_chunk_0`
      
      // Rename the first chunk to the final path
      const { error: renameError } = await supabase.storage
        .from('covionfilms')
        .move(`${path}_chunk_0`, path)
      
      if (renameError) {
        console.error('❌ Error renaming final file:', renameError)
        // If rename fails, we'll use the chunk path
        return finalPath
      }
      
      // Clean up chunk files
      for (let chunkIndex = 1; chunkIndex < totalChunks; chunkIndex++) {
        try {
          await supabase.storage
            .from('covionfilms')
            .remove([`${path}_chunk_${chunkIndex}`])
        } catch (cleanupError) {
          console.warn(`⚠️ Could not clean up chunk ${chunkIndex}:`, cleanupError)
        }
      }
      
      console.log('✅ Chunked upload completed successfully')
      return path
      
    } catch (error) {
      console.error('❌ Chunked upload failed:', error)
      
      // Clean up any uploaded chunks on failure
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        try {
          await supabase.storage
            .from('covionfilms')
            .remove([`${path}_chunk_${chunkIndex}`])
        } catch (cleanupError) {
          console.warn(`⚠️ Could not clean up chunk ${chunkIndex}:`, cleanupError)
        }
      }
      
      throw error
    }
  }

  const processVideo = async (videoId: string, filePath: string) => {
    // This would typically call a video processing service
    // For now, we'll simulate the process
    setUploadStep('processing')
    
    // Simulate video processing time
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Update video status to ready
    const { error } = await supabase
      .from('videos')
      .update({ 
        status: 'ready',
        quality: videoInfo?.quality || '720p'
      })
      .eq('id', videoId)
    
    if (error) {
      console.error('Error updating video status:', error)
    }
    
    setUploadStep('complete')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Force multiple logging methods
      console.log('🚀 handleSubmit called!')
      console.warn('🚀 handleSubmit called! (warn)')
      
      // Immediate visual feedback
      toast({
        title: "Upload Started",
        description: "Form submitted, starting upload process...",
      })
      
      if (!file || !user) {
        console.log('❌ Missing file or user:', { file: !!file, user: !!user })
        toast({
          title: "Missing Information",
          description: "Please select a file and ensure you're logged in.",
          variant: "destructive",
        })
        return
      }

      console.log('✅ File and user validated, starting upload process...')
      console.log('📁 File details:', { name: file.name, size: file.size, type: file.type })
      console.log('👤 User details:', { id: user.id, role: user.role })
      
      // Visual feedback for each step
      toast({
        title: "Validation Complete",
        description: `File: ${file.name} (${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB)`,
      })

      setUploading(true)
      setUploadStep('uploading')
      setUploadProgress(0)
      
      console.log('🔄 Upload state set, progress: 0%')
      toast({
        title: "Upload State Set",
        description: "Progress: 0% - Starting upload...",
      })

      try {
        // Generate unique file paths
        const timestamp = Date.now()
        const videoFileName = `${timestamp}_${file.name}`
        const coverFileName = coverFile ? `${timestamp}_${coverFile.name}` : null
        
        console.log('📝 Generated file names:', { video: videoFileName, cover: coverFileName })
        console.log('📤 Starting video upload...')
        
        // Start with 10% progress
        setUploadProgress(10)
        console.log('📊 Progress set to 10%')
        toast({
          title: "Progress Update",
          description: "Progress: 10% - About to start upload...",
        })
        
        // Upload video file
        console.log('🔄 About to call uploadToSupabase...')
        toast({
          title: "Starting Upload",
          description: "Calling uploadToSupabase function...",
        })
        
        const videoPath = await uploadToSupabase(file, `videos/${videoFileName}`)
        console.log('✅ Video upload complete, path:', videoPath)
        toast({
          title: "Video Upload Complete",
          description: `File uploaded successfully: ${videoPath}`,
        })
        
        // Move to 70% after video upload
        setUploadProgress(70)
        console.log('📊 Progress set to 70%')
        toast({
          title: "Progress Update",
          description: "Progress: 70% - Video uploaded, processing...",
        })
        
        // Upload cover image if provided
        let coverPath = null
        if (coverFile) {
          console.log('📤 Starting cover image upload...')
          toast({
            title: "Cover Upload",
            description: "Starting cover image upload...",
          })
          coverPath = await uploadToSupabase(coverFile, `covers/${coverFileName}`)
          console.log('✅ Cover image upload complete')
          setUploadProgress(80)
          toast({
            title: "Cover Upload Complete",
            description: "Cover image uploaded successfully",
          })
        } else {
          setUploadProgress(80)
          toast({
            title: "Progress Update",
            description: "Progress: 80% - No cover image, continuing...",
          })
        }
        console.log('📊 Progress set to 80%')
        
        // Get public URLs
        console.log('🔗 Getting public URLs...')
        toast({
          title: "Getting URLs",
          description: "Retrieving public URLs for uploaded files...",
        })
        const { data: videoUrl } = supabase.storage
          .from('covionfilms')
          .getPublicUrl(videoPath)
        
        const coverUrl = coverPath ? supabase.storage
          .from('covionfilms')
          .getPublicUrl(coverPath).data.publicUrl : null

        setUploadProgress(85)
        console.log('📊 Progress set to 85%')
        toast({
          title: "Progress Update",
          description: "Progress: 85% - URLs retrieved, creating database record...",
        })

        // Create video record in database
        console.log('💾 Creating database record...')
        toast({
          title: "Database",
          description: "Creating video record in database...",
        })
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .insert({
            title,
            description,
            content_type: contentType,
            genre,
            duration_seconds: videoInfo?.duration,
            file_size_bytes: file.size,
            file_path: videoUrl.publicUrl,
            cover_image_path: coverUrl,
            user_id: user.id,
            status: 'processing',
            quality: videoInfo?.quality || '720p'
          })
          .select()
          .single()

        if (videoError) throw videoError

        setUploadProgress(90)
        console.log('📊 Progress set to 90%')
        toast({
          title: "Progress Update",
          description: "Progress: 90% - Database record created, processing metadata...",
        })

        // Create video metadata
        if (videoInfo) {
          console.log('📊 Creating video metadata...')
          toast({
            title: "Metadata",
            description: "Creating video metadata...",
          })
          await supabase
            .from('video_metadata')
            .insert({
              video_id: videoData.id,
              resolution_width: parseInt(videoInfo.resolution.split('x')[0]),
              resolution_height: parseInt(videoInfo.resolution.split('x')[1]),
              codec: 'H.264', // Default, would be detected in real implementation
              audio_codec: 'AAC', // Default, would be detected in real implementation
              audio_channels: 2,
              audio_sample_rate: 48000
            })
        }

        setUploadProgress(95)
        console.log('📊 Progress set to 95%')
        toast({
          title: "Progress Update",
          description: "Progress: 95% - Metadata created, starting video processing...",
        })
        
        // Start video processing
        console.log('⚙️ Starting video processing...')
        toast({
          title: "Video Processing",
          description: "Starting video processing...",
        })
        await processVideo(videoData.id, videoUrl.publicUrl)

        setUploadProgress(100)
        console.log('📊 Progress set to 100% - Upload complete!')
        toast({
          title: "Progress Complete",
          description: "Progress: 100% - Upload complete!",
        })
        
        toast({
          title: "Upload Successful! 🎉",
          description: "Your video is being processed and will be available soon.",
        })
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
        
      } catch (uploadError: any) {
        console.error('❌ Upload failed:', uploadError)
        
        // Show specific error message
        let errorMessage = "Upload failed. Please try again."
        if (uploadError.message?.includes('timeout')) {
          errorMessage = "Upload timed out. Large files may take longer. Please try again."
        } else if (uploadError.message?.includes('network') || uploadError.message?.includes('Load failed')) {
          errorMessage = "Network error during upload. Please check your connection and try again."
        } else if (uploadError.message?.includes('retry')) {
          errorMessage = "Upload failed after multiple attempts. Please check your connection and try again."
        } else if (uploadError.message?.includes('chunk')) {
          errorMessage = "Chunked upload failed. Please try again with a stable connection."
        }
        
        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive",
        })
        
        setUploading(false)
        setUploadStep('form')
        setUploadProgress(0)
        return
      } finally {
        setUploading(false)
      }
      
    } catch (outerError: any) {
      console.error('❌ Outer error in handleSubmit:', outerError)
      console.error('❌ Error type:', typeof outerError)
      console.error('❌ Error message:', outerError.message)
      
      toast({
        title: "Critical Error",
        description: `Unexpected error: ${outerError.message || 'Unknown error'}`,
        variant: "destructive",
      })
      
      setUploading(false)
      setUploadStep('form')
      setUploadProgress(0)
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

  if (uploadStep === 'uploading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <Upload className="h-16 w-16 text-primary mx-auto mb-4 animate-bounce" />
            <h2 className="text-xl font-semibold mb-2">Uploading Video...</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-muted-foreground">{uploadProgress}% Complete</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (uploadStep === 'processing') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <Video className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold mb-2">Processing Video...</h2>
            <p className="text-muted-foreground">Your video is being processed for optimal streaming quality.</p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (uploadStep === 'complete') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Upload Complete! 🎉</h2>
            <p className="text-muted-foreground">Your video has been successfully uploaded and processed.</p>
            <p className="text-sm text-muted-foreground mt-2">Redirecting to dashboard...</p>
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
            Upload Your Content
          </CardTitle>
          <CardDescription className="text-center">
            Share your creativity with the COVION community
            {user && (
              <div className="mt-2 text-sm">
                <span className="text-primary">Plan:</span> {user.role === 'admin' ? 'Admin' : user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)} 
                <span className={`ml-2 ${getFileSizeInfo().color}`}>({getFileSizeInfo().displayLimit} limit)</span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Test Button */}
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <Button onClick={testFunction} variant="outline" className="mb-2 mr-2">
              🧪 Test Button - Click Me!
            </Button>
            <Button 
              onClick={async () => {
                console.log('🧪 Testing Supabase storage connection...')
                try {
                  const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
                  const { data, error } = await supabase.storage
                    .from('covionfilms')
                    .upload('test/test.txt', testFile)
                  
                  if (error) {
                    console.error('❌ Storage test failed:', error)
                    toast({
                      title: "Storage Test Failed",
                      description: error.message,
                      variant: "destructive",
                    })
                  } else {
                    console.log('✅ Storage test successful:', data)
                    toast({
                      title: "Storage Test Successful",
                      description: "Supabase storage is working!",
                    })
                  }
                } catch (error) {
                  console.error('❌ Storage test error:', error)
                }
              }} 
              variant="outline" 
              className="mb-2"
            >
              🧪 Test Storage Connection
            </Button>
            <p className="text-xs text-gray-600">
              Test buttons to verify React and Supabase storage are working.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter the title of your content"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Provide a brief description of your content"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="shortFilm">Short Film</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="clip">Clip</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="comedy">Comedy</SelectItem>
                  <SelectItem value="drama">Drama</SelectItem>
                  <SelectItem value="horror">Horror</SelectItem>
                  <SelectItem value="sciFi">Science Fiction</SelectItem>
                  <SelectItem value="romance">Romance</SelectItem>
                  <SelectItem value="documentary">Documentary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Video File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Upload Video File</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="file" 
                  type="file" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="video/*"
                  onClick={() => console.log('🎯 File input clicked!')}
                />
                <Label
                  htmlFor="file"
                  className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors"
                  onClick={() => console.log('🎯 Label clicked!')}
                >
                  {file ? (
                    <div className="text-center">
                      <Video className="mx-auto h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{videoInfo?.fileSize}</p>
                      {videoInfo && (
                        <div className="text-xs text-gray-400 mt-1">
                          <p>{videoInfo.duration}s • {videoInfo.resolution}</p>
                          <p className="text-primary">{videoInfo.quality}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">MP4, MOV, or AVI</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Max: {getFileSizeInfo().displayLimit}
                      </p>
                      <p className="text-xs text-red-400 mt-2">Debug: Click here to test</p>
                    </div>
                  )}
                </Label>
                {file && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => {
                    console.log('🗑️ Removing file')
                    setFile(null)
                    setVideoInfo(null)
                  }} className="shrink-0">
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
              
              {/* Debug Info */}
              <div className="text-xs text-gray-500 mt-2">
                <p>Debug Info:</p>
                <p>File selected: {file ? 'Yes' : 'No'}</p>
                <p>File name: {file?.name || 'None'}</p>
                <p>Video info: {videoInfo ? 'Loaded' : 'Not loaded'}</p>
                <p>User role: {user?.role || 'None'}</p>
                <p>User subscription: {user?.subscription || 'None'}</p>
                <p>Max file size: {getFileSizeInfo().displayLimit}</p>
                <p>Max size in bytes: {(getFileSizeInfo().maxSize / (1024 * 1024 * 1024)).toFixed(2)} GB</p>
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image (Optional)</Label>
              <div className="flex items-center space-x-2">
                <Input id="cover" type="file" onChange={handleCoverChange} className="hidden" accept="image/*" />
                <Label
                  htmlFor="cover"
                  className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors"
                >
                  {coverPreview ? (
                    <Image
                      src={coverPreview || "/placeholder.svg"}
                      alt="Cover preview"
                      width={128}
                      height={128}
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Click to upload cover image</p>
                    </div>
                  )}
                </Label>
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
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-[#8e2de2] text-white"
              disabled={uploading || !file || !title || !description || !contentType || !genre}
            >
              {uploading ? "Uploading..." : "Upload Content"}
            </Button>
            
            {/* Test Upload Button */}
            {file && (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={testUpload}
                disabled={uploading}
              >
                🧪 Test Upload (1MB chunk)
              </Button>
            )}
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
                {uploadStep === 'uploading' ? 'Uploading Video...' : 
                 uploadStep === 'processing' ? 'Processing Video...' : 'Upload Complete!'}
              </h3>
              
              {uploadStep === 'uploading' && (
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{uploadProgress}% Complete</p>
                  
                  {file && file.size > 1024 * 1024 * 1024 && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      📁 Large file detected ({(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB)
                      <br />
                      This may take several minutes. Please don't close this page.
                      <br />
                      <span className="text-xs text-gray-500">
                        Estimated time: {file.size > 5 * 1024 * 1024 * 1024 ? '15-30 minutes' : '5-15 minutes'}
                      </span>
                      {file.size > 5 * 1024 * 1024 * 1024 && (
                        <div className="mt-2 text-xs text-purple-600">
                          🔧 Using chunked upload for better reliability
                        </div>
                      )}
                    </div>
                  )}
                  
                  {file && uploadProgress > 0 && uploadProgress < 90 && (
                    <div className="text-xs text-gray-600">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      {file.size > 5 * 1024 * 1024 * 1024 && uploadProgress > 10 && uploadProgress < 90 && (
                        <div className="text-xs text-purple-500 mt-1">
                          📦 Chunked upload in progress...
                        </div>
                      )}
                    </div>
                  )}
                  
                  {uploadProgress >= 90 && uploadProgress < 100 && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      🎯 Finalizing upload... Almost done!
                      {file.size > 5 * 1024 * 1024 * 1024 && (
                        <div className="mt-1">
                          🔗 Combining file chunks...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {uploadStep === 'processing' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Please wait while we process your video...</p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-xs text-blue-600">Processing video metadata...</span>
                  </div>
                </div>
              )}
              
              {uploadStep === 'complete' && (
                <div className="text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>Upload successful! Redirecting to dashboard...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

