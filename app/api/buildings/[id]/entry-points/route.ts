import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';

// GET /api/buildings/[id]/entry-points - List all entry points for a building
export const GET = withAuth(async (req: NextRequest, context: any) => {
    try {
        const buildingId = parseInt(context.params.id);

        if (isNaN(buildingId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid building ID' },
                { status: 400 }
            );
        }

        const entryPoints = await prisma.entryPoint.findMany({
            where: { shopBuildingId: buildingId },
            orderBy: [
                { isPrimary: 'desc' },
                { createdAt: 'asc' },
            ],
        });

        return NextResponse.json({
            success: true,
            data: entryPoints,
        });
    } catch (error) {
        console.error('Error fetching entry points:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch entry points' },
            { status: 500 }
        );
    }
});

// POST /api/buildings/[id]/entry-points - Create new entry point
export const POST = withAuth(async (req: NextRequest, context: any) => {
    try {
        const buildingId = parseInt(context.params.id);

        if (isNaN(buildingId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid building ID' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { name, type, x, y, widthFt, direction, isPrimary, notes } = body;

        // Validate required fields
        if (!name || !type || x === undefined || y === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify building exists
        const building = await prisma.shopBuilding.findUnique({
            where: { id: buildingId },
        });

        if (!building) {
            return NextResponse.json(
                { success: false, error: 'Building not found' },
                { status: 404 }
            );
        }

        const entryPoint = await prisma.entryPoint.create({
            data: {
                shopBuildingId: buildingId,
                name,
                type,
                x: parseFloat(x),
                y: parseFloat(y),
                widthFt: widthFt ? parseFloat(widthFt) : 3,
                direction: direction || null,
                isPrimary: isPrimary || false,
                notes: notes || null,
            },
        });

        return NextResponse.json({
            success: true,
            data: entryPoint,
        });
    } catch (error) {
        console.error('Error creating entry point:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create entry point' },
            { status: 500 }
        );
    }
});
