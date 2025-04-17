"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FEATURES } from "@/config/features"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden relative z-[100]">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-primary/20 transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      {isOpen && (
        <nav className="fixed top-16 right-4 w-48 bg-card border border-gray-700 rounded-md shadow-lg z-[100]">
          <div className="py-2">
            <Link
              href="/login"
              className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/subscribe"
              className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
            >
              Subscribe
            </Link>
            {FEATURES.CLIPS && (
              <Link
                href="/clips"
                className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
              >
                Clips
              </Link>
            )}
            {FEATURES.VEE && (
              <Link
                href="/vee"
                className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
              >
                Vee
              </Link>
            )}
            {FEATURES.MUSIC && (
              <Link
                href="/music"
                className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
              >
                Music
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}

