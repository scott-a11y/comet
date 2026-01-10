import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';
import { apiSuccess, apiError } from '@/lib/api-response';

interface RouteContext {
    params: Promise<{
        id: string;
        layoutId: string;
    }>;
}

async function updatePositionsHandler(
    userId: string,
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id: buildingId, layoutId } = await context.params;
        const body = await request.json();
        const { positions } = body;

        if (!Array.isArray(positions)) {
            return apiError('Invalid positions data', 400);
        }

        // Verify layout exists and belongs to this building
        const layout = await prisma.layoutInstance.findUnique({
            where: {
                id: parseInt(layoutId),
                shopBuildingId: parseInt(buildingId),
            },
        });

        if (!layout) {
            return apiError('Layout not found', 404);
        }

        // Update each position
        await Promise.all(
            positions.map((pos: { id: number; x: number; y: number; orientation: number }) =>
                prisma.equipmentLayoutPosition.update({
                    where: {
                        id: pos.id,
                    },
                    data: {
                        x: pos.x,
                        y: pos.y,
                        orientation: pos.orientation,
                    },
                })
            )
        );

        return apiSuccess({ message: 'Positions updated successfully' });
    } catch (error) {
        console.error('Update positions error:', error);
        return apiError('Failed to update positions', 500);
    }
}

export const PUT = withAuth(updatePositionsHandler);
