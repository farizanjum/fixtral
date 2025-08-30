'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Check if Supabase is properly configured
const isSupabaseConfigured = supabase && typeof supabase.auth?.getSession === 'function'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only run auth logic if Supabase is configured
    if (!isSupabaseConfigured) {
      console.log('🔄 Supabase not configured, running in localStorage-only mode')
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        // Store user ID and email in localStorage for database service
        if (session?.user?.id) {
          localStorage.setItem('user_id', session.user.id)
          localStorage.setItem('user_email', session.user.email || '')
        } else {
          localStorage.removeItem('user_id')
          localStorage.removeItem('user_email')
        }
      } catch (error) {
        console.warn('Failed to get initial session:', error)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)

        // Update user ID and email in localStorage
        if (session?.user?.id) {
          localStorage.setItem('user_id', session.user.id)
          localStorage.setItem('user_email', session.user.email || '')
        } else {
          localStorage.removeItem('user_id')
          localStorage.removeItem('user_email')
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Authentication not configured') }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Authentication not configured') }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password
    })
    return { error }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('user_id')
      setUser(null)
      setSession(null)
      return
    }
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Authentication not configured') }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`
      }
    })
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
