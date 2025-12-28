import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createBuildingSchema } from '@/lib/validations/buildings'
import { withRateLimit } from '@/lib/api-middleware'

async function getBuildingsHandler() {
  try {
    const buildings = await prisma.shopBuilding.findMany({
      include: {
        zones: true,
        equipment: {
          include: {
            powerSpecs: true,
            dustSpecs: true,
            airSpecs: true
          }
        },
        utilityPoints: true,
        layouts: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(buildings)
  } catch (error) {
    console.error('Error fetching buildings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buildings' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(getBuildingsHandler)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input with Zod
    const validated = createBuildingSchema.parse(body)

    // Create building
    const building = await prisma.shopBuilding.create({
      data: {
        ...validated,
        // Prisma expects null for optional DB columns when explicitly omitted
        widthFt: validated.widthFt ?? null,
        depthFt: validated.depthFt ?? null,
        ceilingHeightFt: validated.ceilingHeightFt ?? null,
        pdfUrl: validated.pdfUrl ?? null,
        extractedData: validated.extractedData ?? null,
        floorGeometry: (validated as any).floorGeometry ?? null,
        floorScaleFtPerUnit: (validated as any).floorScaleFtPerUnit ?? null,
      }
    })

    return NextResponse.json(building, { status: 201 })
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
      console.error('Building creation error:', error.message)
    }

    // Generic error
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to create building' },
      { status: 500 }
    )
  }
}