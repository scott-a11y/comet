import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BuildingCard } from './_components/building-card';

export const dynamic = 'force-dynamic'

async function getBuildings() {
  const buildings = await prisma.shopBuilding.findMany({
    include: {
      _count: {
        select: {
          equipment: true,
          layouts: true,
          zones: true,
          designerLayouts: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  return buildings
}

export default async function BuildingsPage() {
  const buildings = await getBuildings()

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Shop Buildings</h1>
            <p className="text-slate-400">Manage your shop locations and layouts</p>
          </div>
          <Link
            href="/buildings/new"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            + New Building
          </Link>
        </div>

        {buildings.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🏭</div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              No buildings yet
            </h2>
            <p className="text-slate-400 mb-6">
              Create your first building to start planning your shop layout
            </p>
            <Link
              href="/buildings/new"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Create Building
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building) => (
              <BuildingCard key={building.id} building={building} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
