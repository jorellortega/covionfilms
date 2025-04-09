import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
        Welcome to COVION FILMS
      </h1>

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

