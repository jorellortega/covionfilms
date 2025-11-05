import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface DashboardSectionVisibility {
  section_name: string
  is_visible: boolean
}

export function useDashboardVisibility() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVisibility()
  }, [])

  const fetchVisibility = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_section_visibility')
        .select('section_name, is_visible')

      if (error) {
        // If table doesn't exist (404/400), default to all visible
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Dashboard visibility table not found. Defaulting to all visible. Run migration 011_dashboard_section_visibility.sql')
          setVisibility({})
          setLoading(false)
          return
        }
        throw error
      }

      // Convert array to object for easy lookup
      const visibilityMap: Record<string, boolean> = {}
      data?.forEach((section: DashboardSectionVisibility) => {
        visibilityMap[section.section_name] = section.is_visible
      })

      setVisibility(visibilityMap)
      console.log('📊 Dashboard visibility loaded:', visibilityMap)
    } catch (error) {
      console.error('Error fetching dashboard visibility:', error)
      // Default to all visible if there's an error
      setVisibility({})
    } finally {
      setLoading(false)
    }
  }

  const isVisible = (sectionName: string): boolean => {
    // If not loaded yet, default to visible (to avoid flickering)
    if (loading) {
      return true
    }
    // If section not in database, default to visible
    // If explicitly set to false, return false
    const result = visibility[sectionName] !== false
    
    // Only log for new_releases to debug the issue
    if (sectionName === 'new_releases') {
      console.log(`👁️ Visibility check for "${sectionName}":`, {
        inMap: sectionName in visibility,
        value: visibility[sectionName],
        result,
        allVisibility: visibility
      })
    }
    
    return result
  }

  return { isVisible, loading, refresh: fetchVisibility }
}

