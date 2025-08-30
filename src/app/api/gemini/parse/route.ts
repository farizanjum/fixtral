import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface ParseRequest {
  title: string
  body?: string
}

interface EditForm {
  task_type: string
  instructions: string
  objects_to_remove: string[]
  objects_to_add: string[]
  style: string
  mask_needed: boolean
  nsfw_flag: boolean
  additional_instructions?: string
}

export async function POST(request: NextRequest) {
  try {
    const { title, body }: ParseRequest = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
You convert Photoshop requests into strict JSON with keys:
task_type, instructions, objects_to_remove, objects_to_add, style, mask_needed, nsfw_flag.

Text:
"${title}${body ? `\n\n${body}` : ''}"
Return ONLY JSON.
`

    const { response } = await model.generateContent(prompt)
    const brief = JSON.parse(response.text())

    return NextResponse.json(brief)

  } catch (error) {
    console.error('Error parsing request with Gemini:', error)
    return NextResponse.json(
      {
        task_type: 'other',
        instructions: 'Error parsing request',
        objects_to_remove: [],
        objects_to_add: [],
        style: 'realistic',
        mask_needed: false,
        nsfw_flag: false
      },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint for testing
export async function GET() {
  const testForm: EditForm = {
    task_type: 'object_removal',
    instructions: 'Remove the background clutter',
    objects_to_remove: ['clutter'],
    objects_to_add: [],
    style: 'realistic',
    mask_needed: true,
    nsfw_flag: false
  }

  return NextResponse.json(testForm)
}
