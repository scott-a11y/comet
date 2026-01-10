import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';

// DELETE /api/layouts/[layoutId]/material-flow-paths/[pathId] - Delete material flow path
export const DELETE = withAuth(async (req: NextRequest, context: any) => {
    try {
        const layoutId = parseInt(context.params.layoutId);
        const pathId = parseInt(context.params.pathId);

        if (isNaN(layoutId) || isNaN(pathId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid ID' },
                { status: 400 }
            );
        }

        // Verify path exists and belongs to this layout
        const existing = await prisma.materialFlowPath.findFirst({
            where: {
                id: pathId,
                layoutId: layoutId,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Material flow path not found' },
                { status: 404 }
            );
        }

        await prisma.materialFlowPath.delete({
            where: { id: pathId },
        });

        return NextResponse.json({
            success: true,
            message: 'Material flow path deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting material flow path:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete material flow path' },
            { status: 500 }
        );
    }
});
