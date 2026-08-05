"use client"

import type React from "react"
import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Link2, AlertCircle, CheckCircle, Film, Layers } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"

type LinkResponse = {
  uid: string
  ready: boolean
  status: string
  manifestUrl: string
  iframeUrl: string
  thumbnail: string | null
  duration: number | null
  resolution: string | null
  cloudflareName: string | null
  error?: string
}

type ParentOption = {
  id: string
  title: string
  content_type?: string
}

type UploadMode = "title" | "episode"

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-8 text-muted-foreground">
              Loading upload...
            </CardContent>
          </Card>
        </div>
      }
    >
      <UploadPageContent />
    </Suspense>
  )
}

function UploadPageContent() {
  const [uploadMode, setUploadMode] = useState<UploadMode>("title")
  const [streamVideoId, setStreamVideoId] = useState("")
  const [trailerStreamVideoId, setTrailerStreamVideoId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [contentType, setContentType] = useState("movie")
  const [genre, setGenre] = useState("")
  const [producer, setProducer] = useState("")
  const [releaseYear, setReleaseYear] = useState("")
  const [dashboardSection, setDashboardSection] = useState("none")
  const [isFree, setIsFree] = useState(false)
  const [episodeNumber, setEpisodeNumber] = useState("1")
  const [parentId, setParentId] = useState("")
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [cloudflareConfigured, setCloudflareConfigured] = useState(true)
  const [preview, setPreview] = useState<LinkResponse | null>(null)
  const [trailerPreview, setTrailerPreview] = useState<LinkResponse | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    const parentFromUrl = searchParams.get("parent")
    if (parentFromUrl) {
      setUploadMode("episode")
      setParentId(parentFromUrl)
    }
  }, [searchParams])

  const DASHBOARD_SECTIONS = [
    { value: "featured", label: "Featured Movies" },
    { value: "new_releases", label: "New Releases" },
    { value: "top_movies", label: "Top Movies" },
    { value: "trending", label: "Trending Now" },
    { value: "coming_soon", label: "Coming Soon" },
    { value: "none", label: "No Section" },
  ]

  useEffect(() => {
    fetch("/api/stream/config")
      .then((res) => res.json())
      .then((data) => setCloudflareConfigured(Boolean(data.configured)))
      .catch(() => setCloudflareConfigured(false))
  }, [])

  useEffect(() => {
    if (user && !["creator", "admin", "management"].includes(user.role)) {
      toast({
        title: "Access Denied",
        description: "You need creator permissions to add content.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [user, router])

  const loadParents = async () => {
    const { data } = await supabase
      .from("video_assets")
      .select("id, title, content_type")
      .in("content_type", ["movie", "series"])
      .order("title", { ascending: true })

    setParentOptions(data || [])
  }

  useEffect(() => {
    loadParents()
  }, [])

  const getAuthHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error("You must be signed in.")
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    }
  }

  const linkStreamVideo = async (videoId: string) => {
    const headers = await getAuthHeaders()
    const response = await fetch("/api/stream/link", {
      method: "POST",
      headers,
      body: JSON.stringify({ streamVideoId: videoId }),
    })

    const data = (await response.json()) as LinkResponse & { error?: string }
    if (!response.ok) {
      throw new Error(data.error || "Could not find video in Cloudflare Stream")
    }

    return data
  }

  const handleLookup = async () => {
    if (!streamVideoId.trim()) {
      toast({ title: "Enter a Video ID", variant: "destructive" })
      return
    }

    try {
      const data = await linkStreamVideo(streamVideoId)
      setPreview(data)
      if (!title && data.cloudflareName) {
        setTitle(data.cloudflareName.replace(/\.[^/.]+$/, ""))
      }

      toast({
        title: data.ready ? "Video found" : "Video found (still processing)",
        description: data.ready
          ? "Ready to add to your catalog."
          : `Cloudflare status: ${data.status}. You can add it now and it will play when ready.`,
      })
    } catch (error) {
      setPreview(null)
      toast({
        title: "Lookup failed",
        description: error instanceof Error ? error.message : "Could not link video",
        variant: "destructive",
      })
    }
  }

  const handleTrailerLookup = async () => {
    if (!trailerStreamVideoId.trim()) {
      toast({ title: "Enter a trailer Video ID", variant: "destructive" })
      return
    }

    try {
      const data = await linkStreamVideo(trailerStreamVideoId)
      setTrailerPreview(data)
      toast({
        title: data.ready ? "Trailer found" : "Trailer found (still processing)",
        description: data.ready
          ? "Trailer is ready for the dashboard player."
          : `Cloudflare status: ${data.status}. You can save it now.`,
      })
    } catch (error) {
      setTrailerPreview(null)
      toast({
        title: "Trailer lookup failed",
        description: error instanceof Error ? error.message : "Could not link trailer",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!cloudflareConfigured && uploadMode === "episode") {
      toast({
        title: "Cloudflare Not Configured",
        description: "Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN to .env.local",
        variant: "destructive",
      })
      return
    }

    if (!title || !description || !genre) {
      toast({ title: "Missing Information", variant: "destructive" })
      return
    }

    if (uploadMode === "episode") {
      if (!streamVideoId || !parentId || !episodeNumber) {
        toast({ title: "Episode requires parent, episode number, and video ID", variant: "destructive" })
        return
      }
    } else if (contentType !== "series" && !streamVideoId) {
      toast({ title: "Movies need a Cloudflare Video ID", variant: "destructive" })
      return
    }

    setSubmitting(true)

    try {
      let manifestUrl: string | null = null
      let cloudflareUid: string | null = null
      let trailerCloudflareUid: string | null = null
      let duration = 0
      let resolution = "Unknown"
      let thumbnail: string | null = null
      let status = "ready"

      if (streamVideoId) {
        const headers = await getAuthHeaders()
        const response = await fetch("/api/stream/link", {
          method: "POST",
          headers,
          body: JSON.stringify({ streamVideoId }),
        })

        const data = (await response.json()) as LinkResponse & { error?: string }
        if (!response.ok) {
          throw new Error(data.error || "Could not link Cloudflare Stream video")
        }

        manifestUrl = data.manifestUrl
        cloudflareUid = data.uid
        duration = data.duration ? Math.round(data.duration) : 0
        resolution = data.resolution || "Unknown"
        thumbnail = data.thumbnail
        status = data.ready ? "ready" : "processing"
      }

      if (uploadMode === "title" && trailerStreamVideoId.trim()) {
        const trailerData = trailerPreview?.uid
          ? trailerPreview
          : await linkStreamVideo(trailerStreamVideoId)
        trailerCloudflareUid = trailerData.uid
      }

      const payload: Record<string, unknown> = {
        title,
        description,
        manifest_url: manifestUrl,
        cloudflare_stream_uid: cloudflareUid,
        trailer_cloudflare_stream_uid: trailerCloudflareUid,
        file_size: null,
        duration,
        resolution,
        user_id: user?.id,
        status,
        dashboard_section: dashboardSection,
        genre,
        content_type: uploadMode === "episode" ? "episode" : contentType,
        is_public: true,
        is_free: isFree,
        cover_image_path: thumbnail,
      }

      if (uploadMode === "title") {
        payload.producer = producer.trim() || null
        const parsedYear = releaseYear.trim() ? parseInt(releaseYear, 10) : NaN
        payload.release_year = Number.isFinite(parsedYear) ? parsedYear : null
      }

      if (uploadMode === "episode") {
        payload.parent_id = parentId
        payload.episode_number = parseInt(episodeNumber, 10)
      }

      const { data: inserted, error: dbError } = await supabase
        .from("video_assets")
        .insert(payload)
        .select("id")
        .single()

      if (dbError) {
        throw new Error(dbError.message)
      }

      toast({
        title: uploadMode === "episode" ? "Episode added!" : "Title added!",
        description:
          uploadMode === "episode"
            ? `Episode ${episodeNumber} is now part of the series.`
            : contentType === "series"
              ? "Series created. Add episodes next."
              : "Your video is in the catalog.",
      })

      if (uploadMode === "episode") {
        resetEpisodeForm()
      } else if (contentType === "series" && inserted?.id) {
        setUploadMode("episode")
        setStreamVideoId("")
        setTitle("")
        setDescription("")
        setPreview(null)
        setParentId(inserted.id)
        await loadParents()
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      toast({
        title: "Failed to add content",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetEpisodeForm = () => {
    setStreamVideoId("")
    setTitle("")
    setDescription("")
    setPreview(null)
    setEpisodeNumber(String(parseInt(episodeNumber, 10) + 1))
  }

  if (!user || !["creator", "admin", "management"].includes(user.role)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need creator permissions to add content.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
            Upload Content
          </CardTitle>
          <CardDescription className="text-center">
            Add a movie/series title or upload individual episodes with free or paid access
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button
              type="button"
              variant={uploadMode === "title" ? "default" : "outline"}
              onClick={() => setUploadMode("title")}
              className="w-full"
            >
              <Film className="h-4 w-4 mr-2" />
              Movie / Series
            </Button>
            <Button
              type="button"
              variant={uploadMode === "episode" ? "default" : "outline"}
              onClick={() => setUploadMode("episode")}
              className="w-full"
            >
              <Layers className="h-4 w-4 mr-2" />
              Episode
            </Button>
          </div>

          {!cloudflareConfigured && uploadMode === "episode" && (
            <div className="mb-6 rounded-lg border border-yellow-600/50 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              Add <code>CLOUDFLARE_ACCOUNT_ID</code> and <code>CLOUDFLARE_STREAM_API_TOKEN</code> to{" "}
              <code>.env.local</code> and restart the dev server.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {uploadMode === "episode" && (
              <>
                <div className="space-y-2">
                  <Label>Parent Movie / Series *</Label>
                  <Select value={parentId} onValueChange={setParentId} disabled={submitting}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent title" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentOptions.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.title} ({parent.content_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="episodeNumber">Episode Number *</Label>
                  <Input
                    id="episodeNumber"
                    type="number"
                    min="1"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </>
            )}

            {uploadMode === "title" && (
              <div className="space-y-2">
                <Label>Content Type *</Label>
                <Select value={contentType} onValueChange={setContentType} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Movie (single or episodic)</SelectItem>
                    <SelectItem value="series">Series (episodes added separately)</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                    <SelectItem value="short">Short Film</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(uploadMode === "episode" || contentType !== "series") && (
              <div className="space-y-2">
                <Label htmlFor="streamVideoId">Full Movie Video ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="streamVideoId"
                    value={streamVideoId}
                    onChange={(e) => {
                      setStreamVideoId(e.target.value)
                      setPreview(null)
                    }}
                    placeholder="6238e1c7534547d1f1bf4c1636eba0be"
                    disabled={submitting}
                    required={uploadMode === "episode" || contentType !== "series"}
                  />
                  <Button type="button" variant="outline" onClick={handleLookup} disabled={submitting}>
                    Verify
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cloudflare Stream ID for the full movie or episode playback on the watch page.
                </p>
              </div>
            )}

            {uploadMode === "title" && (
              <div className="space-y-2">
                <Label htmlFor="trailerStreamVideoId">Trailer Video ID (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="trailerStreamVideoId"
                    value={trailerStreamVideoId}
                    onChange={(e) => {
                      setTrailerStreamVideoId(e.target.value)
                      setTrailerPreview(null)
                    }}
                    placeholder="Separate Cloudflare ID for dashboard preview"
                    disabled={submitting}
                  />
                  <Button type="button" variant="outline" onClick={handleTrailerLookup} disabled={submitting}>
                    Verify
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Plays in the dashboard hero player. &quot;Watch full video&quot; still links to the full movie.
                </p>
              </div>
            )}

            {preview && (
              <div className="rounded-lg border border-green-600/40 bg-green-500/10 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {preview.ready ? "Full video is ready" : `Processing (${preview.status})`}
                </div>
                <p className="text-muted-foreground">ID: {preview.uid}</p>
              </div>
            )}

            {trailerPreview && (
              <div className="rounded-lg border border-blue-600/40 bg-blue-500/10 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-blue-400 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {trailerPreview.ready ? "Trailer is ready" : `Trailer processing (${trailerPreview.status})`}
                </div>
                <p className="text-muted-foreground">Trailer ID: {trailerPreview.uid}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                required
                placeholder={uploadMode === "episode" ? "Episode 1" : "Movie or series title"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={submitting}
                required
              />
            </div>

            {uploadMode === "title" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="producer">Producer</Label>
                  <Input
                    id="producer"
                    value={producer}
                    onChange={(e) => setProducer(e.target.value)}
                    disabled={submitting}
                    placeholder="Production company or producer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="releaseYear">Year</Label>
                  <Input
                    id="releaseYear"
                    type="number"
                    min="1900"
                    max="2100"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    disabled={submitting}
                    placeholder="2026"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Genre *</Label>
              <Select value={genre} onValueChange={setGenre} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="comedy">Comedy</SelectItem>
                  <SelectItem value="drama">Drama</SelectItem>
                  <SelectItem value="horror">Horror</SelectItem>
                  <SelectItem value="romance">Romance</SelectItem>
                  <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                  <SelectItem value="thriller">Thriller</SelectItem>
                  <SelectItem value="documentary">Documentary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
              <div>
                <Label htmlFor="isFree" className="text-base">Free to watch</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadMode === "episode"
                    ? "Free episodes play without purchase. Paid episodes show a lock."
                    : "Mark the entire title free for all viewers."}
                </p>
              </div>
              <Switch id="isFree" checked={isFree} onCheckedChange={setIsFree} disabled={submitting} />
            </div>

            {(user?.role === "admin" || user?.role === "management") && uploadMode === "title" && (
              <div className="space-y-2">
                <Label>Dashboard Section</Label>
                <Select value={dashboardSection} onValueChange={setDashboardSection} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DASHBOARD_SECTIONS.map((section) => (
                      <SelectItem key={section.value} value={section.value}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-[#8e2de2] text-white"
              disabled={submitting || !title || !description || !genre}
            >
              <Link2 className="h-4 w-4 mr-2" />
              {submitting
                ? "Adding..."
                : uploadMode === "episode"
                  ? "Add Episode"
                  : contentType === "series"
                    ? "Create Series"
                    : "Add to Platform"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
