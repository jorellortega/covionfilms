"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Settings, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

interface DashboardSection {
  id: string
  section_name: string
  is_visible: boolean
  display_order: number
}

const SECTION_LABELS: { [key: string]: string } = {
  movie_trailers: 'Movie Trailers',
  top_movies: 'Top 10 Movies',
  ai_content: 'AI Content',
  trending_reels: 'Trending Reels',
  new_releases: 'New Releases',
  top_creators: 'Top 10 Creators',
  featured_movies: 'Featured Movies',
  coming_soon: 'Coming Soon',
  unseen_movies: 'Unseen Movies',
  search_bar: 'Search Bar',
  vee_reels: 'Vee/Reels Button',
  clips: 'Clips Button',
  music: 'Music Button'
}

export default function DashboardControlPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [sections, setSections] = useState<DashboardSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    if (user?.role === 'admin') {
      fetchSections()
    }
  }, [user, router])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('dashboard_section_visibility')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error

      setSections(data || [])
    } catch (error: any) {
      console.error('Error fetching sections:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard sections.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = async (sectionId: string, currentVisibility: boolean) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('dashboard_section_visibility')
        .update({ is_visible: !currentVisibility })
        .eq('id', sectionId)

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          toast({
            title: "Migration Required",
            description: "Please run migration 011_dashboard_section_visibility.sql first.",
            variant: "destructive"
          })
          return
        }
        throw error
      }

      // Update local state
      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, is_visible: !currentVisibility }
          : s
      ))

      toast({
        title: "Success",
        description: `Section ${!currentVisibility ? 'shown' : 'hidden'} successfully.`,
      })
    } catch (error: any) {
      console.error('Error updating section:', error)
      toast({
        title: "Error",
        description: "Failed to update section visibility.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleAll = async (visible: boolean) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('dashboard_section_visibility')
        .update({ is_visible: visible })

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          toast({
            title: "Migration Required",
            description: "Please run migration 011_dashboard_section_visibility.sql first.",
            variant: "destructive"
          })
          return
        }
        throw error
      }

      // Update local state
      setSections(sections.map(s => ({ ...s, is_visible: visible })))

      toast({
        title: "Success",
        description: `All sections ${visible ? 'shown' : 'hidden'} successfully.`,
      })
    } catch (error: any) {
      console.error('Error updating all sections:', error)
      toast({
        title: "Error",
        description: "Failed to update sections.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user?.role !== 'admin') {
    return null
  }

  const visibleCount = sections.filter(s => s.is_visible).length
  const hiddenCount = sections.filter(s => !s.is_visible).length

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Dashboard Section Control
              </CardTitle>
              <CardDescription>
                Control which sections appear on the dashboard
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAll(true)}
                disabled={saving || visibleCount === sections.length}
              >
                <Eye className="h-4 w-4 mr-2" />
                Show All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAll(false)}
                disabled={saving || hiddenCount === sections.length}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Hide All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{visibleCount}</strong> sections visible, <strong>{hiddenCount}</strong> sections hidden
            </p>
          </div>

          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${section.is_visible ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <Label htmlFor={`section-${section.id}`} className="text-base font-medium cursor-pointer">
                      {SECTION_LABELS[section.section_name] || section.section_name}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {section.section_name} • Order: {section.display_order}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`section-${section.id}`}
                  checked={section.is_visible}
                  onCheckedChange={() => toggleSection(section.id, section.is_visible)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>

          {sections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No dashboard sections found.</p>
              <p className="text-sm mt-2">Run the migration to create default sections.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

