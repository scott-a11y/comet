import { z } from "zod";

export const analysisDataSchema = z.object({
    width: z.number().positive(),
    length: z.number().positive(),
    height: z.number().positive().optional(),
    summary: z.string().min(10),
});

export type AnalysisData = z.infer<typeof analysisDataSchema>;
