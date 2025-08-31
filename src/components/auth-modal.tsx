'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import { LogIn, UserPlus, Mail, Lock } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useTheme()
  const { signIn, signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [activeTab, setActiveTab] = useState('signin')
  const [userExistsMessage, setUserExistsMessage] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setUserExistsMessage('') // Clear any previous messages

    const { error } = await signIn(email, password)

    if (error) {
      alert(error.message)
    } else {
      onClose()
      onSuccess?.()
    }

    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setLoading(true)
    setUserExistsMessage('')

    const { error } = await signUp(email, password)

    if (error) {
      // Check if user already exists
      const errorMessage = error.message?.toLowerCase() || ''
      if (errorMessage.includes('already registered') ||
          errorMessage.includes('user already exists') ||
          errorMessage.includes('already been registered') ||
          errorMessage.includes('email already in use')) {

        // Switch to signin tab and show helpful message
        setActiveTab('signin')
        setUserExistsMessage('Account already exists! Please sign in instead.')
        setPassword('') // Clear password for security
        setConfirmPassword('') // Clear confirm password

        // Focus on password field in signin tab
        setTimeout(() => {
          const passwordInput = document.getElementById('signin-password') as HTMLInputElement
          if (passwordInput) passwordInput.focus()
        }, 100)

        setLoading(false)
        return
      }

      // For other errors, show alert as usual
      alert(error.message)
    } else {
      alert('Check your email for the confirmation link!')
      onClose()
      onSuccess?.()
    }

    setLoading(false)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setUserExistsMessage('') // Clear message when switching tabs
  }

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUserExistsMessage('')
      setActiveTab('signin')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md ${theme === 'dark' ? 'bg-card border-muted' : ''}`}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            🚀 Get Started with Fixtral
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign up for FREE and get 2 AI image generations daily!
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            {userExistsMessage && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  {userExistsMessage}
                </p>
              </div>
            )}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>


          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
