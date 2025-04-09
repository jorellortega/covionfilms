"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export function ReelsButton() {
  const pathname = usePathname()
  const isClipsMode = pathname === "/clips-mode"

  if (isClipsMode) return null

  return (
    <Link href="/vee">
      <Button className="rounded-full bg-gradient-to-r from-[#ff0050] via-[#ff2975] to-[#ff52a0] text-white hover:from-[#ff0050]/90 hover:via-[#ff2975]/90 hover:to-[#ff52a0]/90 px-6 py-2 text-sm font-semibold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110">
        Vee
      </Button>
    </Link>
  )
}

