'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { AuthModal } from '@/components/auth-modal'
import { useAuth } from '@/lib/auth-context'
import { Wand2, Sparkles, ArrowRight, Zap, Shield, Users, Star, Twitter, Database, User } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, loading } = useAuth()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mobile-safe-top">
        <div className="container mx-auto px-4 py-4 mobile-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Wand2 className="h-8 w-8 text-primary animate-pulse" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mobile-responsive-heading">
                  Fixtral
                </h1>
                <span className="text-xs text-muted-foreground hidden sm:block">AI Photoshop Assistant</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {!loading && (
                user ? (
                  <UserMenu />
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center space-x-2 mobile-button touch-target"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                )
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 pb-20 sm:pb-32 px-4 overflow-hidden mobile-safe-top">
        {/* Self-Hosted Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/bg.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40 z-10"></div>
        </div>
        <div className="container mx-auto text-center relative z-10 mobile-container">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
              {/* Logo Container with Maximum Z-Index Priority */}
              <div className="relative z-[100]">
                <Wand2 className="h-12 w-12 sm:h-16 sm:w-16 text-primary animate-pulse relative z-[99]" />
                <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce z-[999] pointer-events-none" />
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent mobile-large-heading drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                Fixtral
              </h1>
            </div>

            <p className="text-lg sm:text-xl md:text-2xl text-white max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4 sm:px-0 mobile-responsive-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Revolutionize your image editing with AI-powered Photoshop assistance.
              Automate edits from Reddit's r/PhotoshopRequest using Google Gemini AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 px-4 sm:px-0">
              {user ? (
                <Link href="/app">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-200 mobile-button w-full sm:w-auto"
                  >
                    <Wand2 className="mr-2 h-5 w-5" />
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-bold px-6 sm:px-10 py-3 sm:py-4 shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 mobile-button w-full sm:w-auto"
                  style={{ animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                >
                  <Zap className="mr-2 sm:mr-3 h-5 w-5" />
                  <span className="text-sm sm:text-base">🚀 Try for FREE - 2 Generations Daily!</span>
                  <ArrowRight className="ml-2 sm:ml-3 h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-4 sm:left-10 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full blur-xl animate-pulse z-20"></div>
        <div className="absolute bottom-20 right-4 sm:right-10 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000 z-20"></div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 mobile-container">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 mobile-responsive-large">Powerful AI-Powered Editing</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mobile-responsive-text">
              Experience the future of image editing with our advanced AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-6 rounded-xl bg-card/50 border shadow-lg hover:shadow-xl transition-all duration-300 mobile-card touch-target">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Generate edited images in seconds using Google Gemini 2.5 Flash Image Preview
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 rounded-xl bg-card/50 border shadow-lg hover:shadow-xl transition-all duration-300 mobile-card touch-target">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Your images and data are processed securely with enterprise-grade security
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 rounded-xl bg-card/50 border shadow-lg hover:shadow-xl transition-all duration-300 mobile-card touch-target">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Community Driven</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Powered by Reddit's r/PhotoshopRequest community for real-world editing challenges
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 rounded-xl bg-card/50 border shadow-lg hover:shadow-xl transition-all duration-300 mobile-card touch-target">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Cloud Storage</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Supabase-powered cloud storage with user accounts and cross-device synchronization
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-20 px-4 bg-muted/10 mobile-container">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 mobile-responsive-large">How It Works</h2>
            <p className="text-lg sm:text-xl text-muted-foreground mobile-responsive-text">
              Three simple steps to professional image editing
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-8">
            <div className="text-center mobile-card">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 shadow-lg touch-target">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Analyze</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                AI analyzes Reddit posts and generates detailed edit instructions
              </p>
            </div>

            <div className="text-center mobile-card">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 shadow-lg touch-target">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Edit</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Customize prompts and generate AI-enhanced images instantly
              </p>
            </div>

            <div className="text-center mobile-card">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 shadow-lg touch-target">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Save</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Download your edits and build a portfolio of AI-generated images
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 mobile-container">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 mobile-responsive-large">Ready to Transform Your Images?</h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 mobile-responsive-text">
              Join thousands of creators using AI to enhance their visual content
            </p>

            <Link href="/app">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold px-6 sm:px-8 py-3 sm:py-3 shadow-lg hover:shadow-xl transition-all duration-300 mobile-button w-full sm:w-auto">
                <Wand2 className="mr-2 h-5 w-5" />
                Launch Fixtral
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 mobile-safe-bottom relative z-0">
        <div className="container mx-auto px-4 py-6 sm:py-8 mobile-container">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Wand2 className="h-6 w-6 text-primary" />
              <span className="font-semibold">Fixtral</span>
              <span className="text-sm text-muted-foreground">v0.2.0</span>
            </div>

            <div className="flex space-x-4 sm:space-x-6">
              <a
                href="https://www.x.com/anjumfariz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors touch-target p-2 rounded-lg hover:bg-muted/50"
                aria-label="Follow us on X (Twitter)"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/farizanjum"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors touch-target p-2 rounded-lg hover:bg-muted/50"
                aria-label="Connect on LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="https://www.github.com/farizanjum"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors touch-target p-2 rounded-lg hover:bg-muted/50"
                aria-label="View source on GitHub"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="text-center mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-sm text-muted-foreground mobile-responsive-text">
            <p>&copy; 2025 Fixtral. Built with Next.js, Tailwind CSS, and Google Gemini AI.</p>
            <p className="mt-2">Made with ❤️ by Fariz Anjum</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          // Redirect to app after successful authentication
          window.location.href = '/app'
        }}
      />
    </div>
  )
}
