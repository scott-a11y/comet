"use server";

import { z } from "zod";
import { createServerAction } from "zsa";
import OpenAI from "openai";

const startAnalysisSchema = z.object({
  pdfUrl: z.string().url(),
  buildingId: z.number().optional(),
});

const checkStatusSchema = z.object({
  jobId: z.string(),
});

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

      console.log('[PDF Analysis] Calling OpenAI Vision API...');
      // Analyze the PDF using OpenAI Vision
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
                image_url: { url: input.pdfUrl }
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
