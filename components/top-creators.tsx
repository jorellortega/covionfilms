import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { User } from "lucide-react"
import Image from "next/image"

const TOP_CREATORS = [
  {
    id: 1,
    name: "Alice Director",
    avatarUrl: "/placeholder.svg?height=100&width=100",
    moviesCount: 5,
  },
  {
    id: 2,
    name: "Bob Filmmaker",
    avatarUrl: "/placeholder.svg?height=100&width=100",
    moviesCount: 3,
  },
  // Placeholder slots for remaining top creators
  ...Array(8)
    .fill(null)
    .map((_, index) => ({
      id: index + 3,
      name: `Creator ${index + 3}`,
      avatarUrl: null,
      moviesCount: 0,
    })),
]

export function TopCreators() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-primary">Top 10 Creators</h2>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border border-gray-700">
        <div className="flex w-max space-x-4 p-4">
          {TOP_CREATORS.map((creator) => (
            <Card key={creator.id} className="w-[150px] bg-card relative overflow-hidden border border-gray-700">
              <CardContent className="p-4 flex flex-col items-center">
                {creator.avatarUrl ? (
                  <Image
                    src={creator.avatarUrl}
                    alt={creator.name}
                    width={80}
                    height={80}
                    className="rounded-full mb-2"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mb-2">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <h3 className="text-sm font-medium text-center truncate w-full">{creator.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {creator.moviesCount} {creator.moviesCount === 1 ? "movie" : "movies"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}

