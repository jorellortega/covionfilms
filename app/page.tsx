"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Sparkles, Layers, Info } from "lucide-react"
import { AIChat } from "@/components/ai-chat"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
        Welcome to COVION FILMS
      </h1>

      {/* AI Chat Section */}
      <div className="mb-12">
        <AIChat />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Discover Amazing Content</CardTitle>
            <CardDescription>Explore a world of movies, clips, and more</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              COVION FILMS brings you the latest and greatest in entertainment. From blockbuster movies to trending
              clips, we've got it all.
            </p>
            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-primary to-[#8e2de2] text-white hover:from-primary/90 hover:to-[#8e2de2]/90">
                Start Watching
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Join Our Community</CardTitle>
            <CardDescription>Become a part of the COVION experience</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Create an account to unlock personalized recommendations, save your favorites, and join discussions with
              other film enthusiasts.
            </p>
            <Link href="/signup">
              <Button className="w-full bg-gradient-to-r from-[#ff0050] to-[#ff2975] text-white hover:from-[#ff0050]/90 hover:to-[#ff2975]/90">
                Sign Up Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Content Type Cards */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
          Explore Our Content
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border border-gray-700 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                  <Info className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-primary">Movie Info</CardTitle>
              </div>
              <CardDescription>Discover detailed information about your favorite films</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get comprehensive details, cast information, ratings, and more about movies in our collection.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                  Explore
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border border-gray-700 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                  <Film className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-primary">Real Content</CardTitle>
              </div>
              <CardDescription>Authentic, human-created entertainment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Experience genuine, professionally produced content created by talented filmmakers and creators.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                  Watch Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border border-gray-700 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-primary">Hybrid Content</CardTitle>
              </div>
              <CardDescription>Where real meets AI innovation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Unique content that combines traditional filmmaking with cutting-edge AI technology for enhanced experiences.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                  Discover
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border border-gray-700 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-primary">AI Content</CardTitle>
              </div>
              <CardDescription>AI-generated entertainment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Explore revolutionary AI-generated films, animations, and creative content powered by advanced algorithms.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                    Experience
                  </Button>
                </Link>
                <Link href="/ai-content">
                  <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white">
                    Submit AI Content
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Experience the Future of Entertainment</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          COVION FILMS is not just a streaming platform; it's a revolution in how you experience movies and clips. With
          cutting-edge technology and a vast library of content, we're redefining entertainment for the digital age.
        </p>
        <Link href="/subscribe">
          <Button className="bg-gradient-to-r from-primary to-[#8e2de2] text-white hover:from-primary/90 hover:to-[#8e2de2]/90">
            Explore Subscription Plans
          </Button>
        </Link>
      </div>
    </div>
  )
}

