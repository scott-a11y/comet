import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createLayoutSchema } from '@/lib/validations/layouts'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    
    const where = buildingId ? { shopBuildingId: parseInt(buildingId) } : {}
    
    const layouts = await prisma.layoutInstance.findMany({
      where,
      include: {
        equipmentPositions: {
          include: {
            equipment: true
          }
        },
        _count: {
          select: {
            equipmentPositions: true,
            dustRuns: true,
            airRuns: true,
            circuits: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(layouts)
  } catch (error) {
    console.error('Error fetching layouts:', error)
    return NextResponse.json({ error: 'Failed to fetch layouts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const validated = createLayoutSchema.parse(body)

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

    // Create layout
    const layout = await prisma.layoutInstance.create({
      data: validated
    })

    return NextResponse.json(layout, { status: 201 })
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
      console.error('Layout creation error:', error.message)
    }

    // Generic error
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to create layout' },
      { status: 500 }
    )
  }
}
