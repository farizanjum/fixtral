'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Theme, ThemeContextType } from '@/types'

const ThemeContext = createContext<ThemeContextType | undefined>({
  theme: 'dark',
  toggleTheme: () => {
    // Fallback function - will be replaced by actual provider
    console.warn('ThemeProvider not found, using fallback')
  }
})

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark') // Default to dark mode
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('fixtral-theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Default to dark mode if no saved preference
      setTheme('dark')
      localStorage.setItem('fixtral-theme', 'dark')
    }
    setMounted(true)
  }, [])

  // Update document class and localStorage when theme changes
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
      localStorage.setItem('fixtral-theme', theme)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
