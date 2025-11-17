"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { FEATURES } from "@/config/features"

export function DynamicNavigation() {
  const { user, isLoading } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <nav className="hidden md:flex items-center space-x-4 futuristic-subtext">
        <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
        <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
        <div className="animate-pulse bg-gray-600 h-4 w-24 rounded"></div>
      </nav>
    )
  }

  // If user is authenticated, show authenticated navigation
  if (user) {
    return (
      <nav className="hidden md:flex items-center space-x-4 futuristic-subtext">
        <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
          Dashboard
        </Link>
        {user.role === 'admin' || user.role === 'management' ? (
          <Link href="/manage-media" className="text-foreground hover:text-primary transition-colors">
            Manage Media
          </Link>
        ) : null}
        {user.role === 'creator' || user.role === 'admin' || user.role === 'management' ? (
          <Link href="/creator" className="text-foreground hover:text-primary transition-colors">
            Creator
          </Link>
        ) : null}
        {user.role === 'creator' || user.role === 'admin' || user.role === 'management' ? (
          <Link href="/upload" className="text-foreground hover:text-primary transition-colors">
            Upload
          </Link>
        ) : null}
        {user.role === 'admin' || user.role === 'management' ? (
          <Link href="/streaming-control" className="text-foreground hover:text-primary transition-colors">
            Streaming Control
          </Link>
        ) : null}
        {user.role === 'admin' ? (
          <>
            <Link href="/admin/dashboard-control" className="text-foreground hover:text-primary transition-colors">
              Dashboard Control
            </Link>
            <Link href="/admin/ai-settings" className="text-foreground hover:text-primary transition-colors">
              AI Settings
            </Link>
            <Link href="/admin/ai-info" className="text-foreground hover:text-primary transition-colors">
              AI Info
            </Link>
          </>
        ) : null}
        <Link href="/subscribe" className="text-foreground hover:text-primary transition-colors">
          Subscribe
        </Link>
        {FEATURES.CLIPS && (
          <Link href="/clips" className="text-foreground hover:text-primary transition-colors">
            Clips
          </Link>
        )}
        {FEATURES.VEE && (
          <Link href="/vee" className="text-foreground hover:text-primary transition-colors">
            Vee
          </Link>
        )}
        {FEATURES.MUSIC && (
          <Link href="/music" className="text-foreground hover:text-primary transition-colors">
            Music
          </Link>
        )}
        {/* User info display */}
        <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-600">
          <span className="text-sm text-gray-300">
            {user.name}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            {user.subscription}
          </span>
        </div>
      </nav>
    )
  }

  // If user is not authenticated, show public navigation
  return (
    <nav className="hidden md:flex items-center space-x-4 futuristic-subtext">
      <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
        Dashboard
      </Link>
      <Link href="/creator" className="text-foreground hover:text-primary transition-colors">
        Creator
      </Link>
      <Link href="/login" className="text-foreground hover:text-primary transition-colors">
        Login
      </Link>
      <Link href="/subscribe" className="text-foreground hover:text-primary transition-colors">
        Subscribe
      </Link>
      {FEATURES.CLIPS && (
        <Link href="/clips" className="text-foreground hover:text-primary transition-colors">
          Clips
        </Link>
      )}
      {FEATURES.VEE && (
        <Link href="/vee" className="text-foreground hover:text-primary transition-colors">
          Vee
        </Link>
      )}
      {FEATURES.MUSIC && (
        <Link href="/music" className="text-foreground hover:text-primary transition-colors">
          Music
        </Link>
        )}
    </nav>
  )
}
