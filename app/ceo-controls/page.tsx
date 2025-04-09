"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X } from "lucide-react"

export default function CEOControlsPage() {
  const [hiddenContentVisible, setHiddenContentVisible] = useState(false)
  const [uploadedMovies, setUploadedMovies] = useState<string[]>([])
  const [uploadedReels, setUploadedReels] = useState<string[]>([])

  const handleMovieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedMovies([...uploadedMovies, file.name])
    }
  }

  const handleReelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedReels([...uploadedReels, file.name])
    }
  }

  const removeMovie = (movieName: string) => {
    setUploadedMovies(uploadedMovies.filter((movie) => movie !== movieName))
  }

  const removeReel = (reelName: string) => {
    setUploadedReels(uploadedReels.filter((reel) => reel !== reelName))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">CEO Controls</h1>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="metrics">Metrics & Comments</TabsTrigger>
          <TabsTrigger value="content">Content Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="algorithms">Algorithm Control</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="movie-upload">Movie Upload</TabsTrigger>
          <TabsTrigger value="reel-upload">Reel Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <h2 className="text-2xl font-semibold">Swipe Metrics and Comments</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="left-swipes">Left Swipes (Disliked)</Label>
              <Input id="left-swipes" type="number" placeholder="Enter number of left swipes" />
            </div>
            <div>
              <Label htmlFor="right-swipes">Right Swipes (Liked)</Label>
              <Input id="right-swipes" type="number" placeholder="Enter number of right swipes" />
            </div>
          </div>
          <div>
            <Label htmlFor="comments">Comments</Label>
            <textarea
              id="comments"
              className="w-full h-32 p-2 border rounded"
              placeholder="View and moderate comments here"
            ></textarea>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <h2 className="text-2xl font-semibold">Content Management</h2>
          <div className="flex items-center space-x-2">
            <Switch id="hidden-content" checked={hiddenContentVisible} onCheckedChange={setHiddenContentVisible} />
            <Label htmlFor="hidden-content">Show Hidden Content</Label>
          </div>
          {hiddenContentVisible && (
            <div className="bg-muted p-4 rounded">
              <p>Hidden content is now visible for internal review.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <h2 className="text-2xl font-semibold">User Management</h2>
          <div className="space-y-2">
            <Label htmlFor="user-action">Select Action</Label>
            <Select>
              <SelectTrigger id="user-action">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restrict">Restrict User</SelectItem>
                <SelectItem value="unrestrict">Unrestrict User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="user-id">User ID</Label>
            <Input id="user-id" placeholder="Enter user ID" />
          </div>
          <Button>Apply Action</Button>
        </TabsContent>

        <TabsContent value="algorithms" className="space-y-4">
          <h2 className="text-2xl font-semibold">Algorithm Control</h2>
          <div className="space-y-2">
            <Label htmlFor="top-10">Modify Top 10 Movies</Label>
            <Input id="top-10" placeholder="Enter movie IDs separated by commas" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="force-content">Force Content to Top</Label>
            <Select>
              <SelectTrigger id="force-content">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="trailer">Trailer</SelectItem>
                <SelectItem value="reel">Reel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Enter content ID" />
          <Button>Apply Changes</Button>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <h2 className="text-2xl font-semibold">Promotional Tools</h2>
          <div className="space-y-2">
            <Label htmlFor="promo-content">Content to Promote</Label>
            <Select>
              <SelectTrigger id="promo-content">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="trailer">Trailer</SelectItem>
                <SelectItem value="reel">Reel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Enter content ID" />
          <div className="space-y-2">
            <Label htmlFor="promo-frequency">Promotion Frequency</Label>
            <Select>
              <SelectTrigger id="promo-frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Start Promotion</Button>
        </TabsContent>

        <TabsContent value="movie-upload" className="space-y-4">
          <h2 className="text-2xl font-semibold">Movie Upload Portal</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="movie-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Click to upload a movie or drag and drop</p>
                </div>
                <Input id="movie-upload" type="file" className="hidden" onChange={handleMovieUpload} accept="video/*" />
              </Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedMovies.map((movie, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-4">
                    <p className="font-medium">{movie}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeMovie(movie)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reel-upload" className="space-y-4">
          <h2 className="text-2xl font-semibold">Reel Upload Portal</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reel-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Click to upload a reel or drag and drop</p>
                </div>
                <Input id="reel-upload" type="file" className="hidden" onChange={handleReelUpload} accept="video/*" />
              </Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedReels.map((reel, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-4">
                    <p className="font-medium">{reel}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeReel(reel)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

