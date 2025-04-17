"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      toast({
        title: "Login Successful",
        description: "You have been logged in successfully.",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Please check your email and password and try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md overflow-hidden">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="flex justify-center bg-gray-800 rounded-t-lg">
            <TabsTrigger value="login" className="flex-1 py-2 text-center text-white bg-blue-600 hover:bg-blue-500 rounded-tl-lg">Login</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1 py-2 text-center text-white bg-blue-600 hover:bg-blue-500 rounded-tr-lg">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <CardHeader className="bg-gradient-to-r from-primary to-[#8e2de2] text-white">
              <CardTitle className="text-2xl font-bold">
                <span className="text-black">Login to COVION</span>
              </CardTitle>
              <CardDescription className="text-gray-200">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-card glass p-6 rounded-b-lg">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#ff0050] to-[#ff2975] text-white hover:from-[#ff0050]/90 hover:to-[#ff2975]/90"
                >
                  Sign In
                </Button>
              </form>
            </CardContent>
          </TabsContent>
          <TabsContent value="signup">
            <CardHeader className="bg-gradient-to-r from-primary to-[#8e2de2] text-white">
              <CardTitle className="text-2xl font-bold">
                <span className="text-black">Sign Up for COVION</span>
              </CardTitle>
              <CardDescription className="text-gray-200">
                Create a new account
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-card glass p-6 rounded-b-lg">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#ff0050] to-[#ff2975] text-white hover:from-[#ff0050]/90 hover:to-[#ff2975]/90"
                >
                  Sign Up
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

