"use server";

import { z } from "zod";
import { createServerAction } from "zsa";

const startAnalysisSchema = z.object({
  pdfUrl: z.string().url(),
});

const checkStatusSchema = z.object({
  jobId: z.string(),
});

export const startPdfAnalysis = createServerAction()
  .input(startAnalysisSchema)
  .handler(async ({ input }) => {
    try {
      // Call the analyze-pdf API route directly instead of using Trigger.dev
      const response = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/analyze-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl: input.pdfUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start analysis');
      }

      const result = await response.json();

      return {
        success: true,
        jobId: result.jobId || 'direct-analysis',
        data: result.data,
      };
    } catch (error) {
      throw new Error(`Failed to start PDF analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
