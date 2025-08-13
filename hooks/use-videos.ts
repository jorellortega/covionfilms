import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Video {
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
  status: string
}

export interface VideoFilters {
  genre?: string
  content_type?: string
  quality?: string
  status?: string
  limit?: number
}

export function useVideos(filters: VideoFilters = {}) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [filters])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('videos')
        .select('*')
        .eq('status', 'ready')
        .eq('is_public', true)

      // Apply filters
      if (filters.genre) {
        query = query.eq('genre', filters.genre)
      }
      if (filters.content_type) {
        query = query.eq('content_type', filters.content_type)
      }
      if (filters.quality) {
        query = query.eq('quality', filters.quality)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false })

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setVideos(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching videos:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserVideos = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setVideos(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching user videos:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTopVideos = async (limit: number = 10) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'ready')
        .eq('is_public', true)
        .order('view_count', { ascending: false })
        .limit(limit)

      if (fetchError) {
        throw fetchError
      }

      setVideos(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching top videos:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchNewReleases = async (limit: number = 10) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'ready')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) {
        throw fetchError
      }

      setVideos(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching new releases:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchVideosByGenre = async (genre: string, limit: number = 10) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'ready')
        .eq('is_public', true)
        .eq('genre', genre)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) {
        throw fetchError
      }

      setVideos(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching videos by genre:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    videos,
    loading,
    error,
    fetchVideos,
    fetchUserVideos,
    fetchTopVideos,
    fetchNewReleases,
    fetchVideosByGenre,
    refetch: fetchVideos
  }
}
