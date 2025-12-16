import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const building = await prisma.shopBuilding.create({
      data: body
    })
    
    return NextResponse.json(building, { status: 201 })
  } catch (error) {
    console.error('Error creating building:', error)
    return NextResponse.json(
      { error: 'Failed to create building' },
      { status: 500 }
    )
  }
}
