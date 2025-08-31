'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QueueView } from '@/components/queue-view'
import { EditorView } from '@/components/editor-view'
import { HistoryView } from '@/components/history-view'
import { ImageViewerProvider } from '@/components/image-viewer'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { AuthModal } from '@/components/auth-modal'
import { useAuth } from '@/lib/auth-context'
import { Wand2, Image, History, Sparkles, ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('queue')
  const [pendingEditorItems, setPendingEditorItems] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, loading } = useAuth()

  // Listen for new editor items and switch to editor tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Dashboard: Storage event received:', {
        key: e.key,
        newValue: e.newValue ? e.newValue.substring(0, 100) + '...' : null,
        oldValue: e.oldValue
      })

      if (e.key === 'pendingEditorItem' && e.newValue) {
        console.log('Dashboard: Switching to editor tab due to pending item')
        setActiveTab('editor')
        updatePendingCount()
      } else if (e.key === 'editHistory') {
        updatePendingCount()
      }
    }

    const updatePendingCount = () => {
      const pendingItem = localStorage.getItem('pendingEditorItem')
      const count = pendingItem ? 1 : 0
      console.log('Dashboard: Updating pending count:', { pendingItem: !!pendingItem, count })
      setPendingEditorItems(count)
    }

    // Initial count
    updatePendingCount()

    window.addEventListener('storage', handleStorageChange)

    // Also check for pending items on mount
    const pendingItem = localStorage.getItem('pendingEditorItem')
    console.log('Dashboard: Initial pending item check:', { pendingItem: !!pendingItem, data: pendingItem ? JSON.parse(pendingItem).post?.title : null })
    if (pendingItem) {
      console.log('Dashboard: Setting initial tab to editor due to existing pending item')
      setActiveTab('editor')
    }

    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Handle tab change with confirmation if there are pending items
  const handleTabChange = (tab: string) => {
    if (tab !== 'editor' && pendingEditorItems > 0) {
      const confirmChange = confirm(
        `You have ${pendingEditorItems} item(s) ready for editing in the Editor tab. Switch to Editor tab to continue?`
      )
      if (confirmChange) {
        setActiveTab('editor')
        return
      } else {
        // Clear pending item if user chooses not to go to editor
        localStorage.removeItem('pendingEditorItem')
        setPendingEditorItems(0)
      }
    }
    setActiveTab(tab)
  }

  return (
    <ImageViewerProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mobile-safe-top">
          <div className="container mx-auto px-4 py-3 mobile-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="mr-1 sm:mr-2 mobile-button touch-target">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                </Link>
                <div className="relative">
                  <Wand2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mobile-responsive-heading">
                    Fixtral
                  </h1>
                  <span className="text-xs text-muted-foreground hidden md:block">AI Photoshop Assistant</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-4">
                <div className="hidden lg:flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>v0.2.0</span>
                  <span>•</span>
                  <span>Reddit r/PhotoshopRequest</span>
                </div>
                {!loading && (
                  user ? (
                    <UserMenu />
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setShowAuthModal(true)}
                      className="flex items-center space-x-1 sm:space-x-2 mobile-button touch-target"
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

        {/* Main Content */}
        <main className="container mx-auto px-4 py-4 sm:py-8 mobile-container">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12 p-1 bg-muted/50 backdrop-blur-sm border shadow-lg mobile-tabs">
              <TabsTrigger
                value="queue"
                className="flex items-center justify-center space-x-1 sm:space-x-2 h-8 sm:h-10 rounded-lg font-medium transition-all duration-200 hover:bg-background/50 data-[state=active]:bg-background data-[state=active]:shadow-md touch-target"
              >
                <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Queue</span>
              </TabsTrigger>
              <TabsTrigger
                value="editor"
                className="flex items-center justify-center space-x-1 sm:space-x-2 h-8 sm:h-10 rounded-lg font-medium transition-all duration-200 hover:bg-background/50 data-[state=active]:bg-background data-[state=active]:shadow-md relative touch-target"
              >
                <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Editor</span>
                {pendingEditorItems > 0 && (
                  <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-lg animate-pulse border-2 border-background">
                    {pendingEditorItems}
                  </div>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center justify-center space-x-1 sm:space-x-2 h-8 sm:h-10 rounded-lg font-medium transition-all duration-200 hover:bg-background/50 data-[state=active]:bg-background data-[state=active]:shadow-md touch-target"
              >
                <History className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="mt-4 sm:mt-6 mobile-scroll">
              <QueueView />
            </TabsContent>

            <TabsContent value="editor" className="mt-4 sm:mt-6 mobile-scroll">
              <EditorView />
            </TabsContent>

            <TabsContent value="history" className="mt-4 sm:mt-6 mobile-scroll">
              <HistoryView />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </ImageViewerProvider>
  )
}
