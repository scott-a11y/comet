import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Allow PDFs, images, and 3D models
        const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.glb', '.gltf'];
        const hasValidExtension = validExtensions.some(ext => pathname.toLowerCase().endsWith(ext));

        if (!hasValidExtension) {
          throw new Error('Only PDF, image files, or 3D models (GLB, GLTF) are allowed');
        }

        return {
          allowedContentTypes: [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/webp',
            'model/gltf-binary',
            'model/gltf+json'
          ],
          maximumSizeInBytes: 30 * 1024 * 1024, // 30MB for 3D models
          addRandomSuffix: true,
          allowOverwrite: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Upload completed successfully - logged via middleware
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
