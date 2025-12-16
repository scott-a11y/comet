import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    
    const where = buildingId ? { shopBuildingId: parseInt(buildingId) } : {}
    
    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        powerSpecs: true,
        dustSpecs: true,
        airSpecs: true,
        preferredZone: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { powerSpecs, dustSpecs, airSpecs, ...equipmentData } = body
    
    const equipment = await prisma.equipment.create({
      data: {
        ...equipmentData,
        ...(powerSpecs && {
          powerSpecs: {
            create: powerSpecs
          }
        }),
        ...(dustSpecs && {
          dustSpecs: {
            create: dustSpecs
          }
        }),
        ...(airSpecs && {
          airSpecs: {
            create: airSpecs
          }
        })
      },
      include: {
        powerSpecs: true,
        dustSpecs: true,
        airSpecs: true
      }
    })
    
    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error('Error creating equipment:', error)
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 })
  }
}
