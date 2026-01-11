import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';

// POST /api/layouts/[layoutId]/material-flow-paths - Create new material flow path
export const POST = withAuth(async (userId: string, req: NextRequest, context: any) => {
    try {
        const layoutId = parseInt(context.params.layoutId);

        if (isNaN(layoutId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid layout ID' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { name, pathType, pathData, color, fromEntryPointId, toEntryPointId, notes } = body;

        // Validate required fields
        if (!name || !pathType || !pathData || !Array.isArray(pathData)) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify layout exists
        const layout = await prisma.layoutInstance.findUnique({
            where: { id: layoutId },
        });

        if (!layout) {
            return NextResponse.json(
                { success: false, error: 'Layout not found' },
                { status: 404 }
            );
        }

        const materialFlowPath = await prisma.materialFlowPath.create({
            data: {
                layoutId,
                name,
                pathType,
                pathData,
                color: color || '#3b82f6',
                fromEntryPointId: fromEntryPointId || null,
                toEntryPointId: toEntryPointId || null,
                notes: notes || null,
            },
        });

        return NextResponse.json({
            success: true,
            data: materialFlowPath,
        });
    } catch (error) {
        console.error('Error creating material flow path:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create material flow path' },
            { status: 500 }
        );
    }
});
