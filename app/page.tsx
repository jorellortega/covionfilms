"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Tv, PlayCircle, Crown, Ticket } from "lucide-react"
import { AIChat } from "@/components/ai-chat"
import {
  EPISODE_PURCHASE_PRICE,
  MOVIE_PURCHASE_PRICE,
  SUBSCRIPTION_PLANS,
  formatUsd,
} from "@/lib/content-pricing"

const standardPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "standard")
const familyPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "family")

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
        Welcome to COVION FILMS
      </h1>
      <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
        Stream new movies, binge series episode by episode, or unlock titles one at a time — your choice.
      </p>

      {/* AI Chat Section */}
      <div className="mb-12">
        <AIChat />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Start Watching</CardTitle>
            <CardDescription>New releases, series, and episodes in one place</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Browse the latest movies and follow series as new episodes drop. Jump back in anytime from your dashboard.
            </p>
            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-primary to-[#8e2de2] text-white hover:from-primary/90 hover:to-[#8e2de2]/90">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Create Your Account</CardTitle>
            <CardDescription>Save progress and manage what you watch</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Sign up to subscribe monthly, buy individual movies and episodes, and keep track of what you have unlocked.
            </p>
            <Link href="/signup">
              <Button className="w-full bg-gradient-to-r from-[#ff0050] to-[#ff2975] text-white hover:from-[#ff0050]/90 hover:to-[#ff2975]/90">
                Sign Up Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
          What You Can Watch
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          COVION FILMS is built around full movies, ongoing series, and individual episodes — not clips or filler.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border border-gray-700 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                  <Film className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-primary">New Movies</CardTitle>
              </div>
              <CardDescription>Full-length films ready to stream</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Watch new movie releases on the homepage player, then open the full film when you are ready.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                  Browse Movies
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border border-gray-700 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                  <Tv className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-primary">Series</CardTitle>
              </div>
              <CardDescription>Multi-episode shows and episodic movies</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Follow a series from episode one, see what is free, and unlock the rest as you go.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                  Explore Series
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border border-gray-700 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                  <PlayCircle className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-primary">Episodes</CardTitle>
              </div>
              <CardDescription>Pay per episode or watch free chapters</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Some episodes are free. Paid episodes unlock individually so you only pay for what you watch.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                  Find Episodes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
          How Pricing Works
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Subscribe monthly for unlimited access, or pay per title when you want to watch one movie or episode at a time.
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-primary">Monthly Plans</CardTitle>
              </div>
              <CardDescription>Unlimited streaming on Standard and Family</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Standard</strong> — {formatUsd(standardPlan?.monthlyPrice ?? 7.5)}/month for unlimited movies and episodes.
              </p>
              <p>
                <strong className="text-foreground">Family</strong> — {formatUsd(familyPlan?.monthlyPrice ?? 12)}/month for up to 5 profiles and full access.
              </p>
              <p>Annual billing saves 10% on paid plans.</p>
              <Link href="/subscribe">
                <Button className="w-full mt-2 bg-gradient-to-r from-primary to-[#8e2de2] text-white">
                  View Plans
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-primary">Pay Per Title</CardTitle>
              </div>
              <CardDescription>No subscription required</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Movies</strong> — {formatUsd(MOVIE_PURCHASE_PRICE)} each to unlock the full film.
              </p>
              <p>
                <strong className="text-foreground">Episodes</strong> — {formatUsd(EPISODE_PURCHASE_PRICE)} each to unlock a single episode.
              </p>
              <p>Free titles and episodes are always available without purchase.</p>
              <Link href="/subscribe">
                <Button variant="outline" className="w-full mt-2 border-primary text-primary hover:bg-primary hover:text-white">
                  See Pay-Per-Title Options
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">New movies. New episodes. Your way to watch.</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Stream on a monthly plan or unlock movies and episodes one at a time. COVION FILMS is built for viewers who want real films and series, not endless scrolling.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-primary to-[#8e2de2] text-white hover:from-primary/90 hover:to-[#8e2de2]/90">
              Start Watching
            </Button>
          </Link>
          <Link href="/subscribe">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
              Compare Plans & Pricing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

