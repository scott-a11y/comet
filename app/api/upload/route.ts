import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Accept both PDFs and images
        const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
        const hasValidExtension = validExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
        
        if (!hasValidExtension) {
          throw new Error('Only PDF and image files (PNG, JPG, JPEG, WEBP) are allowed');
        }

        return {
          allowedContentTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true,
          allowOverwrite: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
