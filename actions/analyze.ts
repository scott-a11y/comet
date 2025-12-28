"use server";

import { z } from "zod";
import { createServerAction } from "zsa";
import OpenAI from "openai";
import { fromPath } from "pdf2pic";
import fs from "fs/promises";
import path from "path";
import os from "os";

const startAnalysisSchema = z.object({
  pdfUrl: z.string().url(),
  buildingId: z.number().optional(),
});

const checkStatusSchema = z.object({
  jobId: z.string(),
});

async function convertPdfToImage(pdfUrl: string): Promise<string> {
  console.log('[PDF Conversion] Starting conversion for:', pdfUrl);
  
  // Download PDF to temp file
  const response = await fetch(pdfUrl);
  const buffer = await response.arrayBuffer();
  const tempDir = os.tmpdir();
  const tempPdfPath = path.join(tempDir, `pdf-${Date.now()}.pdf`);
  
  await fs.writeFile(tempPdfPath, Buffer.from(buffer));
  console.log('[PDF Conversion] PDF downloaded to:', tempPdfPath);
  
  try {
    // Convert first page to image
    const options = {
      density: 300, // DPI for quality
      saveFilename: `page-${Date.now()}`,
      savePath: tempDir,
      format: "png",
      width: 2000,
      height: 2000,
    };
    
    const convert = fromPath(tempPdfPath, options);
    const result = await convert(1, { responseType: "base64" });
    
    console.log('[PDF Conversion] Conversion complete');
    
    // Clean up temp PDF
    await fs.unlink(tempPdfPath).catch(() => {});
    
    // Ensure we have valid base64 data
    const base64Data = result.base64 || result;
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error('Failed to extract base64 data from PDF conversion');
    }
    
    // Return base64 data URL (remove any existing data: prefix if present)
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    return `data:image/png;base64,${cleanBase64}`;
  } catch (error) {
    // Clean up on error
    await fs.unlink(tempPdfPath).catch(() => {});
    throw error;
  }
}

export const startPdfAnalysis = createServerAction()
  .input(startAnalysisSchema)
  .handler(async ({ input }) => {
    console.log('[PDF Analysis] Starting analysis for:', input.pdfUrl);
    
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.error('[PDF Analysis] OpenAI API key not configured');
        throw new Error("OpenAI API key not configured");
      }

      console.log('[PDF Analysis] Creating OpenAI client...');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Convert PDF to image if needed
      let imageUrl = input.pdfUrl;
      const isPdf = input.pdfUrl.toLowerCase().includes('.pdf');
      
      if (isPdf) {
        console.log('[PDF Analysis] Converting PDF to image...');
        imageUrl = await convertPdfToImage(input.pdfUrl);
      }

      console.log('[PDF Analysis] Calling OpenAI Vision API...');
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Analyze this floor plan image. Extract width, length (in feet) and provide a summary. Return JSON only with keys: width, length, height (optional), summary."
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { 
                  url: imageUrl,
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

      console.log('[PDF Analysis] OpenAI response received');
      const content = response.choices[0].message.content;
      if (!content) {
        console.error('[PDF Analysis] No content in OpenAI response');
        throw new Error("No analysis returned from OpenAI");
      }

      const data = JSON.parse(content);
      console.log('[PDF Analysis] Successfully parsed data:', data);

      return {
        success: true,
        jobId: `analysis-${Date.now()}`,
        data,
      };
    } catch (error) {
      console.error('[PDF Analysis] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`PDF analysis failed: ${errorMessage}`);
    }
  });

export const checkAnalysisStatus = createServerAction()
  .input(checkStatusSchema)
  .handler(async ({ input }) => {
    try {
      // In Trigger.dev v3, we need to use the handle approach
      // For now, we'll use a simple polling mechanism
      // This would typically be handled by Trigger.dev's webhook or subscription system

      // For development, we'll use a mock approach until the real API is confirmed
      return {
        status: "PENDING",
        data: null,
      };
    } catch (error) {
      return {
        status: "FAILED",
        data: null,
      };
    }
  });
