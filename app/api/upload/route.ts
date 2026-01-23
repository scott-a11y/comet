import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { withRateLimit } from '@/lib/api-middleware';
import { apiError } from '@/lib/api-response';

async function uploadHandler(userId: string, request: NextRequest) {
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
          // Store userId for audit trail
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Upload completed successfully - could log userId from tokenPayload
        console.log(`Upload completed for user: ${tokenPayload}`);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload error:', error);
    return apiError((error as Error).message, 400);
  }
}

// Protected route with auth and rate limiting
export const POST = withRateLimit(withAuth(uploadHandler));
