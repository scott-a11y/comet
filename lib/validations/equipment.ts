import { z } from 'zod'

export const createEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  manufacturer: z.string().max(200).optional().nullable(),
  model: z.string().max(200).optional().nullable(),
  equipmentTypeId: z.string().uuid('Invalid equipment type'),
  lengthIn: z.number().positive('Length must be positive').max(10000),
  widthIn: z.number().positive('Width must be positive').max(10000),
  heightIn: z.number().positive('Height must be positive').max(10000),
  weightLbs: z.number().positive().max(50000).optional().nullable(),
})

export const updateEquipmentSchema = createEquipmentSchema.partial()

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>
