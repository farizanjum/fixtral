'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// Progress component will be created inline
import { Wand2, Image as ImageIcon, Clock, User, ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useImageViewer } from './image-viewer'

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

interface AnalysisResult {
  ok: boolean
  postId: string
  originalPost: RedditPost
  analysis: string
  timestamp: string
}

interface EditRequest {
  id: string
  post: RedditPost
  status: 'pending' | 'processing' | 'completed' | 'failed'
  analysis?: string
  editForm?: any
  editedImageUrl?: string
  timestamp?: number
}

export function QueueView() {
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [editRequests, setEditRequests] = useState<EditRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzingPostId, setAnalyzingPostId] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const { showImage } = useImageViewer()

  // Fetch Reddit posts
  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reddit/posts')
        const data = await response.json()
      if (data.ok) {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
      setLoading(false)
    }

  // Analyze post with Google Gemini 2.5 Flash
  const analyzePost = async (postId: string) => {
    setAnalyzingPostId(postId)
    try {
      // First, get the post details
      const postResponse = await fetch('/api/reddit/posts')
      const postsData = await postResponse.json()
      const post = postsData.posts.find((p: any) => p.id === postId)

      if (!post) {
        throw new Error('Post not found')
      }

      // Now analyze with Google Gemini 2.5 Flash
      const analysisResponse = await fetch('/api/reddit/posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: post.title,
          description: post.description,
          imageUrl: post.imageUrl
        }),
      })

      const result = await analysisResponse.json()
      if (result.ok) {
        setAnalysisResult({
          ok: true,
          postId: postId,
          originalPost: post,
          analysis: result.changeSummary,
          timestamp: result.timestamp
        })
      } else {
        console.error('Analysis failed:', result.error)
      }
    } catch (error) {
      console.error('Error analyzing post:', error)
    }
    setAnalyzingPostId(null)
  }

  // Send analyzed post to editor (for the new workflow)
  const sendToEditor = (post: RedditPost, analysis: string) => {
    console.log('Sending to editor:', { post, analysis })

    const requestId = `req_${Date.now()}_${post.id}`

    const newRequest: EditRequest = {
      id: requestId,
      post,
      status: 'completed',
      analysis: analysis,
      timestamp: Date.now()
    }

    setEditRequests(prev => [...prev, newRequest])

    // Store in localStorage for the editor to pick up
    const editorData = {
      id: requestId,
      post: post,
      analysis: analysis,
      timestamp: new Date().toISOString()
    }

    console.log('Storing editor data:', editorData)
    localStorage.setItem('pendingEditorItem', JSON.stringify(editorData))

    // Clear analysis result
    setAnalysisResult(null)

    // Force a storage event to trigger tab switch (for same-window navigation)
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pendingEditorItem',
      newValue: JSON.stringify(editorData),
      oldValue: null,
      storageArea: localStorage
    }))

    // Show success message
    alert('Post sent to Editor! The app will switch to the Editor tab automatically.')
  }

  useEffect(() => {
    fetchPosts()


  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 mobile-container">
      {/* Header Section */}
      <div className="text-center py-8 sm:py-16 px-4 bg-gradient-to-b from-transparent via-muted/10 to-transparent mobile-container">
        <div className="flex flex-col items-center justify-center space-y-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-3 sm:space-x-4">
            <div className="relative flex-shrink-0">
              <Wand2 className="h-8 w-8 sm:h-12 sm:w-12 text-primary animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent mobile-responsive-large">
              Fixtral
            </h1>
          </div>
        </div>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed mobile-responsive-text px-4 sm:px-0">
          AI-Powered Reddit Photoshop Assistant - Automated image editing with Google Gemini AI
        </p>

        {/* Workflow Steps */}
        <div className="flex justify-center px-4">
          <div className="flex flex-row items-center justify-center space-x-2 sm:space-x-4 sm:space-x-6 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 p-3 sm:p-6 rounded-2xl border shadow-lg backdrop-blur-sm w-full max-w-md sm:max-w-none mx-auto">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg touch-target">
                1
              </div>
              <span className="text-xs sm:text-sm font-semibold">Analyze</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-muted-foreground px-1 sm:px-2">→</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg touch-target">
                2
              </div>
              <span className="text-xs sm:text-sm font-semibold">Edit</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-muted-foreground px-1 sm:px-2">→</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg touch-target">
                3
              </div>
              <span className="text-xs sm:text-sm font-semibold">Save</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Result Modal */}
      {analysisResult && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 shadow-xl mobile-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="p-2 bg-green-500 rounded-full touch-target">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl font-bold mobile-responsive-heading">Analysis Complete!</CardTitle>
                <CardDescription className="text-muted-foreground text-sm sm:text-base">
                  Google Gemini 2.5 Flash has analyzed the post and generated an edit prompt
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-semibold text-xs sm:text-sm">
                Step 1: AI Analysis Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Original Post */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-foreground flex items-center space-x-2 text-sm sm:text-base">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span>Original Reddit Post</span>
                </h3>
                <div className="space-y-3">
                  <div className="bg-card p-4 sm:p-6 rounded-xl border shadow-sm">
                    <h4 className="font-semibold mb-3 text-card-foreground text-sm sm:text-base line-clamp-2">{analysisResult.originalPost.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                      {analysisResult.originalPost.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1 sm:mr-2" />
                        {analysisResult.originalPost.author}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 sm:mr-2" />
                        {new Date(analysisResult.originalPost.created_utc * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div
                    className="relative aspect-video overflow-hidden rounded-xl border bg-card shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 group touch-target"
                    onClick={() => showImage(
                      analysisResult.originalPost.imageUrl,
                      'Reddit Image',
                      analysisResult.originalPost.imageUrl,
                      analysisResult.originalPost.postUrl
                    )}
                  >
                    <Image
                      src={analysisResult.originalPost.imageUrl}
                      alt="Original Reddit image"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl"></div>
                  </div>
                </div>
              </div>

              {/* Analysis & Actions */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-foreground flex items-center space-x-2 text-sm sm:text-base">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <span>AI-Generated Edit Prompt</span>
                </h3>
                <div className="bg-card p-4 sm:p-6 rounded-xl border shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Wand2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-card-foreground">{analysisResult.analysis}</p>
                    </div>
                  </div>
        </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => sendToEditor(analysisResult.originalPost, analysisResult.analysis)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mobile-button"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Send to Editor
                  </Button>

                  <Button
                    onClick={() => setAnalysisResult(null)}
                    variant="outline"
                    className="flex-1 border-muted-foreground/20 hover:bg-muted/50 font-semibold transition-all duration-200 mobile-button"
                  >
                    Cancel
        </Button>
      </div>

                <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 p-3 sm:p-4 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="p-1 bg-primary/20 rounded-lg">
                      <ExternalLink className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary mb-1">Next Step:</p>
                      <p className="text-sm text-muted-foreground">Switch to the Editor tab to modify the prompt and generate the edited image.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold mobile-responsive-heading">Reddit Posts Queue</h2>
            <p className="text-muted-foreground mobile-responsive-text">
              Latest Photoshop requests from r/PhotoshopRequest
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button onClick={fetchPosts} disabled={loading} className="w-full sm:w-auto mobile-button">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Loader2 className="mr-2 h-4 w-4" />
                  Refresh Posts
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                  <CardTitle className="text-lg leading-tight line-clamp-2">
                    {post.title}
                  </CardTitle>
                    <CardDescription className="flex items-center space-x-4 text-xs">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {post.author}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(post.created_utc * 1000).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View on Reddit
                        </a>
                      </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {post.imageUrl && (
                  <div
                    className="relative aspect-video overflow-hidden rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => showImage(
                      post.imageUrl,
                      'Reddit Image',
                      post.imageUrl,
                      post.postUrl
                    )}
                  >
                  <Image
                      src={post.imageUrl}
                      alt="Post image"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

                {post.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.description}
                </p>
              )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>👍 {post.score}</span>
                    <span>💬 {post.num_comments}</span>
                  </div>

              <Button
                    onClick={() => analyzePost(post.id)}
                    disabled={analyzingPostId === post.id}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {analyzingPostId === post.id ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-3 w-3" />
                        Analyze & Edit
                      </>
                    )}
              </Button>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && !loading && (
          <div className="text-center py-16">
            <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No posts found</h3>
            <p className="text-muted-foreground mt-2">
              Check back later for new Photoshop requests from Reddit
          </p>
        </div>
      )}
      </div>
    </div>
  )
}
