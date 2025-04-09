"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Pencil, Trash2, Eye } from "lucide-react"
import Image from "next/image"

interface MediaItem {
  id: string
  title: string
  type: "movie" | "shortFilm" | "reel" | "clip"
  genre: string
  uploadDate: string
  coverImage: string
}

const SAMPLE_MEDIA: MediaItem[] = [
  {
    id: "1",
    title: "The Neon Horizon",
    type: "movie",
    genre: "Science Fiction",
    uploadDate: "2023-06-15",
    coverImage: "/placeholder.svg?height=100&width=180",
  },
  {
    id: "2",
    title: "Laugh Track",
    type: "shortFilm",
    genre: "Comedy",
    uploadDate: "2023-07-02",
    coverImage: "/placeholder.svg?height=100&width=180",
  },
  {
    id: "3",
    title: "Urban Beats",
    type: "reel",
    genre: "Music",
    uploadDate: "2023-07-10",
    coverImage: "/placeholder.svg?height=100&width=180",
  },
]

export default function ManageMediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(SAMPLE_MEDIA)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string | undefined>()

  const filteredMedia = mediaItems.filter(
    (item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()) && (!filterType || item.type === filterType),
  )

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setMediaItems(mediaItems.filter((item) => item.id !== id))
      toast({
        title: "Media Deleted",
        description: "The selected media has been removed.",
      })
    }
  }

  const handleEdit = (id: string) => {
    // In a real application, this would navigate to an edit page or open a modal
    toast({
      title: "Edit Media",
      description: `Editing media with ID: ${id}`,
    })
  }

  const handleView = (id: string) => {
    // In a real application, this would navigate to a view page
    toast({
      title: "View Media",
      description: `Viewing media with ID: ${id}`,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
        Manage Your Media
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Uploaded Content</CardTitle>
          <CardDescription>View and manage all your uploaded media</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Input
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined}>All Types</SelectItem>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="shortFilm">Short Film</SelectItem>
                <SelectItem value="reel">Reel</SelectItem>
                <SelectItem value="clip">Clip</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedia.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Image
                      src={item.coverImage || "/placeholder.svg"}
                      alt={item.title}
                      width={100}
                      height={56}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.genre}</TableCell>
                  <TableCell>{item.uploadDate}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(item.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">Total items: {filteredMedia.length}</p>
        </CardFooter>
      </Card>
    </div>
  )
}

