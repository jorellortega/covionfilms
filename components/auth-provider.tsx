"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type UserRole = "free" | "standard" | "full" | "admin" | "management" | "vip" | "creator"

type User = {
  id: string
  name: string
  email: string
  role: UserRole
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
  { id: "1", name: "Free User", email: "free@example.com", password: "freepass", role: "free" },
  { id: "2", name: "Standard User", email: "standard@example.com", password: "standardpass", role: "standard" },
  { id: "3", name: "Full User", email: "full@example.com", password: "fullpass", role: "full" },
  { id: "4", name: "Admin User", email: "admin@example.com", password: "adminpass", role: "admin" },
  { id: "5", name: "Management User", email: "management@example.com", password: "managementpass", role: "management" },
  { id: "6", name: "VIP User", email: "vip@example.com", password: "vippass", role: "vip" },
  { id: "7", name: "Creator User", email: "creator@example.com", password: "creatorpass", role: "creator" },
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

