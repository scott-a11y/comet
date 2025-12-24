import { z } from 'zod'

// Match Prisma ShopBuilding model schema
export const createBuildingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  widthFt: z.number().positive('Width must be positive').max(1000),
  depthFt: z.number().positive('Depth must be positive').max(1000),
  ceilingHeightFt: z.number().positive().max(50).optional(),
  hasMezzanine: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  pdfUrl: z.string().url().optional(),
  extractedData: z.any().optional(), // JSON data from AI analysis
})

export const updateBuildingSchema = createBuildingSchema.partial()

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>
