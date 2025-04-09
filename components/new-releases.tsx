import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Film } from "lucide-react"
import Image from "next/image"

const NEW_RELEASES = [
  {
    id: 1,
    title: "New Release 1",
    imageUrl: "/placeholder.svg?height=225&width=150",
  },
  {
    id: 2,
    title: "New Release 2",
    imageUrl: "/placeholder.svg?height=225&width=150",
  },
  // Add more new releases here
]

export function NewReleases() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-primary">New Releases</h2>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border border-gray-700">
        <div className="flex w-max space-x-4 p-4">
          {NEW_RELEASES.map((movie) => (
            <Card
              key={movie.id}
              className={`w-[150px] h-[225px] flex items-center justify-center bg-card relative overflow-hidden border border-gray-700`}
            >
              <CardContent className="p-0 w-full h-full">
                {movie.imageUrl ? (
                  <Image
                    src={movie.imageUrl}
                    alt={movie.title}
                    width={150}
                    height={225}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
                    <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-center text-sm text-muted-foreground opacity-50">{movie.title}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}

