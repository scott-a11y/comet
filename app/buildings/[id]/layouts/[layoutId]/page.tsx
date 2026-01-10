import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LayoutOptimizer from '@/components/layout/LayoutOptimizer'
import InteractiveLayoutCanvas from '@/components/layout/InteractiveLayoutCanvas'
import MaterialFlowPathEditor from '@/components/layout/MaterialFlowPathEditor'

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
      shopBuilding: {
        include: {
          equipment: true, // Include equipment to check if optimization is possible
          entryPoints: {
            orderBy: [
              { isPrimary: 'desc' },
              { createdAt: 'asc' },
            ],
          },
        },
      },
      equipmentPositions: {
        include: {
          equipment: {
            include: {
              powerSpecs: true,
              dustSpecs: true
            }
          }
        }
      },
      materialFlowPaths: {
        orderBy: { createdAt: 'asc' },
      },
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

  // Belt-and-suspenders: prevent treating "new" as a numeric layout id.
  if (layoutId === 'new') {
    redirect(`/buildings/${id}/layouts/new`)
  }

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

        {/* AI Layout Optimizer */}
        <div className="mb-6">
          <LayoutOptimizer
            buildingId={id}
            layoutId={layoutId}
            hasEquipment={layout.shopBuilding.equipment && layout.shopBuilding.equipment.length > 0}
          />
        </div>

        {/* Interactive Layout Canvas */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white mb-2">Interactive Layout Canvas</h2>
            <p className="text-sm text-slate-400">
              Drag equipment to reposition • Click to select • Use "Edit Position" for precise measurements
            </p>
          </div>

          <InteractiveLayoutCanvas
            buildingId={id}
            layoutId={layoutId}
            buildingWidth={layout.shopBuilding.widthFt || 50}
            buildingHeight={layout.shopBuilding.depthFt || 40}
            equipmentPositions={layout.equipmentPositions as any}
          />
        </div>

        {/* Equipment List */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Placed Equipment</h2>
          {layout.equipmentPositions.length === 0 ? (
            <p className="text-slate-400">No equipment placed yet</p>
          ) : (
            <div className="space-y-3">
              {layout.equipmentPositions.map((pos: typeof layout.equipmentPositions[0]) => (
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

        {/* Material Flow Path Editor */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <MaterialFlowPathEditor
            layoutId={parseInt(layoutId)}
            buildingWidth={layout.shopBuilding.widthFt || 100}
            buildingDepth={layout.shopBuilding.depthFt || 100}
            entryPoints={layout.shopBuilding.entryPoints || []}
            materialFlowPaths={layout.materialFlowPaths || []}
            equipmentPositions={layout.equipmentPositions.map((pos: any) => ({
              id: pos.id,
              x: pos.x,
              y: pos.y,
              equipment: {
                name: pos.equipment.name,
                widthFt: pos.equipment.widthFt,
                depthFt: pos.equipment.depthFt,
              },
            }))}
          />
        </div>
      </div>
    </div>
  )
}