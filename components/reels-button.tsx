"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { Video } from "lucide-react"

export function ReelsButton() {
  const pathname = usePathname()
  const isClipsMode = pathname === "/clips-mode"
  const isVeeMode = pathname === "/vee"
  const isReelMode = pathname === "/reel-mode"

  // Don't show on clips mode or if already in vee/reel mode
  if (isClipsMode || isVeeMode || isReelMode) return null

  return (
    <Link href="/reel-mode">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-foreground hover:text-foreground hover:bg-accent"
        title="Vee/Reels"
      >
        <Video className="h-5 w-5" />
        <span className="sr-only">Vee/Reels</span>
      </Button>
    </Link>
  )
}

