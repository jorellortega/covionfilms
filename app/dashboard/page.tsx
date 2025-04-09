"use client"

import { useState, useCallback } from "react"
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

export default function DashboardPage() {
  const [shuffleMode, setShuffleMode] = useState<"reels" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()

  const handleScreenClick = useCallback(() => {
    if (shuffleMode === "reels") {
      // Navigate to Vee mode
      window.location.href = "/reel-mode"
    }
  }, [shuffleMode])

  return (
    <div className="space-y-8 pb-24 gradient-bg min-h-screen" onClick={shuffleMode ? handleScreenClick : undefined}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
          Welcome back, {user?.name || "Guest"}!
        </h1>

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
            <CardHeader>
              <CardTitle className="text-primary">New Releases</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Check out what's new this week.</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-700 bg-card">
            <CardHeader>
              <CardTitle className="text-primary">Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Get a sneak peek at upcoming titles.</p>
            </CardContent>
          </Card>
        </section>

        <UnseenMovies />
      </div>

      <div className="fixed bottom-4 inset-x-0 flex justify-center items-center space-x-4 z-40">
        <ReelsButton />
        <Link href="/clips-mode">
          <Button className="rounded-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white hover:from-green-500 hover:via-green-600 hover:to-green-700 px-6 py-2 text-sm font-semibold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
            Clips
          </Button>
        </Link>
        <Link href="/musicfeed">
          <Button className="rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-red-700 px-6 py-2 text-sm font-semibold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
            Music
          </Button>
        </Link>
      </div>
    </div>
  )
}

