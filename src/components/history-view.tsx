'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Eye, History as HistoryIcon, Trash2, Save } from 'lucide-react'
import Image from 'next/image'
import { useImageViewer } from './image-viewer'
import { supabase } from '@/lib/supabase'

interface HistoryItem {
  id: string
  postId: string
  postTitle: string
  requestText: string
  status: 'completed' | 'failed'
  originalImageUrl: string
  editedImageUrl?: string
  postUrl?: string
  editForm: any
  timestamp: number
  processingTime?: number
}

export function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [loading, setLoading] = useState(false)
  const { showImage } = useImageViewer()

  // Load history from localStorage on component mount
  useEffect(() => {
    loadHistory()


  }, [])

  const loadHistory = async () => {
    console.log('📚 Loading history from all sources...')
    setLoading(true)

    try {
      const userId = localStorage.getItem('user_id')
      let combinedHistory: HistoryItem[] = []

      // Method 1: Try to load from database if user is authenticated
      if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co') {
        try {
          console.log('1️⃣ Loading from database...')
          const { DatabaseService } = await import('@/lib/database')
          const dbHistory = await DatabaseService.getEditHistory(userId)

          if (dbHistory && dbHistory.length > 0) {
            // Transform database format to component format
            const transformedHistory = dbHistory.map((item: any) => ({
              id: item.id,
              postId: item.post_id,
              postTitle: item.post_title,
              requestText: item.request_text,
              status: item.status,
              originalImageUrl: item.original_image_url,
              editedImageUrl: item.edited_image_url,
              postUrl: item.post_url,
      editForm: {
                task_type: item.edit_form?.task_type || 'other',
                instructions: item.analysis,
                method: item.method
              },
              timestamp: new Date(item.created_at).getTime(),
              processingTime: item.processing_time || 0
            }))

            combinedHistory = [...transformedHistory]
            console.log(`✅ Loaded ${transformedHistory.length} items from database`)
          }
        } catch (dbError) {
          console.warn('⚠️ Database load failed:', dbError)
        }
      }

      // Method 2: Always load from local browser save system
      try {
        console.log('2️⃣ Loading from local browser storage...')
        const { localBrowserSave } = await import('./editor-view')
        const localHistory = await localBrowserSave.loadAllHistory()

        if (localHistory && localHistory.length > 0) {
          // Transform local format to component format
          const transformedLocalHistory: HistoryItem[] = localHistory.map((item: any): HistoryItem => ({
            id: item.id,
            postId: item.postId,
            postTitle: item.postTitle,
            requestText: item.requestText,
            status: item.status as 'completed' | 'failed',
            originalImageUrl: item.originalImageUrl,
            editedImageUrl: item.editedImageUrl || item.editedContent,
            postUrl: item.postUrl,
            editForm: item.editForm || {
              task_type: 'ai_generated',
              instructions: item.analysis || 'AI Generated',
              method: item.method || 'unknown'
            },
            timestamp: item.timestamp,
            processingTime: item.processingTime || 0
          }))

          // Merge with database history, avoiding duplicates by ID
          const existingIds = new Set(combinedHistory.map(item => item.id))
          const uniqueLocalItems = transformedLocalHistory.filter(item => !existingIds.has(item.id))

          combinedHistory = [...combinedHistory, ...uniqueLocalItems]
          console.log(`✅ Loaded ${uniqueLocalItems.length} additional items from local storage`)
        }
      } catch (localError) {
        console.warn('⚠️ Local storage load failed:', localError)
      }

      // Method 3: Legacy localStorage fallback
      try {
        const legacyHistory = localStorage.getItem('editHistory')
        if (legacyHistory) {
          const parsedLegacyHistory = JSON.parse(legacyHistory)

          if (parsedLegacyHistory && parsedLegacyHistory.length > 0) {
            // Avoid duplicates with existing history
            const existingIds = new Set(combinedHistory.map(item => item.id))
            const uniqueLegacyItems = parsedLegacyHistory.filter((item: any) => !existingIds.has(item.id))

            combinedHistory = [...combinedHistory, ...uniqueLegacyItems]
            console.log(`✅ Loaded ${uniqueLegacyItems.length} items from legacy localStorage`)
          }
        }
      } catch (legacyError) {
        console.warn('⚠️ Legacy localStorage load failed:', legacyError)
      }

      // Sort by timestamp (most recent first) and limit to last 100 items
      combinedHistory.sort((a, b) => b.timestamp - a.timestamp)
      const limitedHistory = combinedHistory.slice(0, 100)

      setHistory(limitedHistory)
      console.log(`🎯 History loading complete! Total items: ${limitedHistory.length}`)

    } catch (error) {
      console.error('❌ Critical error loading history:', error)

      // Last resort: Clear corrupted data
      try {
        localStorage.removeItem('editHistory')
        localStorage.removeItem('fixtral_editHistory')
        setHistory([])
        console.log('🧹 Cleared corrupted history data')
      } catch (clearError) {
        console.error('❌ Error clearing corrupted history:', clearError)
      }
    } finally {
      setLoading(false)
    }
  }



  // Delete specific item from history
  const deleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item from history?')) {
      try {
        console.log(`🗑️ Deleting item: ${itemId}`)
        const userId = localStorage.getItem('user_id')

        // Method 1: Delete from database if user is authenticated
        if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co') {
          try {
            const { DatabaseService } = await import('@/lib/database')
            // Note: DatabaseService might not have a delete method, so we'll use direct Supabase call
            const { error } = await supabase
              .from('edit_history')
              .delete()
              .eq('id', itemId)
              .eq('user_id', userId)

            if (error) {
              console.warn('⚠️ Database delete failed:', error)
            } else {
              console.log('✅ Deleted from database')
            }
          } catch (dbError) {
            console.warn('⚠️ Database delete error:', dbError)
          }
        }

        // Method 2: Delete from local browser save system
        try {
          const { localBrowserSave } = await import('./editor-view')
          // We need to delete from both IndexedDB and localStorage
          // Since IndexedDB doesn't have a simple delete by ID without knowing the exact data,
          // we'll reload and filter out the deleted item
          const allData = await localBrowserSave.loadAllHistory()
          const filteredData = allData.filter(item => item.id !== itemId)

          // Clear and resave filtered data
          localBrowserSave.clearAllData()

          // Resave filtered data
          for (const item of filteredData.slice(0, 49)) { // Keep last 50
            await localBrowserSave.saveToLocalStorage(item as any)
            await localBrowserSave.saveToIndexedDB(item as any)
          }

          console.log('✅ Deleted from local browser storage')
        } catch (localError) {
          console.warn('⚠️ Local storage delete failed:', localError)
        }

        // Method 3: Delete from legacy localStorage
        try {
          const legacyData = localStorage.getItem('editHistory')
          if (legacyData) {
            const parsedData = JSON.parse(legacyData)
            const filteredData = parsedData.filter((item: any) => item.id !== itemId)
            localStorage.setItem('editHistory', JSON.stringify(filteredData))
            console.log('✅ Deleted from legacy localStorage')
          }
        } catch (legacyError) {
          console.warn('⚠️ Legacy localStorage delete failed:', legacyError)
        }

        // Update UI state
        const updatedHistory = history.filter(item => item.id !== itemId)
        setHistory(updatedHistory)
        if (selectedItem && selectedItem.id === itemId) {
          setSelectedItem(null)
        }

        console.log('✅ Item deleted successfully')
        alert('Item deleted from history!')

      } catch (error) {
        console.error('❌ Error deleting from history:', error)
        alert('Unable to delete item. Please try again.')
      }
    }
  }

  // Clear all history
  const clearHistory = async () => {
    if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      try {
        console.log('🧹 Clearing all history...')
        const userId = localStorage.getItem('user_id')

        // Method 1: Clear from database if user is authenticated
        if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co') {
          try {
            const { error } = await supabase
              .from('edit_history')
              .delete()
              .eq('user_id', userId)

            if (error) {
              console.warn('⚠️ Database clear failed:', error)
            } else {
              console.log('✅ Cleared from database')
            }
          } catch (dbError) {
            console.warn('⚠️ Database clear error:', dbError)
          }
        }

        // Method 2: Clear from local browser save system
        try {
          const { localBrowserSave } = await import('./editor-view')
          localBrowserSave.clearAllData()
          console.log('✅ Cleared from local browser storage')
        } catch (localError) {
          console.warn('⚠️ Local storage clear failed:', localError)
        }

        // Method 3: Clear legacy localStorage
        try {
          localStorage.removeItem('editHistory')
          localStorage.removeItem('fixtral_editHistory')
          console.log('✅ Cleared legacy localStorage')
        } catch (legacyError) {
          console.warn('⚠️ Legacy localStorage clear failed:', legacyError)
        }

        // Update UI state
        setHistory([])
        setSelectedItem(null)

        console.log('🎯 All history cleared successfully!')
        alert('All history cleared successfully!')

      } catch (error) {
        console.error('❌ Error clearing history:', error)
        alert('Unable to clear history. Please try again.')
      }
    }
  }

  const handleDownload = (imageUrl: string, filename: string) => {
    try {
      // Handle base64 data URLs
      if (imageUrl.startsWith('data:')) {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
      } else {
        // For regular URLs, fetch and download as blob
        fetch(imageUrl)
          .then(response => response.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          })
          .catch(err => {
            console.error('Download failed:', err)
            alert('Failed to download image. Please try again.')
          })
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-12 px-4 bg-gradient-to-b from-transparent via-muted/10 to-transparent">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="relative">
            <Save className="h-12 w-12 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
            Saved Images
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Your completed AI-generated image edits, saved and ready for download
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <HistoryIcon className="h-5 w-5 text-primary" />
          </div>
        <div>
            <h2 className="text-2xl font-bold text-card-foreground">Image History</h2>
          <p className="text-muted-foreground">
              {history.length} saved image{history.length !== 1 ? 's' : ''}
          </p>
        </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            className="border-muted-foreground/20 hover:bg-muted/50 transition-all duration-200"
          >
            <HistoryIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {history.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={clearHistory}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
          <Trash2 className="mr-2 h-4 w-4" />
              Clear All
        </Button>
          )}
        </div>
      </div>

      {/* History Grid */}
      {history.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {history.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-muted/20 group">
              <CardHeader className="pb-4 bg-gradient-to-r from-muted/10 to-transparent">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <CardTitle className="text-lg leading-tight line-clamp-2 text-card-foreground group-hover:text-primary transition-colors duration-200">
                      {item.postTitle}
          </CardTitle>
                    <CardDescription className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <HistoryIcon className="h-3 w-3 mr-2" />
                        {formatDate(item.timestamp).date}
                      </span>
                      <span className="flex items-center">
                        <span>{formatDate(item.timestamp).time}</span>
                      </span>
          </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
        </CardHeader>

              <CardContent className="space-y-4">
                {item.originalImageUrl && (
                  <div className="space-y-2">
                    <div
                      className="relative aspect-video overflow-hidden rounded-lg border bg-card cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => showImage(
                        item.originalImageUrl,
                        'Original Image',
                        item.originalImageUrl
                      )}
                    >
                      <Image
                        src={item.originalImageUrl}
                        alt="Original image"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Original</p>
                  </div>
                )}

                {item.editedImageUrl && item.status === 'completed' && (
                  <div className="space-y-2">
                    <div
                      className="relative aspect-video overflow-hidden rounded-lg border bg-card cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => item.editedImageUrl && showImage(
                        item.editedImageUrl,
                        'AI Edited Image',
                        item.editedImageUrl
                      )}
                    >
                      <Image
                        src={item.editedImageUrl}
                        alt="Edited image"
                        fill
                        className="object-cover"
                        unoptimized={item.editedImageUrl?.startsWith('data:')}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">AI Edited</p>
                    </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {item.processingTime && (
                      <span>Processed in {formatTime(item.processingTime)}</span>
                    )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                      variant="outline"
                        onClick={() => setSelectedItem(item)}
                      >
                      <Eye className="mr-2 h-3 w-3" />
                      View
                      </Button>

                      {item.status === 'completed' && item.editedImageUrl && (
                        <Button
                          size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item.editedImageUrl!, `ai-edited-${item.id}.png`)}
                        >
                        <Download className="mr-2 h-3 w-3" />
                        Download
                        </Button>
                      )}

                      {item.postUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(item.postUrl, '_blank')}
                        >
                        <Eye className="mr-2 h-3 w-3" />
                        View Reddit Post
                        </Button>
                      )}

                        <Button
                          size="sm"
                          variant="ghost"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                      <Trash2 className="h-3 w-3" />
                        </Button>
                  </div>
                    </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-20 border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/20 to-muted/10">
          <CardContent className="space-y-6">
            <div className="relative">
              <Save className="mx-auto h-20 w-20 text-muted-foreground/50" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-muted-foreground/20 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Saved Images Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                Complete the workflow in the Queue and Editor tabs to save your AI-generated images here
              </p>
            </div>
        </CardContent>
      </Card>
      )}

      {/* Selected Item Details Modal */}
      {selectedItem && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <Eye className="h-6 w-6 text-white" />
              </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold">Image Details</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    View and download your saved AI-generated image
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="border-muted-foreground/20 hover:bg-muted/50 transition-all duration-200"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">{selectedItem.postTitle}</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original Request */}
              <div className="space-y-4">
                <h4 className="font-semibold text-green-800">Original Request</h4>
                <div className="bg-card p-4 rounded-lg border">
                  <p className="text-sm leading-relaxed">{selectedItem.requestText}</p>
            </div>

                {/* Original Image */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Original Image</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(selectedItem.originalImageUrl, 'original.jpg')}
                    >
                      <Download className="mr-2 h-3 w-3" />
                      Download
                    </Button>

                    {selectedItem.postUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedItem.postUrl, '_blank')}
                      >
                      <Eye className="mr-2 h-3 w-3" />
                      View Reddit Post
                      </Button>
                    )}
                </div>
                  <div
                    className="relative aspect-video overflow-hidden rounded-lg border bg-card cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => showImage(
                      selectedItem.originalImageUrl,
                      'Original Image',
                      selectedItem.originalImageUrl
                    )}
                  >
                    <Image
                      src={selectedItem.originalImageUrl}
                      alt="Original"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* AI Interpretation & Result */}
              <div className="space-y-4">
                <h4 className="font-semibold text-green-800">AI Processing</h4>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="space-y-2">
                    <Badge variant="outline">{selectedItem.editForm.task_type}</Badge>
                    <p className="text-sm">{selectedItem.editForm.instructions}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Method: {selectedItem.editForm.method || 'Google Gemini'}</span>
                      {selectedItem.processingTime && (
                        <span>Processing time: {formatTime(selectedItem.processingTime)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedItem.status === 'completed' && selectedItem.editedImageUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">AI-Edited Image</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(selectedItem.editedImageUrl!, 'ai-edited.jpg')}
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Download
                      </Button>

                      {selectedItem.postUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(selectedItem.postUrl, '_blank')}
                        >
                        <Eye className="mr-2 h-3 w-3" />
                        View Reddit Post
                        </Button>
                      )}
                    </div>
                    <div
                      className="relative aspect-video overflow-hidden rounded-lg border bg-card cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => selectedItem.editedImageUrl && showImage(
                        selectedItem.editedImageUrl,
                        'AI Edited Image',
                        selectedItem.editedImageUrl
                      )}
                    >
                      <Image
                        src={selectedItem.editedImageUrl}
                        alt="Edited"
                        fill
                        className="object-cover"
                        unoptimized={selectedItem.editedImageUrl?.startsWith('data:')}
                      />
                    </div>
                    <p className="text-xs text-green-600 text-center">
                      ✨ AI-generated image with SynthID watermark
                    </p>
                  </div>
                ) : selectedItem.status === 'failed' ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                  Processing failed. The AI was unable to complete this edit request.
                </p>
              </div>
                ) : null}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-card p-4 rounded-lg border">
              <h4 className="font-medium mb-3">Processing Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusBadge(selectedItem.status)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Processed</p>
                  <p className="font-medium">{formatDate(selectedItem.timestamp).date}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(selectedItem.timestamp).time}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Post ID</p>
                  <p className="font-medium font-mono text-xs">{selectedItem.postId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {selectedItem.processingTime ? formatTime(selectedItem.processingTime) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
