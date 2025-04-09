import { Card, CardContent } from "@/components/ui/card"

export function Reels() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Reels</h2>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Reels will be displayed here.</p>
        </CardContent>
      </Card>
    </section>
  )
}

