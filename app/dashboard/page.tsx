"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MovieTrailers } from "@/components/movie-trailers"
import { TopMovies } from "@/components/top-movies"
import { TopCreators } from "@/components/top-creators"
import { ReelsRow } from "@/components/reels-row"
import { NewReleases } from "@/components/new-releases"
import { UpcomingMovies } from "@/components/upcoming-movies"
import { UnseenMovies } from "@/components/unseen-movies"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AIContent } from "@/components/ai-content"
import { useRouter } from "next/navigation"
import { useDashboardVisibility } from "@/hooks/use-dashboard-visibility"

// UNDO: Set to true to restore the fixed bottom Vee / Clips / Music buttons on the dashboard.
const SHOW_BOTTOM_NAV_BUTTONS = false

// UNDO: Set to true to restore AI Content, Trending Reels, and Top Creators on the dashboard.
const SHOW_PLACEHOLDER_DASHBOARD_SECTIONS = false

export default function DashboardPage() {
  const [shuffleMode, setShuffleMode] = useState<"reels" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showWelcome, setShowWelcome] = useState(true)
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const { isVisible } = useDashboardVisibility()

  // Redirect to login if not authenticated (only after loading is complete)
  useEffect(() => {
    // Don't redirect during initial load or if still loading
    if (isLoading) {
      return
    }
    
    // Only redirect if we're certain there's no user after loading completes
    if (!user) {
      console.log('No user found, redirecting to login')
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (isLoading || !user) return
    const timer = setTimeout(() => setShowWelcome(false), 5000)
    return () => clearTimeout(timer)
  }, [isLoading, user?.id])

  const handleScreenClick = useCallback(() => {
    if (shuffleMode === "reels") {
      // Navigate to Vee mode
      window.location.href = "/reel-mode"
    }
  }, [shuffleMode])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-8 pb-24 gradient-bg min-h-screen" onClick={shuffleMode ? handleScreenClick : undefined}>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section with User Info */}
        <div className="text-center mb-8 relative min-h-[40px]">
          {/* Logout Button */}
          <div className="absolute top-0 right-0 z-10">
            <Button
              variant="outline"
              onClick={async () => {
                await logout()
                router.push("/login")
              }}
              className="text-sm border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Logout
            </Button>
          </div>
          
          <h1
            className={`text-3xl font-bold bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text transition-all duration-500 ${
              showWelcome ? "opacity-100 mb-4" : "opacity-0 mb-0 h-0 overflow-hidden pointer-events-none"
            }`}
            aria-hidden={!showWelcome}
          >
            Welcome back, {user.name}! 👋
          </h1>
        </div>

        {isVisible('movie_trailers') && (
          <MovieTrailers shuffleMode={shuffleMode === "reels"} />
        )}

        {isVisible('search_bar') && (
          <div className="w-full max-w-md mx-auto my-8">
            <Input
              type="search"
              placeholder="Search videos or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white border-white focus:border-white focus:ring-white placeholder-white/70"
            />
          </div>
        )}

        {isVisible('new_releases') && (
          <NewReleases />
        )}

        {isVisible('top_movies') && (
          <TopMovies shuffleMode={shuffleMode === "reels"} />
        )}

        {isVisible('coming_soon') && (
          <UpcomingMovies />
        )}

        {SHOW_PLACEHOLDER_DASHBOARD_SECTIONS && isVisible('ai_content') && (
          <AIContent />
        )}
        {SHOW_PLACEHOLDER_DASHBOARD_SECTIONS && isVisible('trending_reels') && (
          <ReelsRow shuffleMode={shuffleMode === "reels"} />
        )}
        {SHOW_PLACEHOLDER_DASHBOARD_SECTIONS && isVisible('top_creators') && (
          <TopCreators />
        )}

        {isVisible('featured_movies') && (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            <Card className="border border-gray-700 bg-card">
              <CardHeader>
                <CardTitle className="text-primary">Featured Movies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Discover our latest and greatest films.</p>
              </CardContent>
            </Card>
          </section>
        )}

        {isVisible('unseen_movies') && (
          <UnseenMovies />
        )}
      </div>

      {/* UNDO: Bottom nav — set SHOW_BOTTOM_NAV_BUTTONS = true at top of file to restore Vee, Clips, Music */}
      {SHOW_BOTTOM_NAV_BUTTONS &&
        (isVisible('vee_reels') || isVisible('clips') || isVisible('music')) && (
        <div className="fixed bottom-4 inset-x-0 flex justify-center items-center space-x-4 z-40">
          {isVisible('vee_reels') && (
            <Link href="/reel-mode">
              <Button className="rounded-full bg-gradient-to-r from-primary via-[#8e2de2] to-[#ff0050] text-white hover:from-[#8e2de2] hover:via-[#ff0050] hover:to-primary px-6 py-2 text-sm font-semibold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
                Vee
              </Button>
            </Link>
          )}
          {isVisible('clips') && (
            <Link href="/clips-mode">
              <Button className="rounded-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white hover:from-green-500 hover:via-green-600 hover:to-green-700 px-6 py-2 text-sm font-semibold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
                Clips
              </Button>
            </Link>
          )}
          {isVisible('music') && (
            <Link href="/musicfeed">
              <Button className="rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-red-700 px-6 py-2 text-sm font-semibold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
                Music
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

