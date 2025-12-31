import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createLayoutSchema } from '@/lib/validations/layouts'
import { withRateLimit } from '@/lib/api-middleware'
import { withAuth } from '@/lib/auth-middleware'
import { apiSuccess, apiError } from '@/lib/api-response'

export const GET = withRateLimit(withAuth(async (userId: string, request: Request) => {
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

    return apiSuccess(layouts)
  } catch (error) {
    console.error('Error fetching layouts:', error)
    return apiError('Failed to fetch layouts', 500)
  }
}))

export const POST = withRateLimit(withAuth(async (userId: string, request: Request) => {
  try {
    const body = await request.json()

    // Validate input with Zod
    const validated = createLayoutSchema.parse(body)

    // Check if shop building exists
    const building = await prisma.shopBuilding.findUnique({
      where: { id: validated.shopBuildingId }
    })

    if (!building) {
      return apiError('Shop building not found', 404)
    }

    // Create layout
    const layout = await prisma.layoutInstance.create({
      data: validated
    })

    return apiSuccess(layout, 201)
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
      console.error('Layout creation error:', error.message)
    }

    // Generic error
    console.error('Unexpected error:', error)
    return apiError('Failed to create layout', 500)
  }
}))
