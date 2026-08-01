"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [subscription, setSubscription] = useState("free")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure your passwords match and try again.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: "user",
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // Check if email confirmation is required
        const needsEmailConfirmation = !authData.user.email_confirmed_at

        // Create user profile in our custom users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: name,
            email: email,
            password_hash: 'auth_managed', // Supabase handles password hashing
            role: "user"
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't throw here as the auth user was created
        }

        // Create subscription record
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: authData.user.id,
            tier: subscription,
            status: 'active',
            start_date: new Date().toISOString(),
            auto_renew: subscription !== 'free'
          })

        if (subscriptionError) {
          console.error('Subscription creation error:', subscriptionError)
        }

        // Create user profile
        const { error: userProfileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            status: 'active'
          })

        if (userProfileError) {
          console.error('User profile creation error:', userProfileError)
        }

        if (needsEmailConfirmation) {
          toast({
            title: "Account created successfully! 🎉",
            description: "Welcome to COVION! Please check your email to verify your account before accessing the dashboard.",
          })
          // Redirect to login page if email confirmation is needed
          router.push("/login")
        } else {
          toast({
            title: "Account created successfully! 🎉",
            description: "Welcome to COVION! Redirecting you to your dashboard...",
          })
          // Redirect to dashboard if email is already confirmed
          router.push("/dashboard")
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      
      let errorMessage = "An error occurred while creating your account. Please try again."
      
      if (error.message?.includes('already registered')) {
        errorMessage = "An account with this email already exists. Please try logging in instead."
      } else if (error.message?.includes('invalid email')) {
        errorMessage = "Please enter a valid email address."
      } else if (error.message?.includes('weak password')) {
        errorMessage = "Password is too weak. Please choose a stronger password."
      }

      toast({
        title: "Sign-up failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-[#8e2de2] text-white">
          <CardTitle className="text-2xl font-bold">Sign Up for COVION</CardTitle>
          <CardDescription className="text-gray-200">Create your account to start streaming</CardDescription>
        </CardHeader>
        <CardContent className="bg-card glass p-6 rounded-b-lg">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription">Subscription Plan</Label>
              <Select value={subscription} onValueChange={setSubscription} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free - 720p, 1 device, with ads</SelectItem>
                  <SelectItem value="standard">Standard - 1080p, 2 devices, no ads ($5/month)</SelectItem>
                  <SelectItem value="premium">Premium - 4K, 4 devices, no ads ($10/month)</SelectItem>
                  <SelectItem value="family">Family - 4K, 5 devices, no ads ($15/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-[#8e2de2] text-white hover:from-primary/90 hover:to-[#8e2de2]/90"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center bg-card glass">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

