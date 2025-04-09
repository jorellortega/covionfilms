import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ViewIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"

const AI_CONTENT = [
  {
    id: 1,
    title: "AI-Generated Film 1",
    description: "Created using advanced AI algorithms",
    imageUrl: "/placeholder.svg?height=225&width=150",
    type: "film"
  },
  {
    id: 2,
    title: "AI-Generated Film 2",
    description: "Powered by neural networks",
    imageUrl: "/placeholder.svg?height=225&width=150",
    type: "film"
  },
  {
    id: 3,
    title: "AI-Generated Short",
    description: "Experimental AI storytelling",
    imageUrl: "/placeholder.svg?height=225&width=150",
    type: "short"
  },
  {
    id: 4,
    title: "AI-Generated Animation",
    description: "AI-powered animation",
    imageUrl: "/placeholder.svg?height=225&width=150",
    type: "animation"
  },
  {
    id: 5,
    title: "AI-Generated Documentary",
    description: "AI-curated content",
    imageUrl: "/placeholder.svg?height=225&width=150",
    type: "documentary"
  }
]

export function AIContent() {
  const [viewMode, setViewMode] = useState<"scroll" | "grid" | "list">("scroll")

  const toggleViewMode = () => {
    setViewMode((current) => {
      if (current === "scroll") return "grid"
      if (current === "grid") return "list"
      return "scroll"
    })
  }

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {AI_CONTENT.map((content) => (
        <Card key={content.id} className="w-full aspect-[2/3] bg-card relative overflow-hidden border border-gray-800 group">
          <CardContent className="p-0 w-full h-full">
            <Image
              src={content.imageUrl}
              alt={content.title}
              width={150}
              height={225}
              className="object-cover w-full h-full transition-opacity duration-300 group-hover:opacity-75"
            />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-white text-sm font-semibold truncate">{content.title}</p>
              <p className="text-primary text-xs">{content.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderScrollView = () => (
    <div className="flex space-x-4 p-4">
      {AI_CONTENT.map((content) => (
        <Card key={content.id} className="w-[150px] h-[225px] flex-shrink-0 bg-card relative overflow-hidden border border-gray-800">
          <CardContent className="p-0 w-full h-full">
            <Image
              src={content.imageUrl}
              alt={content.title}
              width={150}
              height={225}
              className="object-cover w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
              <p className="text-white text-xs font-semibold truncate">{content.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-4 p-4">
      {AI_CONTENT.map((content) => (
        <Card key={content.id} className="flex items-center space-x-4 p-2 bg-card rounded-md border border-gray-800">
          <div className="w-16 h-24 relative flex-shrink-0">
            <Image
              src={content.imageUrl}
              alt={content.title}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
          </div>
          <div>
            <p className="font-semibold text-primary">{content.title}</p>
            <p className="text-sm text-muted-foreground">{content.description}</p>
          </div>
        </Card>
      ))}
    </div>
  )

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-wider uppercase bg-gradient-to-r from-[#00ff9d] to-[#00b8ff] text-transparent bg-clip-text futuristic-text">
          AI-Generated Content
        </h2>
        <Button
          onClick={toggleViewMode}
          variant="outline"
          size="sm"
          className="bg-black/50 border-primary text-primary hover:bg-primary hover:text-black transition-colors duration-300"
        >
          <ViewIcon className="h-5 w-5 mr-2" />
          <span className="uppercase tracking-wider text-xs font-bold futuristic-subtext">
            {viewMode === "scroll" ? "Grid" : viewMode === "grid" ? "List" : "Scroll"}
          </span>
        </Button>
      </div>
      <ScrollArea className="w-full rounded-md border border-gray-800">
        {viewMode === "grid" && renderGridView()}
        {viewMode === "scroll" && renderScrollView()}
        {viewMode === "list" && renderListView()}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
} 