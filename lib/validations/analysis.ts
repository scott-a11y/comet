import { z } from "zod";

export const analysisDataSchema = z.object({
    width: z.number().positive(),
    length: z.number().positive(),
    height: z.number().positive().optional(),
    summary: z.string().min(10),
    detectedEquipment: z.array(z.object({
        type: z.string(),
        confidence: z.number().min(0).max(1),
        position: z.object({
            x: z.number(), // Normalized 0-1
            y: z.number(), // Normalized 0-1
        }),
        estimatedDimensions: z.object({
            width: z.number(),
            depth: z.number(),
        }).optional(),
    })).optional(),
    detectedPorts: z.array(z.object({
        type: z.enum(['electrical', 'dust', 'pneumatic']),
        position: z.object({
            x: z.number(),
            y: z.number(),
        }),
    })).optional(),
});

export type AnalysisData = z.infer<typeof analysisDataSchema>;
