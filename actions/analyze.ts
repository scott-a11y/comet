"use server";

import { z } from "zod";
import { createServerAction } from "zsa";
import { tasks } from "@trigger.dev/sdk/v3";
import { analyzePdfTask } from "@/src/trigger/analyze-pdf";

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
      const handle = await tasks.trigger<typeof analyzePdfTask>(
        "analyze-pdf",
        { pdfUrl: input.pdfUrl }
      );

      return {
        success: true,
        jobId: handle.id,
      };
    } catch (error) {
      throw new Error("Failed to start PDF analysis");
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
