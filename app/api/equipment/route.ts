import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createEquipmentSchema } from '@/lib/validations/equipment'

export async function GET() {
  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        powerSpecs: true,
        dustSpecs: true,
        airSpecs: true,
      },
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Equipment fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input with Zod
    const validated = createEquipmentSchema.parse(body)
    
    // Check if shop building exists
    const building = await prisma.shopBuilding.findUnique({
      where: { id: validated.shopBuildingId }
    })
    
    if (!building) {
      return NextResponse.json(
        { error: 'Shop building not found' },
        { status: 404 }
      )
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
    
    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    // Handle Prisma errors
    if (error instanceof Error) {
      console.error('Equipment creation error:', error.message)
      
      // Handle unique constraint violations
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Equipment with this name already exists' },
          { status: 409 }
        )
      }
    }
    
    // Generic error
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to create equipment' },
      { status: 500 }
    )
  }
}
