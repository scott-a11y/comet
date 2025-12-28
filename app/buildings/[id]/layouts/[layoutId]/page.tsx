import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

async function getLayout(id: string, layoutId: string) {
  const layout = await prisma.layoutInstance.findUnique({
    where: { 
      id: parseInt(layoutId),
      shopBuildingId: parseInt(id)
    },
    include: {
      shopBuilding: true,
      equipmentPositions: {
        include: {
          equipment: {
            include: {
              powerSpecs: true,
              dustSpecs: true
            }
          }
        }
      }
    }
  })
  
  if (!layout) return null
  return layout
}

interface PageProps {
  params: Promise<{ id: string; layoutId: string }>
}

export default async function LayoutCanvasPage({ params }: PageProps) {
  const { id, layoutId } = await params
  const layout = await getLayout(id, layoutId)
  
  if (!layout) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/buildings/${id}`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            ← Back
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{layout.name}</h1>
            <p className="text-slate-400">
              {layout.shopBuilding.name} • {layout.shopBuilding.widthFt}' × {layout.shopBuilding.depthFt}'
            </p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-white">Layout Canvas</h2>
            <div className="text-sm text-slate-400">
              {layout.equipmentPositions.length} machines placed
            </div>
          </div>
          
          {/* Simple 2D Grid Canvas */}
          <div className="bg-slate-900 rounded-lg p-4 relative" style={{ minHeight: '600px' }}>
            <div className="absolute inset-4 border-2 border-slate-700 rounded" style={{ 
              backgroundImage: 'linear-gradient(rgba(71, 85, 105, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(71, 85, 105, 0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}>
              {/* Grid overlay - each square = 5 feet */}
              {layout.equipmentPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="absolute bg-blue-600/30 border-2 border-blue-500 rounded p-2 cursor-move hover:bg-blue-600/50 transition-colors"
                  style={{
                    left: `${(pos.x / (layout.shopBuilding.widthFt || 1)) * 100}%`,
                    top: `${(pos.y / (layout.shopBuilding.depthFt || 1)) * 100}%`,
                    width: `${(pos.equipment.widthFt / (layout.shopBuilding.widthFt || 1)) * 100}%`,
                    height: `${(pos.equipment.depthFt / (layout.shopBuilding.depthFt || 1)) * 100}%`,
                    transform: `rotate(${pos.orientation}deg)`
                  }}
                >
                  <div className="text-white text-xs font-semibold truncate">
                    {pos.equipment.name}
                  </div>
                  <div className="text-slate-300 text-xs mt-1">
                    {pos.equipment.widthFt}' × {pos.equipment.depthFt}'
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-slate-400">
            💡 Tip: Equipment positions are shown on a scaled grid. Future version will have drag & drop.
          </div>
        </div>

        {/* Equipment List */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Placed Equipment</h2>
          {layout.equipmentPositions.length === 0 ? (
            <p className="text-slate-400">No equipment placed yet</p>
          ) : (
            <div className="space-y-3">
              {layout.equipmentPositions.map((pos) => (
                <div key={pos.id} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">{pos.equipment.name}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      Position: ({pos.x}', {pos.y}') • 
                      Size: {pos.equipment.widthFt}' × {pos.equipment.depthFt}' • 
                      Rotation: {pos.orientation}°
                    </div>
                    {pos.equipment.powerSpecs && (
                      <div className="text-sm text-slate-400">
                        ⚡ {pos.equipment.powerSpecs.voltage}V, {pos.equipment.powerSpecs.amps}A
                      </div>
                    )}
                  </div>
                  {pos.locked && (
                    <div className="text-yellow-500 text-sm">🔒 Locked</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}