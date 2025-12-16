import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    
    const layout = await prisma.layoutInstance.create({
      data: body
    })
    
    return NextResponse.json(layout, { status: 201 })
  } catch (error) {
    console.error('Error creating layout:', error)
    return NextResponse.json({ error: 'Failed to create layout' }, { status: 500 })
  }
}
