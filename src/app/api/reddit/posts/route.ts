// src/app/api/reddit/posts/route.ts
export const runtime = 'nodejs'; // ensure Node runtime (Buffer required)

import type { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Dedicated endpoints for the exact workflow
const googleGenAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const googleGeminiModel = googleGenAI ? googleGenAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) : null;

const openRouterClient = process.env.OPENROUTER_API_KEY ? new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
}) : null;

const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const API_BASE = 'https://oauth.reddit.com';

async function getAccessToken() {
  const clientId = process.env.REDDIT_CLIENT_ID?.replace(/"/g, '').trim();
  const clientSecret = process.env.REDDIT_CLIENT_SECRET?.replace(/"/g, '').trim();
  const username = process.env.REDDIT_USERNAME?.replace(/"/g, '').trim();
  const password = process.env.REDDIT_PASSWORD?.replace(/"/g, '');

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Reddit credentials are missing from environment variables');
  }

  const userAgent =
    process.env.REDDIT_USER_AGENT?.replace(/"/g, '').trim() ||
    'windows:com.varnan.wsbmcp:v1.0.0 (by /u/This_Cancel_5950)';

  // EXACTLY matching the working curl command
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
    scope: 'identity,read'
  }).toString();

  // Use the exact same Basic Auth format as curl -u flag
  const authString = `${clientId}:${clientSecret}`;
  const basic = Buffer.from(authString).toString('base64');

  const headers: Record<string, string> = {
    Authorization: `Basic ${basic}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': userAgent,
  };

  // If you have 2FA, uncomment:
  // if (process.env.REDDIT_2FA_CODE) headers['X-Reddit-OTP'] = process.env.REDDIT_2FA_CODE;

  // Add delay to prevent rate limiting - being extra conservative
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay

  const res = await fetch(TOKEN_URL, { method: 'POST', headers, body });

  if (!res.ok) {
    const text = await res.text();

    // DEBUG: show the basic prefix to compare with curl's success header
    console.error('Token call failed. Basic prefix:',
      `Basic ${basic.substring(0, 24)}... (compare to curl log)`);

    throw new Error(`Failed to get access token: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.access_token as string;
}

async function redditGet(path: string, token: string) {
  const userAgent =
    process.env.REDDIT_USER_AGENT ||
    'windows:com.varnan.wsbmcp:v1.0.0 (by /u/Ok-Literature-9189)';

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `bearer ${token}`,
      'User-Agent': userAgent,
    },
    // Reddit API is fine with GET; no-cache avoids Next reusing bad responses
    cache: 'no-cache',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reddit API error: ${res.status} ${text}`);
  }
  return res.json();
}

// Analyze Reddit post with Google Gemini 2.5 Flash and generate edit prompt
async function analyzeRedditPost(postData: {
  title: string;
  description: string;
  imageUrl: string;
}) {
  // Fetch the image and convert to base64 for Google Gemini
  const imageResponse = await fetch(postData.imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = Buffer.from(imageBuffer).toString('base64');

  // Determine MIME type from URL or default to jpeg
  const mimeType = postData.imageUrl.includes('.png') ? 'image/png' : 'image/jpeg';

  const analysisPrompt = `
You are an image-edit analyst. Read the title + description + image and return ONE concise instruction paragraph,
strictly describing what to change (no extras, no emojis, no headers). Avoid speculation.

Title: ${postData.title}
Description: ${postData.description || 'No description provided'}

Focus ONLY on technical editing requirements - remove/add objects, color changes, restoration, etc. No emotional context or fluff.
`;

  if (!googleGeminiModel) {
    throw new Error('Gemini API key not configured');
  }

  const { response } = await googleGeminiModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: analysisPrompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          }
        ]
      }
    ]
  });

  // This should be a single sentence/paragraph
  const generatedPrompt = response.text().trim();

  return {
    analysis: generatedPrompt,
    originalPost: postData
  };
}



export async function GET(_req: NextRequest) {
  try {
    console.log('Starting Reddit GET request...');
    const token = await getAccessToken();
    console.log('Token obtained, fetching posts...');

    // Add delay before fetching posts to prevent rate limiting - extra conservative
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay

    const response = await redditGet('/r/PhotoshopRequest/new?limit=50', token);
    console.log('Reddit API response received successfully');

    // Extract and filter posts with images
    const posts = response.data.children.map((child: any) => child.data);

    // Filter posts from last 24 hours and with images
    const oneDayAgo = Date.now() / 1000 - (24 * 60 * 60);

    const imagePosts = posts
      .filter((post: any) => {
        // Check if post has an image
        const hasImage = post.url && (
          post.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
          post.url.includes('i.redd.it') ||
          post.url.includes('i.imgur.com') ||
          post.url.includes('redditmedia') ||
          (post.preview && post.preview.images && post.preview.images.length > 0)
        );

        // Check if post is from last 24 hours
        const isRecent = post.created_utc > oneDayAgo;

        return hasImage && isRecent;
      })
      .map((post: any) => {
        // Get the best image URL available
        let imageUrl = post.url;

        // If it's a gallery post, get the first image
        if (post.is_gallery && post.media_metadata) {
          const firstImageId = Object.keys(post.media_metadata)[0];
          if (post.media_metadata[firstImageId]?.s?.u) {
            imageUrl = post.media_metadata[firstImageId].s.u.replace(/&amp;/g, '&');
          }
        }
        // If it's a crosspost, get the original post's image
        else if (post.crosspost_parent_list && post.crosspost_parent_list.length > 0) {
          const originalPost = post.crosspost_parent_list[0];
          if (originalPost.url && (
            originalPost.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
            originalPost.url.includes('i.redd.it') ||
            originalPost.url.includes('i.imgur.com')
          )) {
            imageUrl = originalPost.url;
          }
        }
        // If post has preview images, use the highest resolution
        else if (post.preview && post.preview.images && post.preview.images.length > 0) {
          const previewImage = post.preview.images[0];
          if (previewImage.source?.url) {
            imageUrl = previewImage.source.url.replace(/&amp;/g, '&');
          }
        }

        return {
          id: post.id,
          title: post.title,
          description: post.selftext || post.title, // Use selftext if available, otherwise title
          imageUrl: imageUrl,
          postUrl: `https://reddit.com${post.permalink}`,
          created_utc: post.created_utc,
          created_date: new Date(post.created_utc * 1000).toISOString(),
          author: post.author,
          score: post.score,
          num_comments: post.num_comments,
          subreddit: post.subreddit,
          thumbnail: post.thumbnail,
          upvote_ratio: post.upvote_ratio
        };
      });

    console.log(`Found ${imagePosts.length} image posts from r/PhotoshopRequest in the last 24 hours`);

    return new Response(JSON.stringify({
      ok: true,
      posts: imagePosts,
      total: imagePosts.length,
        timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Reddit handler error:', err);
    console.error('Stack trace:', err?.stack);

    // Check if it's a rate limiting error
    const isRateLimited = err?.message?.includes('rate limit') ||
                         err?.message?.includes('too many requests') ||
                         err?.message?.includes('429');

    return new Response(
      JSON.stringify({
        ok: false,
        error: String(err?.message || err),
        isRateLimited,
        solution: isRateLimited ?
          "Reddit is rate limiting your requests. Please wait 5-10 minutes and try again. If this persists, consider using a different IP or implementing longer delays between requests." :
          "Check your Reddit API credentials and ensure your app is properly registered.",
        stack: err?.stack,
        envCheck: {
          hasRedditClientId: !!process.env.REDDIT_CLIENT_ID,
          hasRedditClientSecret: !!process.env.REDDIT_CLIENT_SECRET,
          hasRedditUsername: !!process.env.REDDIT_USERNAME,
          hasRedditPassword: !!process.env.REDDIT_PASSWORD,
          hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
          hasOpenRouterApiKey: !!process.env.OPENROUTER_API_KEY
        }
      }),
      { status: isRateLimited ? 429 : 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST endpoint to analyze and process a specific Reddit post
export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();

    if (!postId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Post ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing Reddit post: ${postId}`);

    // First, get the specific post details
    const token = await getAccessToken();
    const postResponse = await redditGet(`/r/PhotoshopRequest/comments/${postId}`, token);

    if (!postResponse || postResponse.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Post not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const post = postResponse[0].data.children[0].data;

    // Extract image URL (similar logic to GET endpoint)
    let imageUrl = post.url;

    // Handle different image types
    if (post.is_gallery && post.media_metadata) {
      const firstImageId = Object.keys(post.media_metadata)[0];
      if (post.media_metadata[firstImageId]?.s?.u) {
        imageUrl = post.media_metadata[firstImageId].s.u.replace(/&amp;/g, '&');
      }
    } else if (post.preview && post.preview.images && post.preview.images.length > 0) {
      const previewImage = post.preview.images[0];
      if (previewImage.source?.url) {
        imageUrl = previewImage.source.url.replace(/&amp;/g, '&');
      }
    }

    // Prepare post data for analysis
    const postData = {
      title: post.title,
      description: post.selftext || post.title,
      imageUrl: imageUrl
    };

        console.log('Analyzing post with LLM...');

    // Step 1: Analyze the post with LLM and generate concise edit prompt
    const analysisResult = await analyzeRedditPost(postData);

    console.log('Generated concise analysis prompt:', analysisResult.analysis);

    return new Response(JSON.stringify({
      ok: true,
      postId: postId,
      originalPost: postData,
      analysis: analysisResult.analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Reddit post analysis error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(err?.message || err),
        postId: null
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Dedicated analysis endpoint using Google Gemini 2.5 Flash
export async function PUT(request: NextRequest) {
  try {
    const { title, description, imageUrl } = await request.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Image URL is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Analyzing with Google Gemini 2.5 Flash...');

    // Fetch the image and convert to base64 for Google Gemini
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // Determine MIME type
    const mimeType = imageUrl.includes('.png') ? 'image/png' : 'image/jpeg';

    const analysisPrompt = `
You are an image-edit analyst. Read the title + description + image and return ONE concise instruction paragraph,
strictly describing what to change (no extras, no emojis, no headers). Avoid speculation.

Title: ${title || 'No title'}
Description: ${description || 'No description provided'}

Focus ONLY on technical editing requirements - remove/add objects, color changes, restoration, etc. No emotional context or fluff.
`;

    if (!googleGeminiModel) {
      throw new Error('Gemini API key not configured');
    }

    const { response } = await googleGeminiModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: analysisPrompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    const changeSummary = response.text().trim();

    console.log('✅ Analysis complete:', changeSummary);

    return new Response(JSON.stringify({
      ok: true,
      changeSummary,
    timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('❌ Analysis error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(err?.message || err)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
