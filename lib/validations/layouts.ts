import { z } from 'zod'

// Match Prisma LayoutInstance model schema
export const createLayoutSchema = z.object({
  shopBuildingId: z.number().int().positive('Shop building ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
})

export const updateLayoutSchema = createLayoutSchema.partial()

export type CreateLayoutInput = z.infer<typeof createLayoutSchema>
export type UpdateLayoutInput = z.infer<typeof updateLayoutSchema>
