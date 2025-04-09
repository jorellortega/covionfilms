import { Card, CardContent } from "@/components/ui/card"

export function UnseenMovies() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Unseen Movies</h2>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Unseen movies will be displayed here.</p>
        </CardContent>
      </Card>
    </section>
  )
}

