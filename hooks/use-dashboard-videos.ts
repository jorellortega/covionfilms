import { useState, useEffect, useCallback } from 'react'
import { fetchDashboardVideos, type DashboardVideo } from '@/lib/dashboard-videos'

export type { DashboardVideo }

export function useDashboardVideos(section: string, limit = 10) {
  const [videos, setVideos] = useState<DashboardVideo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const results = await fetchDashboardVideos(section, limit)
      setVideos(results)
    } catch (error) {
      console.error(`Error fetching dashboard videos for ${section}:`, error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }, [section, limit])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  return { videos, loading, refresh: fetchVideos }
}
