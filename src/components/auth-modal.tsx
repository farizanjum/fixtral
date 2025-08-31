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
  const [showEmailVerification, setShowEmailVerification] = useState(false)

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
      // Check if user already exists - comprehensive error detection
      const errorMessage = error.message?.toLowerCase() || ''
      const errorCode = (error as any)?.status || (error as any)?.code || ''

      // Common Supabase error patterns for existing users
      const isUserExistsError =
        errorMessage.includes('already registered') ||
        errorMessage.includes('user already exists') ||
        errorMessage.includes('already been registered') ||
        errorMessage.includes('email already in use') ||
        errorMessage.includes('email address is already registered') ||
        errorMessage.includes('user with this email already exists') ||
        errorMessage.includes('duplicate key value') ||
        errorCode === 422 ||
        errorCode === 400

      if (isUserExistsError) {
        console.log('User already exists detected:', { errorMessage, errorCode })

        // Switch to signin tab and show helpful message
        setActiveTab('signin')
        setUserExistsMessage('Account already exists! Please sign in instead.')
        setPassword('') // Clear password for security
        setConfirmPassword('') // Clear confirm password

        // Focus on password field in signin tab after a brief delay
        setTimeout(() => {
          const passwordInput = document.getElementById('signin-password') as HTMLInputElement
          if (passwordInput) {
            passwordInput.focus()
            // Also select the text for better UX
            passwordInput.select()
          }
        }, 200) // Slightly longer delay to ensure DOM is ready

        setLoading(false)
        return
      }

      // For other errors, show alert as usual
      alert(error.message)
    } else {
      // Don't call onSuccess here - user needs to verify email first
      setShowEmailVerification(true)
      onClose()
      // Note: onSuccess is NOT called here - they need to verify email first
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
      setShowEmailVerification(false)
    }
  }, [isOpen])

  return (
    <>
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

    {/* Email Verification Dialog */}
    <Dialog open={showEmailVerification} onOpenChange={() => setShowEmailVerification(false)}>
      <DialogContent className={`sm:max-w-md ${theme === 'dark' ? 'bg-card border-muted' : ''}`}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-green-600 dark:text-green-400">
            🎉 Account Created Successfully!
          </DialogTitle>
          <DialogDescription className="text-center">
            Please verify your email to start using Fixtral
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Check your email
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  We've sent a verification link to <strong>{email}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Button
              onClick={() => window.open('https://mail.google.com', '_blank')}
              variant="outline"
              className="w-full"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Open Gmail
            </Button>

            <Button
              onClick={() => window.open('https://outlook.live.com', '_blank')}
              variant="outline"
              className="w-full"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.805 10.023c-.55 0-1-.45-1-1V6.006c0-.55-.45-1-1-1h-2.006c-.55 0-1-.45-1-1s.45-1 1-1H20.8c1.1 0 2 .9 2 2v3.017c0 .55-.45 1-1 1z"/>
                <path d="M6.22 8.023c-.55 0-1-.45-1-1V4.006c0-1.1.9-2 2-2h3.017c.55 0 1 .45 1 1s-.45 1-1 1H7.22c-.55 0-1 .45-1 1v3.017c0 .55-.45 1-1 1z"/>
                <path d="M21.805 15.977c-.55 0-1 .45-1 1v3.017c0 .55-.45 1-1 1h-2.006c-.55 0-1 .45-1 1s.45 1 1 1H20.8c1.1 0 2-.9 2-2v-3.017c0-.55-.45-1-1-1z"/>
                <path d="M6.22 17.977c-.55 0-1 .45-1 1v3.017c0 .55-.45 1-1 1s-1-.45-1-1v-3.017c0-1.1.9-2 2-2h3.017c.55 0 1 .45 1 1s-.45 1-1 1H7.22c-.55 0-1-.45-1-1z"/>
                <path d="M17.8 8.023H6.22c-1.1 0-2 .9-2 2v7.954c0 1.1.9 2 2 2H17.8c1.1 0 2-.9 2-2V10.023c0-1.1-.9-2-2-2zm-5.78 7.954c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4.78 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              </svg>
              Open Outlook
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => alert('Resend functionality would be implemented here')}
                className="text-primary hover:underline font-medium"
              >
                click here to resend
              </button>
            </p>
          </div>

          <Button
            onClick={() => setShowEmailVerification(false)}
            className="w-full"
          >
            I've verified my email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
