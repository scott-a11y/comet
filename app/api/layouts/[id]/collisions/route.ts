import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CollisionValidator } from '@/lib/validations/collision';

/**
 * GET /api/layouts/[id]/collisions
 * Returns collision report for a specific layout
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const layoutId = parseInt(id);

        if (isNaN(layoutId)) {
            return NextResponse.json(
                { error: 'Invalid layout ID' },
                { status: 400 }
            );
        }

        // Get layout with equipment positions
        const layout = await prisma.layoutInstance.findUnique({
            where: { id: layoutId },
            include: {
                equipmentPositions: {
                    include: {
                        equipment: {
                            select: {
                                id: true,
                                name: true,
                                widthFt: true,
                                depthFt: true
                            }
                        }
                    }
                }
            }
        });

        if (!layout) {
            return NextResponse.json(
                { error: 'Layout not found' },
                { status: 404 }
            );
        }

        // Validate collisions
        const result = await CollisionValidator.validateLayout(
            layoutId,
            layout.equipmentPositions
        );

        return NextResponse.json({
            layoutId,
            layoutName: layout.name,
            ...result,
            lastCheck: layout.lastCollisionCheck
        });
    } catch (error) {
        console.error('Collision check error:', error);
        return NextResponse.json(
            { error: 'Failed to check collisions' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/layouts/[id]/collisions
 * Validates and saves collision data for a layout
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const layoutId = parseInt(id);

        if (isNaN(layoutId)) {
            return NextResponse.json(
                { error: 'Invalid layout ID' },
                { status: 400 }
            );
        }

        const body = await request.json();

        if (!body.equipmentPositions || !Array.isArray(body.equipmentPositions)) {
            return NextResponse.json(
                { error: 'Invalid request body: equipmentPositions array required' },
                { status: 400 }
            );
        }

        // Get equipment details
        const equipmentIds = body.equipmentPositions.map((p: any) => p.equipmentId);
        const equipment = await prisma.equipment.findMany({
            where: { id: { in: equipmentIds } },
            select: { id: true, name: true, widthFt: true, depthFt: true }
        });

        // Merge positions with equipment data
        const positionsWithEquipment = body.equipmentPositions.map((pos: any) => {
            const eq = equipment.find(e => e.id === pos.equipmentId);
            if (!eq) {
                throw new Error(`Equipment ${pos.equipmentId} not found`);
            }

            return {
                ...pos,
                equipment: eq
            };
        });

        // Validate collisions
        const result = await CollisionValidator.validateLayout(
            layoutId,
            positionsWithEquipment
        );

        // Update layout with collision data
        await prisma.layoutInstance.update({
            where: { id: layoutId },
            data: {
                hasCollisions: result.hasCollisions,
                collisionCount: result.collisionCount,
                collisionData: result.collisions,
                lastCollisionCheck: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            layoutId,
            ...result
        });
    } catch (error) {
        console.error('Collision save error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to save collision data' },
            { status: 500 }
        );
    }
}
