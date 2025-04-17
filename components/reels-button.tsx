"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { FEATURES } from "@/config/features"
import { Film } from "lucide-react"

export function ReelsButton() {
  const pathname = usePathname()
  const isClipsMode = pathname === "/clips-mode"

  if (isClipsMode) return null

  return (
    <>
      {FEATURES.VEE && (
        <Link href="/vee">
          <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground hover:bg-accent">
            <Film className="h-5 w-5" />
            <span className="sr-only">Vee</span>
          </Button>
        </Link>
      )}
    </>
  )
}

