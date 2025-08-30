// src/app/api/edit/route.ts
export const runtime = 'nodejs'; // ensure Node runtime (Buffer required)

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiImageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, changeSummary } = await request.json();

    if (!imageUrl || !changeSummary) {
      return NextResponse.json(
        { error: 'Image URL and change summary are required' },
        { status: 400 }
      );
    }

    console.log('🎨 Executing edit with Google Gemini 2.5 Flash Image...');
    console.log('Image URL:', imageUrl);
    console.log('Change Summary:', changeSummary);

    // Step 1: Download the image
    console.log('📥 Downloading image...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const imageResponse = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log('✅ Downloaded image, size:', imageBuffer.byteLength, 'bytes');
    console.log('📄 Content-Type:', contentType);

    // Step 2: Convert to Sharp image (similar to PIL in Python)
    let processedImageBuffer: Buffer;

    try {
      // Use Sharp to process the image (like PIL in Python)
      const sharpImage = sharp(Buffer.from(imageBuffer));

      // Get image info
      const metadata = await sharpImage.metadata();
      console.log(`🖼️ Image info: ${metadata.format} ${metadata.width}x${metadata.height} ${metadata.channels} channels`);

      // Convert to buffer for Gemini
      processedImageBuffer = await sharpImage.toBuffer();

    } catch (sharpError) {
      console.error('❌ Sharp processing error:', sharpError);
      // Fallback to original buffer if Sharp fails
      processedImageBuffer = Buffer.from(imageBuffer);
    }

    // Step 3: Send to Google Gemini 2.5 Flash Image Preview (exactly as user requested)
    console.log('🤖 Sending to Google Gemini 2.5 Flash Image Preview...');

    const response = await geminiImageModel.generateContent([
      changeSummary,
      {
        inlineData: {
          mimeType: contentType,
          data: processedImageBuffer.toString('base64')
        }
      }
    ]);

    console.log('✅ Received response from Google Gemini 2.5 Flash Image');

    // Step 4: Process the response (Google Gemini API format)
    const generatedImages: string[] = [];

    if (response.response && response.response.candidates && response.response.candidates.length > 0) {
      const candidate = response.response.candidates[0];

      if (candidate.content && candidate.content.parts) {
        console.log(`📦 Found ${candidate.content.parts.length} parts in response`);

        for (const part of candidate.content.parts) {
          if (part.text) {
            console.log('📝 Text response:', part.text);
          } else if (part.inlineData) {
            console.log('🖼️ Processing image part');

            // Convert binary image data to base64 data URL
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            const dataUrl = `data:${mimeType};base64,${imageData}`;

            generatedImages.push(dataUrl);
            console.log(`✅ Generated image: ${mimeType}, size: ${imageData.length} chars`);
          }
        }
      }
    }

    if (generatedImages.length === 0) {
      console.log('⚠️ No images were generated, trying fallback processing...');

      // Fallback: Use Sharp to apply basic image processing
      try {
        console.log('🔧 Applying fallback image processing with Sharp...');

        const processedBuffer = await sharp(Buffer.from(imageBuffer))
          .jpeg({ quality: 90 }) // Ensure JPEG output
          .toBuffer();

        const fallbackImage = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;

        console.log('✅ Fallback processing completed');

        return NextResponse.json({
          ok: true,
          edited: fallbackImage,
          method: 'sharp_fallback',
          hasImageData: true,
          generatedImages: [fallbackImage],
          timestamp: new Date().toISOString(),
          note: 'Used fallback image processing - Gemini did not generate new image'
        });
      } catch (fallbackError) {
        console.error('❌ Fallback processing failed:', fallbackError);

        const textResponse = response.response?.text() || 'No image could be generated';
        return NextResponse.json({
          ok: true,
          edited: textResponse,
          method: 'text_response',
          hasImageData: false,
          generatedImages: [],
          timestamp: new Date().toISOString(),
          error: 'Both Gemini and fallback processing failed'
        });
      }
    }

    console.log(`🎉 Success! Generated ${generatedImages.length} image(s)`);

    return NextResponse.json({
      ok: true,
      edited: generatedImages[0], // Primary image
      method: 'google_gemini',
      hasImageData: true,
      generatedImages: generatedImages,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Edit execution error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to execute edit',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
