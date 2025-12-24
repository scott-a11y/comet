import Link from 'next/link'
import { prisma } from '@/lib/prisma'

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
              <Link
                key={building.id}
                href={`/buildings/${building.id}`}
                className="block bg-slate-800 hover:bg-slate-750 rounded-lg p-6 border border-slate-700 hover:border-blue-500 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {building.name}
                  </h3>
                  <div className="text-slate-400 text-sm">
                    {building.widthFt}' × {building.depthFt}'
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-slate-400">
                    <span className="w-6">📦</span>
                    <span>{building._count.equipment} machines</span>
                  </div>
                  <div className="flex items-center text-slate-400">
                    <span className="w-6">🗺️</span>
                    <span>{building._count.zones} zones</span>
                  </div>
                  <div className="flex items-center text-slate-400">
                    <span className="w-6">📐</span>
                    <span>{building._count.layouts} layouts</span>
                  </div>
                </div>
                
                {building.notes && (
                  <p className="mt-4 text-slate-500 text-sm line-clamp-2">
                    {building.notes}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
