"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  name: string
  email: string
  status: "active" | "inactive" | "suspended"
  role: "admin" | "management" | "creator" | "user"
  subscription: "free" | "standard" | "premium" | "family"
  subscriptionExpiry?: Date
  avatarUrl?: string
}

export default function AccountPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || "Guest",
    email: user?.email || "",
    status: "active",
    role: user?.role || "user",
    subscription: user?.subscription || "free",
    subscriptionExpiry: user?.subscriptionExpiry,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      // Simulating an API call to fetch user profile
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock data - in a real app, this would come from your API
      const mockProfile: UserProfile = {
        name: user?.name || "John Doe",
        email: user?.email || "john.doe@example.com",
        status: "active",
        role: user?.role === "admin" ? "admin" : user?.role === "management" ? "management" : user?.role === "creator" ? "creator" : "user",
        subscription: user?.subscription === "premium" ? "premium" : user?.subscription === "family" ? "family" : "free",
        subscriptionExpiry: user?.subscriptionExpiry,
        avatarUrl: "/placeholder.svg",
      }

      setProfile(mockProfile)
      setLoading(false)
    }

    fetchProfile()
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>Unable to load account information. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
        Your Account
      </h1>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
            <AvatarFallback>
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{profile.name}</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Status</span>
            <Badge variant={profile.status === "active" ? "default" : "destructive"}>
              {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Role</span>
            <Badge variant="secondary" className="capitalize">
              {profile.role}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Subscription</span>
            <Badge variant="secondary" className="capitalize">
              {profile.subscription}
            </Badge>
          </div>
          {profile.subscriptionExpiry && (
            <div className="flex justify-between items-center">
              <span className="font-semibold">Subscription Expires</span>
              <span className="text-muted-foreground">
                {new Date(profile.subscriptionExpiry).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="pt-4 flex justify-between">
            <Link href="/settings">
              <Button variant="outline">Edit Profile</Button>
            </Link>
            <Link href="/subscribe">
              <Button variant="default" className="bg-gradient-to-r from-primary to-[#8e2de2] text-white">
                {profile.subscription === "free" ? "Upgrade Account" : "Manage Subscription"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

