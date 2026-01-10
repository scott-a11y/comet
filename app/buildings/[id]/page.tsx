import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CreateLayoutButton } from "./create-layout-button";
import EntryPointManager from "@/components/building/EntryPointManager";

// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

type BuildingPageProps = {
  // Next.js 16 can provide params as a Promise in some runtimes.
  // Awaiting ensures consistent behavior between dev/build/prod.
  params: Promise<{ id: string }> | { id: string };
};

export default async function BuildingPage({ params }: BuildingPageProps) {
  const { id } = await Promise.resolve(params);
  const buildingId = parseInt(id, 10);

  if (Number.isNaN(buildingId)) {
    notFound();
  }

  const building = await prisma.shopBuilding.findUnique({
    where: { id: buildingId },
    include: {
      designerLayouts: {
        include: {
          equipmentInstances: true,
        },
        orderBy: { createdAt: "desc" },
      },
      entryPoints: {
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'asc' },
        ],
      },
    },
  });

  if (!building) {
    notFound();
  }

  // Parse extracted data if it exists
  let extractedData: any = null;
  if (building.extractedData) {
    try {
      extractedData = typeof building.extractedData === 'string'
        ? JSON.parse(building.extractedData)
        : building.extractedData;
    } catch (error) {
      console.error('Failed to parse extracted data:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/buildings"
            className="text-blue-400 hover:text-blue-300 transition-colors mb-4 inline-block"
          >
            ← Back to Buildings
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{building.name}</h1>
              <p className="text-slate-400 text-lg">
                Building #{building.id}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href={`/buildings/${building.id}/3d`}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                View in 3D
              </Link>
              <div className="text-right text-sm">
                <div className="text-slate-500">Created</div>
                <div className="text-white">
                  {new Date(building.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Building Specs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Dimensions */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Building Dimensions</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Width:</span>
                  <span className="text-white font-mono">{building.widthFt} ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Length:</span>
                  <span className="text-white font-mono">{building.depthFt} ft</span>
                </div>
                {building.ceilingHeightFt && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Height:</span>
                    <span className="text-white font-mono">{building.ceilingHeightFt} ft</span>
                  </div>
                )}
                {building.hasMezzanine && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mezzanine:</span>
                    <span className="text-green-400">Yes</span>
                  </div>
                )}
              </div>
            </div>

            {/* PDF Analysis Summary */}
            {extractedData && (
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Floor Plan Analysis</h2>
                <div className="space-y-3">
                  {extractedData.width && extractedData.length && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Analyzed Dimensions:</div>
                      <div className="text-white font-mono">
                        {extractedData.width} × {extractedData.length} ft
                      </div>
                    </div>
                  )}
                  {extractedData.summary && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">AI Summary:</div>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {extractedData.summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {building.notes && (
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Notes</h2>
                <p className="text-slate-300 leading-relaxed">{building.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Layouts */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Shop Layouts</h2>
                <CreateLayoutButton buildingId={building.id.toString()} />
              </div>

              {building.designerLayouts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-500 mb-4">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-400 mb-2">No layouts yet</h3>
                  <p className="text-slate-500 mb-6">
                    Create your first layout to start designing your shop
                  </p>
                  <CreateLayoutButton buildingId={building.id.toString()} />
                </div>
              ) : (
                <div className="space-y-4">
                  {building.designerLayouts.map((layout) => (
                    <div
                      key={layout.id}
                      className="bg-slate-900/50 rounded-lg border border-slate-600 p-4 hover:border-slate-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">{layout.name}</h3>
                          {layout.description && (
                            <p className="text-slate-400 text-sm mt-1">{layout.description}</p>
                          )}
                          <p className="text-slate-500 text-xs mt-2">
                            Created {new Date(layout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">
                            {layout.equipmentInstances?.length || 0} items
                          </span>
                          <Link
                            href={`/editor/${layout.id}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            Edit Layout
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Entry Points & Material Flow Section */}
        <div className="mt-8">
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
            <EntryPointManager
              buildingId={building.id}
              buildingWidth={building.widthFt || 100}
              buildingDepth={building.depthFt || 100}
              entryPoints={building.entryPoints}
            />
          </div>
        </div>
      </div>
    </div>
  );
}