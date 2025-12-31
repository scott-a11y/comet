import { z } from 'zod'

// Match Prisma Equipment model schema
export const createEquipmentSchema = z.object({
  shopBuildingId: z.number().int().positive('Shop building ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
  category: z.string().min(1, 'Category is required').max(100),
  widthFt: z.number().positive('Width must be positive').max(1000),
  depthFt: z.number().positive('Depth must be positive').max(1000),
  orientation: z.number().min(0).max(360).default(0),
  requiresDust: z.boolean().default(false),
  requiresAir: z.boolean().default(false),
  requiresHighVoltage: z.boolean().default(false),
})

export const updateEquipmentSchema = createEquipmentSchema.partial()

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>
export type CreateEquipmentFormValues = z.input<typeof createEquipmentSchema>
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>
