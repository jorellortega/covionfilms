"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, Film, Users, DollarSign, TrendingUp } from "lucide-react"

export default function CreatorPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [creatorType, setCreatorType] = useState("")
  const [portfolio, setPortfolio] = useState("")
  const [motivation, setMotivation] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Here you would typically make an API call to submit the creator application
    // For now, we'll just simulate a successful submission
    try {
      // Simulating an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Application submitted successfully",
        description:
          "Thank you for your interest in joining COVION as a creator. We'll review your application and get back to you soon.",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "An error occurred while submitting your application. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
        Join COVION as a Creator
      </h1>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Why Join COVION?</CardTitle>
            <CardDescription>Empower your creativity and reach a global audience</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                <span>Access to cutting-edge production tools and resources</span>
              </li>
              <li className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                <span>Connect with a community of talented creators</span>
              </li>
              <li className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-primary" />
                <span>Competitive revenue sharing and monetization options</span>
              </li>
              <li className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                <span>Boost your visibility with our advanced recommendation algorithms</span>
              </li>
              <li className="flex items-center">
                <Film className="mr-2 h-5 w-5 text-primary" />
                <span>Opportunities for collaborations and exclusive COVION productions</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Apply to Be a Creator</CardTitle>
            <CardDescription>Tell us about yourself and your creative vision</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Your email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creatorType">Creator Type</Label>
                <Select value={creatorType} onValueChange={setCreatorType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your creator type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filmmaker">Filmmaker</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="musician">Musician</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio/Social Media Links</Label>
                <Input
                  id="portfolio"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="Links to your work or social media profiles"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivation">Why do you want to join COVION?</Label>
                <Textarea
                  id="motivation"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Tell us about your motivation and what you hope to achieve"
                  rows={4}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-[#8e2de2] text-white hover:from-primary/90 hover:to-[#8e2de2]/90"
              >
                Submit Application
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Join the COVION Creator Community</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          By joining COVION as a creator, you'll be part of a vibrant community of artists, filmmakers, and influencers.
          Together, we're shaping the future of digital entertainment and pushing the boundaries of creativity.
        </p>
      </div>
    </div>
  )
}

