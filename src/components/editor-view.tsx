'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// Using native textarea instead
import { Badge } from '@/components/ui/badge'
import { Download, Wand2, Loader2, Save, Eye, EyeOff, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useImageViewer } from './image-viewer'

// Local Browser Save Utility
class LocalBrowserSave {
  private dbName = 'FixtralHistory'
  private storeName = 'editHistory'
  private db: IDBDatabase | null = null

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => {
        console.error('IndexedDB error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          console.log('IndexedDB object store created')
        }
      }
    })
  }

  async saveToIndexedDB(data: any): Promise<boolean> {
    try {
      if (!this.db) {
        await this.initDB()
      }

      if (!this.db) {
        throw new Error('Failed to initialize IndexedDB')
      }

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.put(data)

        request.onsuccess = () => {
          console.log('Successfully saved to IndexedDB')
          resolve(true)
        }

        request.onerror = () => {
          console.error('Failed to save to IndexedDB:', request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('IndexedDB save error:', error)
      return false
    }
  }

  async loadFromIndexedDB(): Promise<any[]> {
    try {
      if (!this.db) {
        await this.initDB()
      }

      if (!this.db) {
        throw new Error('Failed to initialize IndexedDB')
      }

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const index = store.index('timestamp')
        const request = index.openCursor(null, 'prev') // Most recent first

        const results: any[] = []

        request.onsuccess = () => {
          const cursor = request.result
          if (cursor) {
            results.push(cursor.value)
            cursor.continue()
          } else {
            console.log('Loaded', results.length, 'items from IndexedDB')
            resolve(results)
          }
        }

        request.onerror = () => {
          console.error('Failed to load from IndexedDB:', request.error)
          resolve([])
        }
      })
    } catch (error) {
      console.error('IndexedDB load error:', error)
      return []
    }
  }

  async saveToLocalStorage(data: any): Promise<boolean> {
    try {
      const key = 'fixtral_editHistory'
      const existingData = this.loadFromLocalStorage()
      const updatedData = [data, ...existingData.slice(0, 49)] // Keep last 50 items

      localStorage.setItem(key, JSON.stringify(updatedData))
      console.log('Successfully saved to localStorage')
      return true
    } catch (error) {
      console.error('localStorage save error:', error)
      return false
    }
  }

  loadFromLocalStorage(): any[] {
    try {
      const key = 'fixtral_editHistory'
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('localStorage load error:', error)
      return []
    }
  }

  async saveWithFallback(data: any): Promise<{success: boolean, method: string, downloadUrl?: string}> {
    console.log('Starting comprehensive save process...')

    // Method 1: Try IndexedDB
    try {
      const indexedDBSuccess = await this.saveToIndexedDB(data)
      if (indexedDBSuccess) {
        return { success: true, method: 'IndexedDB' }
      }
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage...', error)
    }

    // Method 2: Try localStorage
    try {
      const localStorageSuccess = await this.saveToLocalStorage(data)
      if (localStorageSuccess) {
        return { success: true, method: 'localStorage' }
      }
    } catch (error) {
      console.warn('localStorage failed, creating download link...', error)
    }

    // Method 3: Create manual download link
    try {
      const downloadUrl = await this.createDownloadLink(data)
      if (downloadUrl) {
        return { success: true, method: 'download', downloadUrl }
      }
    } catch (error) {
      console.error('All save methods failed:', error)
    }

    return { success: false, method: 'failed' }
  }

  async createDownloadLink(data: any): Promise<string | null> {
    try {
      const imageUrl = data.editedImageUrl || data.editedContent
      if (!imageUrl) {
        throw new Error('No image URL found')
      }

      // Create a download link for the image
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `fixtral_edit_${Date.now()}.png`
      link.style.display = 'none'
      document.body.appendChild(link)

      console.log('Created manual download link for image')
      return imageUrl
    } catch (error) {
      console.error('Failed to create download link:', error)
      return null
    }
  }

  async loadAllHistory(): Promise<any[]> {
    console.log('Loading history from all sources...')

    // Try IndexedDB first
    try {
      const indexedDBData = await this.loadFromIndexedDB()
      if (indexedDBData.length > 0) {
        console.log('Loaded from IndexedDB:', indexedDBData.length, 'items')
        return indexedDBData
      }
    } catch (error) {
      console.warn('IndexedDB load failed:', error)
    }

    // Fallback to localStorage
    try {
      const localStorageData = this.loadFromLocalStorage()
      if (localStorageData.length > 0) {
        console.log('Loaded from localStorage:', localStorageData.length, 'items')
        return localStorageData
      }
    } catch (error) {
      console.warn('localStorage load failed:', error)
    }

    console.log('No history data found')
    return []
  }

  clearAllData(): void {
    try {
      // Clear IndexedDB
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        store.clear()
      }

      // Clear localStorage
      localStorage.removeItem('fixtral_editHistory')
      localStorage.removeItem('editHistory')

      console.log('All local data cleared')
    } catch (error) {
      console.error('Failed to clear data:', error)
    }
  }
}

// Global instance
const localBrowserSave = new LocalBrowserSave()

// Export for use in other components
export { localBrowserSave }

interface RedditPost {
  id: string
  title: string
  description: string
  imageUrl: string
  postUrl: string
  created_utc: number
  created_date: string
  author: string
  score: number
  num_comments: number
  subreddit: string
}

interface EditorItem {
  id: string
  post: RedditPost
  analysis: string
  timestamp: string
}

interface EditResult {
  ok: boolean
  postId: string
  analysis: string
  editedContent: string
  method?: string
  hasImageData?: boolean
  generatedImages?: string[]
  timestamp: string
}

export function EditorView() {
  const [currentItem, setCurrentItem] = useState<EditorItem | null>(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editResult, setEditResult] = useState<EditResult | null>(null)
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay'>('side-by-side')
  const [showOriginal, setShowOriginal] = useState(true)
  const [userCredits, setUserCredits] = useState<{ dailyGenerations: number; remainingCredits: number; isAdmin: boolean } | null>(null)
  const [savedItems, setSavedItems] = useState<EditResult[]>([])
  const { showImage } = useImageViewer()

  // Load pending item and user credits from localStorage when component mounts
  useEffect(() => {
    const loadPendingItem = () => {
      console.log('EditorView: Loading pending item...')
      const pendingItemStr = localStorage.getItem('pendingEditorItem')
      console.log('EditorView: Pending item from localStorage:', pendingItemStr)

      if (pendingItemStr) {
        try {
          const pendingItem = JSON.parse(pendingItemStr)
          console.log('EditorView: Parsed pending item:', pendingItem)

          setCurrentItem(pendingItem)
          setEditPrompt(pendingItem.analysis)

          console.log('EditorView: Set current item and edit prompt')

          // Clear the pending item from localStorage
          localStorage.removeItem('pendingEditorItem')
          console.log('EditorView: Cleared pending item from localStorage')
        } catch (error) {
          console.error('EditorView: Error loading pending item:', error)
        }
      } else {
        console.log('EditorView: No pending item found in localStorage')
      }
    }

    const loadUserCredits = async () => {
      const userId = localStorage.getItem('user_id')
      if (userId) {
        try {
          const { DatabaseService } = await import('@/lib/database')
          const { canGenerate, remainingCredits, credits, isAdmin } = await DatabaseService.checkCreditLimit(userId)
          setUserCredits({
            dailyGenerations: credits.dailyGenerations,
            remainingCredits,
            isAdmin
          })
        } catch (error) {
          console.error('Error loading user credits:', error)
        }
      }
    }

    loadPendingItem()
    loadUserCredits()

    // Also listen for storage changes in case item is set from another tab
    const handleStorageChange = (e: StorageEvent) => {
      console.log('EditorView: Storage event received:', {
        key: e.key,
        newValue: e.newValue,
        oldValue: e.oldValue
      })

      if (e.key === 'pendingEditorItem' && e.newValue) {
        console.log('EditorView: Pending item storage event detected, loading...')
        loadPendingItem()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Generate edited image
  const generateEditedImage = async () => {
    if (!currentItem || !editPrompt.trim()) return

    // Check user credits before generation
    const userId = localStorage.getItem('user_id')
    const userEmail = localStorage.getItem('user_email')

    console.log('Generate image - Auth check:', { userId, userEmail })

    if (!userId) {
      console.error('No user ID found - user not signed in')
      alert('Please sign in to generate images!')
      return
    }

    try {
      const { DatabaseService } = await import('@/lib/database')
      const { canGenerate, remainingCredits } = await DatabaseService.checkCreditLimit(userId)

      if (!canGenerate) {
        alert(`You've reached your daily limit of 2 image generations. Come back tomorrow!`)
        return
      }

      setIsEditing(true)
    } catch (error) {
      console.error('Error checking credits:', error)
      alert('Error checking your credits. Please try again.')
      return
    }

    try {
      const response = await fetch('/api/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: currentItem.post.imageUrl,
          changeSummary: editPrompt
        }),
      })

      const result = await response.json()
      console.log('Edit API response:', result)

      if (result.ok) {
        console.log('Edit successful, preparing result data...')

        // Validate result data
        const editedContent = result.edited || result.generatedImages?.[0] || ''
        const hasValidImage = editedContent && (editedContent.startsWith('data:') || editedContent.startsWith('http'))

        if (!hasValidImage) {
          console.warn('No valid image data in result:', { editedContent: editedContent?.substring(0, 50) })
        }

        // Increment user credits for successful generation
        try {
          const { DatabaseService } = await import('@/lib/database')
          await DatabaseService.incrementUserCredits(userId)

          // Update local credit state
          if (userCredits) {
            setUserCredits({
              dailyGenerations: userCredits.dailyGenerations + 1,
              remainingCredits: userCredits.remainingCredits - 1,
              isAdmin: userCredits.isAdmin
            })
          }
        } catch (creditError) {
          console.error('Error updating credits:', creditError)
          // Don't block the generation if credit update fails
        }

        const editResult: EditResult = {
          ok: true,
          postId: currentItem.post.id,
          analysis: editPrompt,
          editedContent: editedContent,
          method: result.method || 'unknown',
          hasImageData: result.hasImageData || false,
          generatedImages: result.generatedImages || [],
          timestamp: result.timestamp || Date.now()
        }

        console.log('Edit result prepared:', {
          postId: editResult.postId,
          hasEditedContent: !!editResult.editedContent,
          method: editResult.method,
          hasImageData: editResult.hasImageData
        })

        setEditResult(editResult)
      } else {
        console.error('Edit failed:', result.error)
      }
    } catch (error) {
      console.error('Error generating edited image:', error)
    }
    setIsEditing(false)
  }

  // Save to history with comprehensive fallback system
  const saveToHistory = async (result: EditResult) => {
    console.log('🚀 Starting comprehensive save to history process...')

    // Get user ID from localStorage (set by auth context)
    const userId = localStorage.getItem('user_id')
    const userEmail = localStorage.getItem('user_email')

    console.log('Save to history - User ID:', userId, 'Email:', userEmail)

    // Double-check that we have valid result data
    if (!result || !result.postId) {
      console.error('❌ Invalid result data for saving:', result)
      alert('Invalid image data. Please try generating the image again.')
      return
    }

    // Create comprehensive data object for all save methods
    const historyItem = {
      id: `history_${Date.now()}`,
      userId: userId || 'anonymous',
      postId: result.postId,
      postTitle: currentItem?.post?.title || 'Generated Image',
      requestText: currentItem?.post?.description || result.analysis || 'AI Generated',
      analysis: result.analysis,
      editPrompt: editPrompt, // Current edited prompt
      originalImageUrl: currentItem?.post?.imageUrl || '',
      editedImageUrl: result.generatedImages?.[0] || result.editedContent || '',
      editedContent: result.editedContent,
      generatedImages: result.generatedImages || [],
      postUrl: currentItem?.post?.postUrl || '',
      method: result.method || 'google_gemini',
      status: 'completed' as const,
      timestamp: Date.now(),
      processingTime: typeof result.timestamp === 'number' ? Date.now() - result.timestamp : 0,
      savedAt: new Date().toISOString(),
      hasImageData: result.hasImageData || false
    }

    console.log('📦 History item created:', historyItem)

    let saveSuccess = false
    let saveMethod = 'failed'
    let downloadUrl: string | undefined

    try {
      // Method 1: Try database save first (if user is authenticated)
      if (userId) {
        console.log('1️⃣ Attempting database save...')
        const { DatabaseService } = await import('@/lib/database')

        const dbHistoryItem = {
          user_id: userId,
          post_id: result.postId,
          post_title: historyItem.postTitle,
          request_text: historyItem.requestText,
          analysis: result.analysis,
          edit_prompt: editPrompt,
          original_image_url: historyItem.originalImageUrl,
          edited_image_url: historyItem.editedImageUrl,
          post_url: historyItem.postUrl,
          method: result.method || 'google_gemini',
          status: 'completed' as const,
          processing_time: historyItem.processingTime
        }

        const dbResult = await DatabaseService.saveEditHistory(dbHistoryItem, userId)
        console.log('✅ Database save result:', dbResult)

        if (dbResult) {
          saveSuccess = true
          saveMethod = 'database'
        }
      } else {
        console.log('⏭️ Skipping database save (user not authenticated)')
      }

      // Method 2: Always try comprehensive local browser save
      console.log('2️⃣ Attempting local browser save...')
      const localSaveResult = await localBrowserSave.saveWithFallback(historyItem)

      if (localSaveResult.success) {
        if (!saveSuccess) {
          saveSuccess = true
          saveMethod = localSaveResult.method
        }
        downloadUrl = localSaveResult.downloadUrl
        console.log(`✅ Local browser save successful via ${localSaveResult.method}`)
      } else {
        console.warn('⚠️ Local browser save failed, but continuing...')
      }

      // Update UI state if we have any successful save
      if (saveSuccess) {
        try {
          setSavedItems(prev => [result, ...prev])
          setCurrentItem(null)
          setEditResult(null)
          setEditPrompt('')

          // Clear the pending item from localStorage to remove notification
          localStorage.removeItem('pendingEditorItem')

          // Dispatch storage event to notify other tabs/windows
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'pendingEditorItem',
            newValue: null,
            oldValue: null,
            storageArea: localStorage
          }))

          console.log('✅ UI state updated successfully and pending item cleared')
        } catch (uiError) {
          console.warn('⚠️ UI state update failed, but data saved:', uiError)
        }

        // Show appropriate success message
        if (saveMethod === 'download') {
          alert('✅ Image generated! Download link created - check your downloads folder.')
        } else {
          alert(`✅ Image saved via ${saveMethod}! You can view it in the History tab.`)
        }
      }

    } catch (error: any) {
      console.error('❌ Critical error in save process:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })

      // Last resort: Try manual download
      try {
        const imageUrl = result.generatedImages?.[0] || result.editedContent
        if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('http'))) {
          console.log('🔄 Creating manual download as last resort...')
          const link = document.createElement('a')
          link.href = imageUrl
          link.download = `fixtral_edit_${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          alert('✅ Manual download initiated! The image generation was successful.')
          return
        }
      } catch (downloadError) {
        console.error('❌ Even manual download failed:', downloadError)
      }

      alert('❌ Unable to save. Image generation was successful, but all save methods failed.')
    }

    console.log(`🎯 Save process completed. Success: ${saveSuccess}, Method: ${saveMethod}`)
  }

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }



  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-12 px-4 bg-gradient-to-b from-transparent via-muted/10 to-transparent">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="relative">
            <Wand2 className="h-12 w-12 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
            AI Image Editor
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Edit prompts and generate AI-enhanced images using Google Gemini 2.5 Flash Image
        </p>

        {/* Credit Status */}
        {userCredits && (
          <div className="mt-6 flex items-center justify-center space-x-4">
            <div className="bg-card/50 backdrop-blur-sm border border-muted/20 rounded-lg px-6 py-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {userCredits.isAdmin ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                      <span className="text-sm font-bold text-purple-600">
                        ADMIN: Unlimited Generations
                      </span>
                    </>
                  ) : (
                    <>
                      <div className={`w-2 h-2 rounded-full ${userCredits.remainingCredits > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">
                        Daily Generations: {userCredits.dailyGenerations}/2
                      </span>
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {userCredits.isAdmin
                    ? 'Admin access - unlimited generations'
                    : userCredits.remainingCredits > 0
                      ? `${userCredits.remainingCredits} remaining today`
                      : 'Limit reached - resets tomorrow'
                  }
                </div>
        </div>
        </div>
          </div>
        )}
      </div>

      {/* Current Item Display */}
      {currentItem ? (
        <div className="space-y-6">
          {/* Post Info */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 shadow-xl">
            <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-full">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold">Ready for Editing</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Modify the AI-generated prompt below and generate your edited image
                  </CardDescription>
                </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-semibold">
                    Step 2: AI Image Generation
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-card p-6 rounded-xl border shadow-sm">
                  <h4 className="font-semibold mb-3 text-card-foreground">{currentItem.post.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {currentItem.post.description}
                  </p>
                  <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <span className="font-medium">By</span> {currentItem.post.author}
                    </span>
                    <span>{new Date(currentItem.post.created_utc * 1000).toLocaleDateString()}</span>
                  </div>
                </div>

                <div
                  className="relative aspect-video overflow-hidden rounded-xl border bg-card shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 group"
                  onClick={() => showImage(
                    currentItem.post.imageUrl,
                    'Original Image',
                    currentItem.post.imageUrl,
                    currentItem.post.postUrl
                  )}
                >
                  <Image
                    src={currentItem.post.imageUrl}
                    alt="Original Reddit image"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Prompt */}
          <Card className="shadow-lg border-muted/20">
            <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-t-lg">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <span>Edit Prompt (Editable)</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Modify this AI-generated prompt to customize your image editing requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full p-4 border border-input rounded-xl resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background text-foreground transition-all duration-200 min-h-[120px]"
                rows={4}
                placeholder="Enter your edit instructions..."
              />
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={generateEditedImage}
              disabled={isEditing || !editPrompt.trim() || (userCredits && !userCredits.isAdmin ? userCredits.remainingCredits <= 0 : false)}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Generating AI Image...
                </>
              ) : userCredits && !userCredits.isAdmin && userCredits.remainingCredits <= 0 ? (
                <>
                  <Wand2 className="mr-3 h-5 w-5" />
                  Daily Limit Reached
                </>
              ) : (
                <>
                  <Wand2 className="mr-3 h-5 w-5" />
                  Generate Edited Image
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Card className="text-center py-20 border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/20 to-muted/10">
          <CardContent className="space-y-6">
            <div className="relative">
              <Wand2 className="mx-auto h-20 w-20 text-muted-foreground/50" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-muted-foreground/20 rounded-full animate-pulse"></div>
            </div>
        <div>
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Items to Edit</h3>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                Go to the Queue tab to analyze a Reddit post and send it here for editing.
          </p>
        </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Result Display */}
      {editResult && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 shadow-xl mobile-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className="p-2 bg-green-500 rounded-full flex-shrink-0 touch-target">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl font-bold mobile-responsive-heading">AI Image Generated Successfully!</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm sm:text-base">
                    Your edited image is ready for download
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-semibold text-xs sm:text-sm flex-shrink-0">
                  Step 3: Image Generated
                </Badge>
              </div>
              <div className="flex-shrink-0">
                <Button
                  onClick={() => saveToHistory(editResult)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mobile-button w-full sm:w-auto"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save to History
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comparison Mode Toggle */}
            <div className="flex justify-center">
              <div className="flex bg-muted p-1 rounded-lg border shadow-sm">
          <Button
                  variant={comparisonMode === 'side-by-side' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setComparisonMode('side-by-side')}
                  className={`rounded-md transition-all duration-200 font-medium ${
                    comparisonMode === 'side-by-side'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
          >
            Side by Side
          </Button>
          <Button
                  variant={comparisonMode === 'overlay' ? 'default' : 'ghost'}
            size="sm"
                  onClick={() => setComparisonMode('overlay')}
                  className={`rounded-md transition-all duration-200 font-medium ${
                    comparisonMode === 'overlay'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  Overlay
          </Button>
        </div>
      </div>

              {comparisonMode === 'side-by-side' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Image */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span>Original Image</span>
                    </h3>
                    {currentItem && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(currentItem.post.imageUrl, 'original.jpg')}
                        className="border-muted-foreground/20 hover:bg-muted/50 transition-all duration-200"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    )}
                    </div>
                  <div
                    className="relative aspect-video overflow-hidden rounded-lg border bg-card cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => currentItem && showImage(
                      currentItem.post.imageUrl,
                      'Original Image',
                      currentItem.post.imageUrl,
                      currentItem.post.postUrl
                    )}
                  >
                    {currentItem && (
                      <Image
                        src={currentItem.post.imageUrl}
                        alt="Original image"
                        fill
                        className="object-cover"
                        unoptimized={currentItem.post.imageUrl?.startsWith('data:')}
                      />
                    )}
                    </div>
                  </div>

                {/* Edited Image */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center space-x-2">
                      <Wand2 className="h-4 w-4 text-primary" />
                      <span>AI-Edited Image</span>
                    </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-muted-foreground/20 hover:bg-muted/50 transition-all duration-200"
                      onClick={() => handleDownload(
                        editResult.generatedImages?.[0] || editResult.editedContent,
                        'ai-edited.jpg'
                      )}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>

                  {editResult.generatedImages && editResult.generatedImages.length > 0 ? (
                    <div className="space-y-4">
                      {editResult.generatedImages.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative aspect-video overflow-hidden rounded-lg border bg-card cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => showImage(
                            imageUrl,
                            `AI Edited Image ${index + 1}`,
                            imageUrl
                          )}
                        >
                          <Image
                            src={imageUrl}
                            alt={`AI-generated edited image ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized={imageUrl?.startsWith('data:')}
                          />
                        </div>
                      ))}
                      <div className="text-center">
                        <p className="text-xs text-green-600">
                          ✨ AI-generated images with SynthID watermarks
                        </p>
                      </div>
                    </div>
                  ) : editResult.editedContent.includes('data:image') ? (
                    <div
                      className="relative aspect-video overflow-hidden rounded-lg border bg-card cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => showImage(
                        editResult.editedContent.match(/data:image[^"']+/)?.[0] || '',
                        'AI Edited Image',
                        editResult.editedContent.match(/data:image[^"']+/)?.[0] || ''
                      )}
                    >
                      <Image
                        src={editResult.editedContent.match(/data:image[^"']+/)?.[0] || ''}
                        alt="AI-generated edited image"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Image generated successfully! Check the download link above.
                      </p>
                    </div>
                  )}
                  </div>
                </div>
              ) : (
              /* Overlay Mode */
                <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowOriginal(!showOriginal)}
                      >
                        {showOriginal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <span className="text-sm">
                    {showOriginal ? 'Showing Original' : 'Showing Edited'}
                      </span>
                    <Button
                      size="sm"
                      variant="outline"
                    onClick={() => handleDownload(
                      showOriginal
                        ? (currentItem?.post.imageUrl || '')
                        : (editResult.generatedImages?.[0] || editResult.editedContent),
                      showOriginal ? 'original.jpg' : 'ai-edited.jpg'
                    )}
                    >
                      <Download className="mr-2 h-4 w-4" />
                    Download Current
                    </Button>
                  </div>

                                <div
                  className="relative aspect-video overflow-hidden rounded-lg border bg-card cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    const imageSrc = showOriginal
                      ? (currentItem?.post.imageUrl || '')
                      : (editResult.generatedImages?.[0] || editResult.editedContent);
                    const imageAlt = showOriginal
                      ? 'Original Image'
                      : 'AI Edited Image';
                    const downloadUrl = showOriginal
                      ? (currentItem?.post.imageUrl || '')
                      : (editResult.generatedImages?.[0] || editResult.editedContent);
                    const externalUrl = showOriginal ? currentItem?.post.postUrl : undefined;

                    showImage(imageSrc, imageAlt, downloadUrl, externalUrl);
                  }}
                >
                    <Image
                    src={showOriginal
                      ? (currentItem?.post.imageUrl || '')
                      : (editResult.generatedImages?.[0] || editResult.editedContent)
                    }
                      alt="Comparison image"
                      fill
                      className="object-cover"
                    />
                  </div>
        </div>
      )}

            {/* Edit Details */}
            <Card className="bg-card/80 backdrop-blur-sm border-muted/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-muted/20 to-transparent">
                <CardTitle className="text-sm font-semibold text-foreground">Edit Details</CardTitle>
          </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="font-medium">
                    {editResult.method === 'google_gemini' ? 'Google Gemini API' :
                     editResult.method === 'base64' ? 'Base64 Upload' : 'Direct URL'}
                  </span>
                    </div>
                <div className="flex justify-between">
                  <span>Generated:</span>
                  <span className="font-medium">{new Date(editResult.timestamp).toLocaleString()}</span>
                  </div>
                {editResult.generatedImages && (
                  <div className="flex justify-between">
                    <span>Images Generated:</span>
                    <span className="font-medium">{editResult.generatedImages.length}</span>
                </div>
              )}
            </CardContent>
          </Card>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
