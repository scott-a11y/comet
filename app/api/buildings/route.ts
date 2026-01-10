import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createBuildingSchema } from '@/lib/validations/buildings'
import { withRateLimit } from '@/lib/api-middleware'
import { withAuth } from '@/lib/auth-middleware'
import { apiSuccess, apiError } from '@/lib/api-response'

async function getBuildingsHandler(userId: string) {
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

    return apiSuccess(buildings)
  } catch (error) {
    console.error('Error fetching buildings:', error)
    return apiError('Failed to fetch buildings', 500)
  }
}

// TODO: Re-enable auth after fixing Clerk configuration
// For now, allow unauthenticated access to unblock development
export const GET = withRateLimit(async (request: Request) => {
  const userId = 'dev-user'; // Temporary placeholder
  return getBuildingsHandler(userId);
})

export const POST = withRateLimit(async (request: Request) => {
  try {
    const body = await request.json()

    // Validate input with Zod
    const validated = createBuildingSchema.parse(body)

    // Create building with only fields that exist in database
    const building = await prisma.shopBuilding.create({
      data: {
        name: validated.name,
        widthFt: validated.widthFt ?? null,
        depthFt: validated.depthFt ?? null,
        ceilingHeightFt: validated.ceilingHeightFt ?? null,
        // Note: pdfUrl, extractedData, floorGeometry, floorScaleFtPerUnit
        // are temporarily skipped until database migration is run
      }
    })

    return apiSuccess(building, 201)
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
      console.error('Building creation error:', error.message)
    }

    // Generic error
    console.error('Unexpected error:', error)
    return apiError('Failed to create building', 500)
  }
})