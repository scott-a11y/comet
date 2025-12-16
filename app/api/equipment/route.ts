import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { createEquipmentSchema } from '@/lib/validations/equipment'

export async function GET() {
  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        equipmentType: true,
        powerSpecs: true,
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
    
    // Check if equipment type exists
    const equipmentType = await prisma.equipmentType.findUnique({
      where: { id: validated.equipmentTypeId }
    })
    
    if (!equipmentType) {
      return NextResponse.json(
        { error: 'Equipment type not found' },
        { status: 404 }
      )
    }
    
    // Create equipment
    const equipment = await prisma.equipment.create({
      data: {
        name: validated.name,
        manufacturer: validated.manufacturer,
        model: validated.model,
        equipmentTypeId: validated.equipmentTypeId,
        lengthIn: validated.lengthIn,
        widthIn: validated.widthIn,
        heightIn: validated.heightIn,
        weightLbs: validated.weightLbs,
      },
      include: {
        equipmentType: true,
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
