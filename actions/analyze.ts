"use server";

import { z } from "zod";
import { createServerAction } from "zsa";
import OpenAI from "openai";
import { env } from "@/lib/env";

// Input schema for floor plan image analysis
const startAnalysisSchema = z.object({
  imageUrl: z.string().url().refine(
    (url) => {
      try {
        const urlObj = new URL(url);
        // Only allow Vercel Blob storage or localhost for development
        const allowedHosts = [
          'blob.vercel-storage.com',
          'localhost',
          '127.0.0.1'
        ];
        return allowedHosts.some(host => urlObj.hostname.endsWith(host));
      } catch {
        return false;
      }
    },
    { message: 'Image URL must be from Vercel Blob storage' }
  ),
  buildingId: z.number().optional(),
});

// Backward compatibility: accept pdfUrl and transform to imageUrl
const legacyAnalysisSchema = z.object({
  pdfUrl: z.string().url(),
  buildingId: z.number().optional(),
}).transform((data) => ({
  imageUrl: data.pdfUrl,
  buildingId: data.buildingId,
})).pipe(startAnalysisSchema);

// Accept either schema
const analysisInputSchema = z.union([startAnalysisSchema, legacyAnalysisSchema]);

import { analysisDataSchema } from "@/lib/validations/analysis";

export const startFloorPlanAnalysis = createServerAction()
  .input(analysisInputSchema)
  .handler(async ({ input }) => {
    console.log('[Floor Plan Analysis] Starting analysis for:', input.imageUrl);

    try {
      // Validate environment
      if (!env.OPENAI_API_KEY) {
        console.error('[Floor Plan Analysis] OpenAI API key not configured');
        throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.");
      }

      console.log('[Floor Plan Analysis] Creating OpenAI client...');
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
        timeout: 30000, // 30 second timeout
      });

      // Validate file type from URL
      const url = new URL(input.imageUrl);
      const pathname = url.pathname.toLowerCase();
      const validImageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
      const validPdfExtensions = ['.pdf'];
      const isValidImage = validImageExtensions.some(ext => pathname.endsWith(ext));
      const isValidPdf = validPdfExtensions.some(ext => pathname.endsWith(ext));

      if (!isValidImage && !isValidPdf) {
        throw new Error('Please upload an image file (PNG, JPG, JPEG, WEBP) or PDF.');
      }

      let imageUrlToAnalyze = input.imageUrl;

      // If it's a PDF, convert it to an image first
      if (isValidPdf) {
        console.log('[Floor Plan Analysis] PDF detected, converting to image...');

        try {
          // Fetch the PDF
          const pdfResponse = await fetch(input.imageUrl);
          const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

          // Convert to image
          const { convertPdfToImage } = await import('@/lib/pdf');
          const imageDataUrl = await convertPdfToImage(pdfBuffer);

          // Use the data URL directly (GPT-4o supports data URLs)
          imageUrlToAnalyze = imageDataUrl;
          console.log('[Floor Plan Analysis] PDF converted to image successfully');
        } catch (conversionError) {
          console.error('[Floor Plan Analysis] PDF conversion failed:', conversionError);
          throw new Error('Failed to convert PDF to image. Please try uploading as PNG/JPG instead.');
        }
      }

      // If it's a local image (localhost), convert to base64 so OpenAI can access it
      const isLocalhost = ['localhost', '127.0.0.1'].some(host => url.hostname.endsWith(host));

      if (isValidImage && isLocalhost) {
        console.log('[Floor Plan Analysis] Local image detected, converting to base64...');
        try {
          const imageResponse = await fetch(input.imageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch local image: ${imageResponse.statusText}`);
          }
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const base64 = imageBuffer.toString('base64');
          const mimeType = imageResponse.headers.get('content-type') || 'image/png';
          imageUrlToAnalyze = `data:${mimeType};base64,${base64}`;
          console.log('[Floor Plan Analysis] Local image converted to base64 successfully');
        } catch (localError) {
          console.error('[Floor Plan Analysis] Failed to process local image:', localError);
          // We'll throw here because passing localhost to OpenAI is guaranteed to fail
          throw new Error('Failed to process local image for analysis.');
        }
      }

      console.log('[Floor Plan Analysis] Calling OpenAI Vision API...');

      // Add timeout wrapper
      const responsePromise = openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze this floor plan image and extract dimensions, equipment locations, and basic geometry.
Return JSON with the following structure:
- width: number (feet)
- length: number (feet)
- height: number (optional, feet)
- summary: string description
- detectedEquipment: list of machines found (type, x, y coordinates normalized 0-1)
- detectedPorts: list of utility connection points found (type: 'electrical', 'dust', 'pneumatic', and normalized x, y coordinates)
- walls: list of wall segments (startX, startY, endX, endY normalized 0-1)
- doors: list of doors (x, y normalized 0-1, optional width as ratio)
- windows: list of windows (x, y normalized 0-1, optional width as ratio)

Be precise with machine identities: look for table saws, CNC machines, planers, jointers, and workbenches.
If dimensions are clearly marked in the image, use those exact values. Otherwise, estimate based on typical industrial standards.
For walls, approximate the main bounding walls and interior partitions. Ignore minor details.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageUrlToAnalyze,
                  detail: "high"
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.1
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI API request timed out after 30 seconds')), 30000)
      );

      const response = await Promise.race([responsePromise, timeoutPromise]);

      console.log('[Floor Plan Analysis] OpenAI response received');
      const content = response.choices[0]?.message?.content;

      if (!content) {
        console.error('[Floor Plan Analysis] No content in OpenAI response');
        throw new Error("No analysis returned from OpenAI. The model may have failed to process the image.");
      }

      // Parse and validate response
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (parseError) {
        console.error('[Floor Plan Analysis] Failed to parse OpenAI response:', content);
        throw new Error("Invalid response format from OpenAI. Please try again.");
      }

      // Validate data structure
      const validatedData = analysisDataSchema.safeParse(parsedData);
      if (!validatedData.success) {
        console.error('[Floor Plan Analysis] Invalid data structure:', validatedData.error);
        console.error('[Floor Plan Analysis] Received data:', parsedData);
        throw new Error("OpenAI returned incomplete dimensions. Please ensure the image clearly shows the floor plan.");
      }

      console.log('[Floor Plan Analysis] Successfully validated data:', validatedData.data);

      return {
        success: true,
        jobId: `analysis-${Date.now()}`,
        data: validatedData.data,
      };
    } catch (error) {
      console.error('[Floor Plan Analysis] Error:', error);

      // Provide specific error messages
      if (error instanceof Error) {
        // Already has a good error message
        if (error.message.includes('OpenAI') || error.message.includes('upload') || error.message.includes('timeout')) {
          throw error;
        }
        // Wrap unexpected errors with context
        throw new Error(`Floor plan analysis failed: ${error.message}`);
      }

      throw new Error('Floor plan analysis failed due to an unknown error. Please try again.');
    }
  });

// Backward compatibility - keep old name as alias
export const startPdfAnalysis = startFloorPlanAnalysis;
