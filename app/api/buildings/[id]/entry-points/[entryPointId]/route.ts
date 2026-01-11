import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';

// PUT /api/buildings/[id]/entry-points/[entryPointId] - Update entry point
export const PUT = withAuth(async (userId: string, req: NextRequest, context: any) => {
    try {
        const buildingId = parseInt(context.params.id);
        const entryPointId = parseInt(context.params.entryPointId);

        if (isNaN(buildingId) || isNaN(entryPointId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid ID' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { name, type, x, y, widthFt, direction, isPrimary, notes } = body;

        // Verify entry point exists and belongs to this building
        const existing = await prisma.entryPoint.findFirst({
            where: {
                id: entryPointId,
                shopBuildingId: buildingId,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Entry point not found' },
                { status: 404 }
            );
        }

        const entryPoint = await prisma.entryPoint.update({
            where: { id: entryPointId },
            data: {
                name: name || existing.name,
                type: type || existing.type,
                x: x !== undefined ? parseFloat(x) : existing.x,
                y: y !== undefined ? parseFloat(y) : existing.y,
                widthFt: widthFt !== undefined ? parseFloat(widthFt) : existing.widthFt,
                direction: direction !== undefined ? direction : existing.direction,
                isPrimary: isPrimary !== undefined ? isPrimary : existing.isPrimary,
                notes: notes !== undefined ? notes : existing.notes,
            },
        });

        return NextResponse.json({
            success: true,
            data: entryPoint,
        });
    } catch (error) {
        console.error('Error updating entry point:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update entry point' },
            { status: 500 }
        );
    }
});

// DELETE /api/buildings/[id]/entry-points/[entryPointId] - Delete entry point
export const DELETE = withAuth(async (userId: string, req: NextRequest, context: any) => {
    try {
        const buildingId = parseInt(context.params.id);
        const entryPointId = parseInt(context.params.entryPointId);

        if (isNaN(buildingId) || isNaN(entryPointId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid ID' },
                { status: 400 }
            );
        }

        // Verify entry point exists and belongs to this building
        const existing = await prisma.entryPoint.findFirst({
            where: {
                id: entryPointId,
                shopBuildingId: buildingId,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Entry point not found' },
                { status: 404 }
            );
        }

        await prisma.entryPoint.delete({
            where: { id: entryPointId },
        });

        return NextResponse.json({
            success: true,
            message: 'Entry point deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting entry point:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete entry point' },
            { status: 500 }
        );
    }
});
