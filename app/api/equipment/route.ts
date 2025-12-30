import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma';
import { createEquipmentSchema } from '@/lib/validations/equipment';
import { withAuth } from '@/lib/auth-middleware';
import { apiSuccess, apiError } from '@/lib/api-response';

export const GET = withAuth(async (userId: string) => {
  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        powerSpecs: true,
        dustSpecs: true,
        airSpecs: true,
      },
      orderBy: { name: 'asc' },
    })
    
    return apiSuccess(equipment)
  } catch (error) {
    console.error('Equipment fetch error:', error)
    return apiError('Failed to fetch equipment', 500)
  }
})

export const POST = withAuth(async (userId: string, request: Request) => {
  try {
    const body = await request.json()
    
    // Validate input with Zod
    const validated = createEquipmentSchema.parse(body)
    
    // Check if shop building exists
    const building = await prisma.shopBuilding.findUnique({
      where: { id: validated.shopBuildingId }
    })
    
    if (!building) {
      return apiError('Shop building not found', 404)
    }
    
    // Create equipment
    const equipment = await prisma.equipment.create({
      data: {
        shopBuildingId: validated.shopBuildingId,
        name: validated.name,
        category: validated.category,
        widthFt: validated.widthFt,
        depthFt: validated.depthFt,
        orientation: validated.orientation,
        requiresDust: validated.requiresDust,
        requiresAir: validated.requiresAir,
        requiresHighVoltage: validated.requiresHighVoltage,
      },
      include: {
        powerSpecs: true,
        dustSpecs: true,
        airSpecs: true,
      },
    })
    
    return apiSuccess(equipment, 201)
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          })),
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    // Handle Prisma errors
    if (error instanceof Error) {
      console.error('Equipment creation error:', error.message)
      
      // Handle unique constraint violations
      if (error.message.includes('Unique constraint')) {
        return apiError('Equipment with this name already exists', 409)
      }
    }
    
    // Generic error
    console.error('Unexpected error:', error)
    return apiError('Failed to create equipment', 500)
  }
})
