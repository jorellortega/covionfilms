"use client"

import { useState } from "react"
import { Menu, X, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FEATURES } from "@/config/features"
import { useAuth } from "@/components/auth-provider"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout, isLoading } = useAuth()

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
  }

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
            {isLoading ? (
              // Loading state
              <div className="px-4 py-2">
                <div className="animate-pulse bg-gray-600 h-4 w-20 rounded mb-2"></div>
                <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
              </div>
            ) : user ? (
              // Authenticated user menu
              <>
                <div className="px-4 py-2 border-b border-gray-600 mb-2">
                  <div className="text-sm font-medium text-white">{user.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                  <div className="text-xs text-primary">{user.subscription} Plan</div>
                </div>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                {user.role === 'creator' || user.role === 'admin' || user.role === 'management' ? (
                  <Link
                    href="/creator"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Creator
                  </Link>
                ) : null}
                {user.role === 'creator' || user.role === 'admin' || user.role === 'management' ? (
                  <Link
                    href="/upload"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Upload
                  </Link>
                ) : null}
                {user.role === 'admin' || user.role === 'management' ? (
                  <Link
                    href="/streaming-control"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Streaming Control
                  </Link>
                ) : null}
                <Link
                  href="/subscribe"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Subscribe
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              // Public menu
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/subscribe"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Subscribe
                </Link>
              </>
            )}
            
            {/* Feature links */}
            {FEATURES.CLIPS && (
              <Link
                href="/clips"
                className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Clips
              </Link>
            )}
            {FEATURES.VEE && (
              <Link
                href="/vee"
                className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Vee
              </Link>
            )}
            {FEATURES.MUSIC && (
              <Link
                href="/music"
                className="block px-4 py-2 text-sm text-foreground hover:bg-primary/20 transition-colors"
                onClick={() => setIsOpen(false)}
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

