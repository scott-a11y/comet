import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

async function getBuilding(buildingId: string) {
  const building = await prisma.shopBuilding.findUnique({
    where: { buildingId: parseInt(buildingId) },
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
      layouts: {
        include: {
          _count: {
            select: {
              equipmentPositions: true,
              dustRuns: true,
              airRuns: true,
              circuits: true
            }
          }
        }
      }
    }
  })
  
  if (!building) return null
  return building
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BuildingDetailPage({ params }: PageProps) {
  const { id } = await params
  const building = await getBuilding(buildingId)
  
  if (!building) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/buildings"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            ← Back
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{building.name}</h1>
            <p className="text-slate-400">
              {building.widthFt}' × {building.depthFt}' warehouse
              {building.ceilingHeightFt && ` • ${building.ceilingHeightFt}' ceilings`}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-sm mb-1">Zones</div>
            <div className="text-3xl font-bold text-white">{building.zones.length}</div>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-sm mb-1">Equipment</div>
            <div className="text-3xl font-bold text-white">{building.equipment.length}</div>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-sm mb-1">Utility Points</div>
            <div className="text-3xl font-bold text-white">{building.utilityPoints.length}</div>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-sm mb-1">Layouts</div>
            <div className="text-3xl font-bold text-white">{building.layouts.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Zones Section */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-4">Zones</h2>
            {building.zones.length === 0 ? (
              <p className="text-slate-400">No zones defined yet</p>
            ) : (
              <div className="space-y-3">
                {building.zones.map((zone) => (
                  <div key={zone.id} className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="font-semibold text-white">{zone.name}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      {zone.width}' × {zone.height}' • {zone.zoneType}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Utility Points Section */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-4">Utility Points</h2>
            {building.utilityPoints.length === 0 ? (
              <p className="text-slate-400">No utility points defined yet</p>
            ) : (
              <div className="space-y-3">
                {building.utilityPoints.map((utility) => (
                  <div key={utility.id} className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="font-semibold text-white">{utility.name}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      {utility.type.replace(/_/g, ' ')}
                      {utility.voltage && ` • ${utility.voltage}V`}
                      {utility.phase && ` • ${utility.phase}Φ`}
                      {utility.amps && ` • ${utility.amps}A`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Equipment Section */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Equipment ({building.equipment.length})</h2>
          {building.equipment.length === 0 ? (
            <p className="text-slate-400">No equipment added yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {building.equipment.map((equip) => (
                <div key={equip.id} className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="font-semibold text-white mb-2">{equip.name}</div>
                  <div className="space-y-1 text-sm text-slate-400">
                    <div>📊 {equip.category.replace(/_/g, ' ')}</div>
                    <div>📏 {equip.widthFt}' × {equip.depthFt}'</div>
                    {equip.powerSpecs && (
                      <div>⚡ {equip.powerSpecs.voltage}V, {equip.powerSpecs.amps}A</div>
                    )}
                    {equip.dustSpecs && (
                      <div>🌬️ {equip.dustSpecs.cfmRequirement} CFM</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Layouts Section */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">Layouts</h2>
            <Link
              href={`/buildings/${id}/layouts/new`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              + New Layout
            </Link>
          </div>
          {building.layouts.length === 0 ? (
            <p className="text-slate-400">No layouts created yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {building.layouts.map((layout) => (
                <Link
                  key={layout.id}
                  href={`/buildings/${id}/layouts/${layout.id}`}
                  className="block bg-slate-700/50 hover:bg-slate-700 p-4 rounded-lg transition-colors"
                >
                  <div className="font-semibold text-white mb-2">{layout.name}</div>
                  <div className="space-y-1 text-sm text-slate-400">
                    <div>📦 {layout._count.equipmentPositions} machines placed</div>
                    <div>🌬️ {layout._count.dustRuns} dust runs</div>
                    <div>💨 {layout._count.airRuns} air lines</div>
                    <div>⚡ {layout._count.circuits} circuits</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
