import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';
import { generateLayoutHTML, LayoutExportData } from '@/lib/pdf/layout-exporter';

interface RouteContext {
    params: Promise<{
        id: string;
        layoutId: string;
    }>;
}

async function exportLayoutHandler(
    userId: string,
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id: buildingId, layoutId } = await context.params;

        // Get the layout with all equipment
        const layout = await prisma.layoutInstance.findUnique({
            where: {
                id: parseInt(layoutId),
                shopBuildingId: parseInt(buildingId),
            },
            include: {
                shopBuilding: true,
                equipmentPositions: {
                    include: {
                        equipment: true,
                    },
                },
            },
        });

        if (!layout) {
            return new NextResponse('Layout not found', { status: 404 });
        }

        // Prepare export data
        const exportData: LayoutExportData = {
            buildingName: layout.shopBuilding.name,
            layoutName: layout.name,
            dimensions: {
                width: layout.shopBuilding.widthFt || 50,
                height: layout.shopBuilding.depthFt || 40,
            },
            equipment: layout.equipmentPositions.map((pos) => ({
                name: pos.equipment.name,
                category: pos.equipment.category,
                x: pos.x,
                y: pos.y,
                width: pos.equipment.widthFt,
                height: pos.equipment.depthFt,
                rotation: pos.orientation,
            })),
            // Sample entry points (doors and loading docks)
            // TODO: Replace with actual entry points from database when UI is implemented
            entryPoints: [
                {
                    name: 'Main Entrance',
                    x: 25, // Center of south wall
                    y: 0,
                    type: 'door',
                },
                {
                    name: 'Loading Dock',
                    x: 5,
                    y: 0,
                    type: 'loading_dock',
                },
                {
                    name: 'Overhead Door',
                    x: 45,
                    y: 0,
                    type: 'overhead_door',
                },
            ],
            // Sample utility connection points
            // TODO: Replace with actual utility points from database
            utilityPoints: [
                {
                    name: 'Main Panel',
                    type: 'electrical',
                    x: 2,
                    y: 2,
                },
                {
                    name: 'Dust Main',
                    type: 'dust collection',
                    x: 48,
                    y: 2,
                },
                {
                    name: 'Compressor',
                    type: 'air compressor',
                    x: 48,
                    y: 38,
                },
            ],
            // Sample material flow paths
            // TODO: Replace with actual flow paths from database
            materialFlowPaths: [
                {
                    name: 'Receiving',
                    type: 'receiving',
                    points: [
                        { x: 5, y: 0 },
                        { x: 5, y: 10 },
                        { x: 15, y: 10 },
                    ],
                    color: '#10b981',
                },
                {
                    name: 'Processing',
                    type: 'processing',
                    points: [
                        { x: 15, y: 10 },
                        { x: 25, y: 20 },
                        { x: 35, y: 20 },
                    ],
                    color: '#3b82f6',
                },
                {
                    name: 'Shipping',
                    type: 'shipping',
                    points: [
                        { x: 35, y: 20 },
                        { x: 45, y: 10 },
                        { x: 45, y: 0 },
                    ],
                    color: '#f59e0b',
                },
            ],
            notes: `Shop layout for ${layout.shopBuilding.name}. Generated for shop buildout and equipment placement planning. Entry points, utility connections, and material flow paths are shown for reference.`,
        };

        // Generate HTML
        const html = generateLayoutHTML(exportData);

        // Return HTML response
        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="${layout.shopBuilding.name.replace(/[^a-z0-9]/gi, '_')}_${layout.name.replace(/[^a-z0-9]/gi, '_')}.html"`,
            },
        });
    } catch (error) {
        console.error('Layout export error:', error);
        return new NextResponse('Failed to export layout', { status: 500 });
    }
}

export const GET = withAuth(exportLayoutHandler);
