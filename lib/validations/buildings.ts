import { z } from 'zod'

const buildingGeometrySchema = z.object({
  version: z.literal(1),
  vertices: z.array(
    z.object({
      id: z.string().min(1),
      x: z.number(),
      y: z.number(),
    })
  ),
  segments: z.array(
    z.object({
      id: z.string().min(1),
      a: z.string().min(1),
      b: z.string().min(1),
    })
  ),
  ringVertexIds: z.array(z.string().min(1)).optional(),
});

// Match Prisma ShopBuilding model schema
export const createBuildingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  widthFt: z.number().positive('Width must be positive').max(1000).optional(),
  depthFt: z.number().positive('Depth must be positive').max(1000).optional(),
  ceilingHeightFt: z.number().positive().max(50).optional(),
  hasMezzanine: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  pdfUrl: z.string().url().optional(),
  extractedData: z.any().optional(), // JSON data from AI analysis
  floorGeometry: buildingGeometrySchema.optional(),
  floorScaleFtPerUnit: z.number().positive().max(1000).optional(),
})

// Note: createBuildingSchema is a ZodEffects (due to superRefine), so .partial() isn't available.
// For now we mirror the old behavior by defining a permissive partial schema.
export const updateBuildingSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  widthFt: z.number().positive().max(1000).optional(),
  depthFt: z.number().positive().max(1000).optional(),
  ceilingHeightFt: z.number().positive().max(50).optional(),
  hasMezzanine: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  pdfUrl: z.string().url().optional(),
  extractedData: z.any().optional(),
  floorGeometry: buildingGeometrySchema.optional(),
  floorScaleFtPerUnit: z.number().positive().max(1000).optional(),
})

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>