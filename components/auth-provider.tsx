"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type UserRole = "admin" | "management" | "creator" | "user"
type SubscriptionTier = "free" | "standard" | "premium" | "family"

type User = {
  id: string
  name: string
  email: string
  role: UserRole
  subscription: SubscriptionTier
  subscriptionExpiry?: Date
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
})

const users: (User & { password: string })[] = [
  { 
    id: "1", 
    name: "Admin User", 
    email: "admin@example.com", 
    password: "adminpass", 
    role: "admin",
    subscription: "premium"
  },
  { 
    id: "2", 
    name: "Management User", 
    email: "management@example.com", 
    password: "managementpass", 
    role: "management",
    subscription: "premium"
  },
  { 
    id: "3", 
    name: "Creator User", 
    email: "creator@example.com", 
    password: "creatorpass", 
    role: "creator",
    subscription: "premium"
  },
  { 
    id: "4", 
    name: "Free User", 
    email: "free@example.com", 
    password: "freepass", 
    role: "user",
    subscription: "free"
  },
  { 
    id: "5", 
    name: "Standard User", 
    email: "standard@example.com", 
    password: "standardpass", 
    role: "user",
    subscription: "standard"
  },
  { 
    id: "6", 
    name: "Premium User", 
    email: "premium@example.com", 
    password: "premiumpass", 
    role: "user",
    subscription: "premium"
  },
  { 
    id: "7", 
    name: "Family User", 
    email: "family@example.com", 
    password: "familypass", 
    role: "user",
    subscription: "family"
  }
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (email: string, password: string) => {
    const foundUser = users.find((u) => u.email === email && u.password === password)
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem("user", JSON.stringify(userWithoutPassword))
    } else {
      throw new Error("Invalid email or password")
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

