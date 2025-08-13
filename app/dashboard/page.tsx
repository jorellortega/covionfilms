"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MovieTrailers } from "@/components/movie-trailers"
import { TopMovies } from "@/components/top-movies"
import { TopCreators } from "@/components/top-creators"
import { ReelsRow } from "@/components/reels-row"
import { UnseenMovies } from "@/components/unseen-movies"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NewReleases } from "@/components/new-releases"
import { ReelsButton } from "@/components/reels-button"
import { AIContent } from "@/components/ai-content"
import { FEATURES } from "@/config/features"
import { Film, Music, Crown, Star, Zap, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [shuffleMode, setShuffleMode] = useState<"reels" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const handleScreenClick = useCallback(() => {
    if (shuffleMode === "reels") {
      // Navigate to Vee mode
      window.location.href = "/reel-mode"
    }
  }, [shuffleMode])

  // Show loading state
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

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  const getSubscriptionIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
      case 'family':
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 'standard':
        return <Star className="h-5 w-5 text-blue-500" />
      case 'free':
        return <Zap className="h-5 w-5 text-green-500" />
      default:
        return <Users className="h-5 w-5 text-gray-500" />
    }
  }

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'premium':
      case 'family':
        return 'from-yellow-500 to-orange-500'
      case 'standard':
        return 'from-blue-500 to-purple-500'
      case 'free':
        return 'from-green-500 to-teal-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="space-y-8 pb-24 gradient-bg min-h-screen" onClick={shuffleMode ? handleScreenClick : undefined}>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section with User Info */}
        <div className="text-center mb-8 relative">
          {/* Logout Button */}
          <div className="absolute top-0 right-0">
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
          
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
            Welcome back, {user.name}! 👋
          </h1>
          
          {/* Subscription Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600">
            {getSubscriptionIcon(user.subscription)}
            <span className="text-sm font-medium text-white">
              {user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)} Plan
            </span>
          </div>
          
          {/* Role Badge */}
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-xs text-white">
            <span className="capitalize">{user.role}</span>
          </div>
        </div>

        <MovieTrailers shuffleMode={shuffleMode === "reels"} />

        <div className="w-full max-w-md mx-auto my-8">
          <Input
            type="search"
            placeholder="Search videos or creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-white border-white focus:border-white focus:ring-white placeholder-white/70"
          />
        </div>

        <TopMovies shuffleMode={shuffleMode === "reels"} />
        <AIContent />
        <ReelsRow shuffleMode={shuffleMode === "reels"} />
        <NewReleases />
        <TopCreators />

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
          <Card className="border border-gray-700 bg-card">
            <CardHeader>
              <CardTitle className="text-primary">Featured Movies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Discover our latest and greatest films.</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-700 bg-card">
            <CardTitle className="text-primary">Coming Soon</CardTitle>
            <CardContent>
              <p className="text-muted-foreground">Get a sneak peek at upcoming titles.</p>
            </CardContent>
          </Card>
        </section>

        <UnseenMovies />
      </div>

      <div className="fixed bottom-4 inset-x-0 flex justify-center items-center space-x-4 z-40">
        <ReelsButton />
        {FEATURES.CLIPS && (
          <Link href="/clips-mode">
            <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground hover:bg-accent">
              <Film className="h-5 w-5" />
              <span className="sr-only">Clips</span>
            </Button>
          </Link>
        )}
        {FEATURES.MUSIC && (
          <Link href="/musicfeed">
            <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground hover:bg-accent">
              <Music className="h-5 w-5" />
              <span className="text-muted-foreground">Music</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

