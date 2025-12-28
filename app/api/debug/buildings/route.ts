import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/api-middleware'

// Production-safe debug endpoint.
// Returns basic info to confirm which building IDs exist in the current DB.
// NOTE: Keep payload small and avoid leaking secrets.
async function handler() {
  try {
    const buildings = await prisma.shopBuilding.findMany({
      select: { id: true, name: true, createdAt: true },
      orderBy: { id: 'asc' },
      take: 50,
    })

    return NextResponse.json({
      count: buildings.length,
      ids: buildings.map((b) => b.id),
      buildings,
    })
  } catch (error) {
    console.error('debug/buildings error:', error)
    return NextResponse.json({ error: 'Failed to query buildings' }, { status: 500 })
  }
}

export const GET = withRateLimit(handler)
