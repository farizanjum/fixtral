import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface EditRequest {
  imageUrl: string
  brief: {
    task_type: string
    instructions: string
    objects_to_remove: string[]
    objects_to_add: string[]
    style: string
    mask_needed: boolean
    nsfw_flag: boolean
    additional_instructions?: string
  }
}

interface EditResult {
  success: boolean
  content?: string
  error?: string
  processingTime: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { imageUrl, brief }: EditRequest = await request.json()

    if (!imageUrl || !brief) {
      return NextResponse.json(
        { error: 'Image URL and brief are required' },
        { status: 400 }
      )
    }

    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY!,
    })

    // For Gemini 2.5 Flash Image, we need to fetch the image and convert to base64
    console.log('Fetching image for Gemini 2.5 Flash Image processing...')
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')

    // Determine MIME type
    const mimeType = imageUrl.includes('.png') ? 'image/png' : 'image/jpeg'

    // Create the prompt from brief
    const prompt = [
      brief.instructions,
      brief.style ? `Style: ${brief.style}` : '',
      Array.isArray(brief.objects_to_remove) && brief.objects_to_remove.length
        ? `Remove: ${brief.objects_to_remove.join(', ')}`
        : '',
      Array.isArray(brief.objects_to_add) && brief.objects_to_add.length
        ? `Add: ${brief.objects_to_add.join(', ')}`
        : '',
      brief.additional_instructions || ''
    ].filter(Boolean).join('\n\n')

    console.log('Sending request to Gemini 2.5 Flash Image via OpenRouter...')

    const completion = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash-image-preview:free',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
              }
            }
          ]
        }
      ],
    })

    const content = completion.choices[0]?.message?.content ?? ''

    console.log('Gemini 2.5 Flash Image processing completed')

    return NextResponse.json({
      success: true,
      content,
      processingTime: Date.now() - startTime
    })

  } catch (error) {
    console.error('Error processing image edit:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process image edit',
        processingTime: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint for testing
export async function GET() {
  const testResult: EditResult = {
    success: true,
    content: 'Test edited image content',
    processingTime: 2500
  }

  return NextResponse.json(testResult)
}
