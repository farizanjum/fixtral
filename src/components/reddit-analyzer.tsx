'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

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
  editedContent?: string
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

export default function RedditAnalyzer() {
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzingPostId, setAnalyzingPostId] = useState<string | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [editResult, setEditResult] = useState<EditResult | null>(null)

  // Fetch Reddit posts on component mount
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reddit/posts')
      const data = await response.json()
      if (data.ok) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
    setLoading(false)
  }

  const analyzePost = async (postId: string) => {
    setAnalyzingPostId(postId)
    try {
      // First, get the post details
      const postResponse = await fetch('/api/reddit/posts', {
        method: 'GET',
      })

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

  const executeEdit = async (postId: string, imageUrl: string, prompt: string) => {
    setEditingPostId(postId)
    try {
      const response = await fetch('/api/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          changeSummary: prompt
        }),
      })

      const result = await response.json()
      if (result.ok) {
        console.log('Edit result:', result);
        setEditResult({
          ok: true,
          postId: postId,
          analysis: prompt,
          editedContent: result.edited,
          method: result.method,
          hasImageData: result.hasImageData,
          generatedImages: result.generatedImages,
          timestamp: result.timestamp
        })
      } else {
        console.error('Edit failed:', result.error)
      }
    } catch (error) {
      console.error('Error executing edit:', error)
    }
    setEditingPostId(null)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Fixtral - Reddit AI Image Editor
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Perfect Reddit Photoshop Request Automation
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
            Step 1: Analysis (Google Gemini 2.5 Flash)
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
            Step 2: Edit (Gemini 2.5 Flash Image via OpenRouter)
          </span>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-semibold text-yellow-800 mb-2">🎯 How It Works:</h3>
          <ol className="text-xs text-yellow-700 space-y-1 text-left">
            <li>1. <strong>Analysis:</strong> Google Gemini 2.5 Flash analyzes Reddit post + image → generates concise edit prompt</li>
            <li>2. <strong>Review:</strong> User reviews the generated prompt</li>
            <li>3. <strong>Execute:</strong> Gemini 2.5 Flash Image (via OpenRouter) processes image + prompt → detailed editing instructions</li>
          </ol>
        </div>
      </div>

      {/* Analysis Result Display */}
      {analysisResult && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            🧠 Analysis Complete!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Post */}
            <div>
              <h3 className="font-semibold mb-2">Original Post:</h3>
              <div className="space-y-2">
                <p><strong>Title:</strong> {analysisResult.originalPost.title}</p>
                <p><strong>Description:</strong> {analysisResult.originalPost.description}</p>
                <Image
                  src={analysisResult.originalPost.imageUrl}
                  alt="Original image"
                  width={300}
                  height={200}
                  className="rounded border"
                />
              </div>
            </div>

            {/* Analysis & Edit Button */}
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                    ✅ Analysis Complete
                  </span>
                  <span className="text-xs text-gray-600">via Google Gemini 2.5 Flash (Official API)</span>
                </div>
                <h3 className="font-semibold mb-2">Generated Edit Prompt:</h3>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm leading-relaxed">{analysisResult.analysis}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => executeEdit(
                    analysisResult.postId,
                    analysisResult.originalPost.imageUrl,
                    analysisResult.analysis
                  )}
                  disabled={editingPostId === analysisResult.postId}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                  {editingPostId === analysisResult.postId ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                      Generating AI Image...
                    </span>
                  ) : (
                    <>
                      🎨 Generate AI Image
                      <span className="text-xs block opacity-90">Gemini 2.5 Flash Image via OpenRouter</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Result Display */}
      {editResult && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-green-800">
              🎨 AI Image Generated Successfully!
            </h2>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
              Step 2: AI Image Generation Complete
            </span>
            <span className="text-xs text-gray-600">
              via Gemini 2.5 Flash Image ({editResult.method === 'base64' ? 'Base64' : 'Direct URL'})
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generated Image Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                🎨 AI-Generated Edited Image
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  SynthID Watermarked
                </span>
              </h3>

              <div className="bg-white p-4 rounded border">
                {/* Display all generated images */}
                {editResult.generatedImages && editResult.generatedImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editResult.generatedImages.map((imageUrl, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">
                            Generated Image {index + 1}
                          </h4>
                          <Image
                            src={imageUrl}
                            alt={`AI-generated edited image ${index + 1}`}
                            width={300}
                            height={200}
                            className="w-full rounded border shadow-sm"
                          />
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = imageUrl;
                              link.download = `ai-edited-image-${index + 1}-${Date.now()}.png`;
                              link.click();
                            }}
                            className="w-full px-3 py-2 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                          >
                            💾 Download Image {index + 1}
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 text-center">
                      ✨ AI-generated edited images with SynthID watermarks
                    </p>
                  </div>
                ) : editResult.editedContent.includes('data:image') ? (
                  <div className="space-y-4">
                    <Image
                      src={editResult.editedContent.match(/data:image[^"']+/)?.[0] || ''}
                      alt="AI-generated edited image"
                      width={400}
                      height={300}
                      className="w-full rounded border shadow-sm"
                    />
                    <p className="text-xs text-gray-600 text-center">
                      ✨ AI-generated edited image with SynthID watermark
                    </p>
                  </div>
                ) : editResult.editedContent.includes('http') ? (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Image generated successfully!
                    </p>
                    <Image
                      src={editResult.editedContent.match(/https?:\/\/[^\s]+/)?.[0] || ''}
                      alt="AI-generated edited image"
                      width={400}
                      height={300}
                      className="w-full rounded border shadow-sm"
                    />
                    <p className="text-xs text-gray-600">
                      ✨ AI-generated edited image with SynthID watermark
                    </p>
                  </div>
                ) : (
                  /* Text response fallback */
                  <div className="space-y-4">
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠️ Note:</strong> Model returned text response instead of image.
                        This might be due to model limitations or rate limits.
                      </p>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
                      {editResult.editedContent}
                    </div>
                  </div>
                )}

                {/* Download and Copy functionality */}
                <div className="mt-4 flex gap-2 justify-center">
                  {editResult.editedContent.includes('data:image') && (
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = editResult.editedContent.match(/data:image[^"']+/)?.[0] || '';
                        link.download = `ai-edited-image-${Date.now()}.png`;
                        link.click();
                      }}
                      className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      💾 Download Primary Image
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(editResult.editedContent);
                      alert('Content copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    📋 Copy Content
                  </button>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div>
              <h3 className="font-semibold mb-2">Edit Prompt Used:</h3>
              <div className="bg-white p-3 rounded border mb-4">
                <p className="text-sm leading-relaxed">{editResult.analysis}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🎯 Processing Details:</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="font-medium">
                      {editResult.method === 'google_gemini' ? 'Google Gemini API' :
                       editResult.method === 'base64' ? 'Base64 Upload' : 'Direct URL'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="font-medium">Gemini 2.5 Flash Image</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span className="font-medium">Google Official API</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Images Generated:</span>
                    <span className="font-medium text-green-600">
                      {editResult.generatedImages ? editResult.generatedImages.length : '1'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Watermark:</span>
                    <span className="font-medium text-orange-600">SynthID Applied</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  💡 <strong>AI-Generated Image!</strong> This is a fully edited image created by Gemini 2.5 Flash Image based on the Reddit request. Download it or use it directly!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setEditResult(null);
              setAnalysisResult(null);
            }}
            className="mt-6 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🔄 Start New Analysis
          </button>
        </div>
      )}

      {/* Posts Grid */}
      <div className="mb-6">
        <button
          onClick={fetchPosts}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : '🔄 Refresh Posts'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Fetching fresh posts from r/PhotoshopRequest...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                {post.title}
              </h3>

              <div className="mb-3">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded"
                />
              </div>

              <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                {post.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>by {post.author}</span>
                <span>↑{post.score}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.open(post.postUrl, '_blank')}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                >
                  View on Reddit
                </button>

                <button
                  onClick={() => analyzePost(post.id)}
                  disabled={analyzingPostId === post.id}
                  className="flex-1 px-3 py-2 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:bg-gray-400"
                >
                  {analyzingPostId === post.id ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                      Analyzing...
                    </span>
                  ) : (
                    '🧠 Analyze & Edit'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No posts found. Try refreshing!</p>
        </div>
      )}
    </div>
  )
}
