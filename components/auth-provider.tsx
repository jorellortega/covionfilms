"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { User as SupabaseUser, Session } from '@supabase/supabase-js'

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
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await loadUserData(session.user)
      }
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUserData(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Get user data from our custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (userError) {
        console.error('Error loading user data:', userError)
        return
      }

      // Get subscription data
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error loading subscription data:', subscriptionError)
      }

      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
        subscription: subscriptionData?.tier as SubscriptionTier || 'free',
        subscriptionExpiry: subscriptionData?.expiry_date ? new Date(subscriptionData.expiry_date) : undefined
      }

      setUser(user)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        await loadUserData(data.user)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password')
      } else if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please check your email and confirm your account before logging in')
      } else {
        throw new Error('Login failed. Please try again.')
      }
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

