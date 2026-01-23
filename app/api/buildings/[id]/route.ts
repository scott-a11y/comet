import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { withAuth } from '@/lib/auth-middleware';
import { withRateLimit } from '@/lib/api-middleware';
import { verifyBuildingOwnership } from '@/lib/actions/helpers';
import { z } from 'zod';

// Validation schema for building updates
const updateBuildingSchema = z.object({
    floorGeometry: z.record(z.any()).nullable().optional(),
    floorScaleFtPerUnit: z.number().positive().nullable().optional(),
    name: z.string().min(1).max(100).optional(),
    widthFt: z.number().positive().nullable().optional(),
    depthFt: z.number().positive().nullable().optional(),
    ceilingHeightFt: z.number().positive().nullable().optional(),
});
export const GET = withRateLimit(withAuth(async (
    userId: string,
    request: Request,
    { params }: { params: { id: string } }
) => {
    try {
        const buildingId = parseInt(params.id);
        const { searchParams } = new URL(request.url);
        const isMinimal = searchParams.get('minimal') === 'true';

        if (isNaN(buildingId)) {
            return apiError('Invalid building ID', 400);
        }

        if (isMinimal) {
            const building = await prisma.shopBuilding.findFirst({
                where: {
                    id: buildingId,
                    userId
                },
                select: {
                    id: true,
                    name: true,
                    widthFt: true,
                    depthFt: true,
                    ceilingHeightFt: true,
                    floorGeometry: true,
                    floorScaleFtPerUnit: true,
                    pdfUrl: true,
                }
            });

            if (!building) {
                return apiError('Building not found or access denied', 404);
            }

            return apiSuccess(building);
        }

        const building = await prisma.shopBuilding.findFirst({
            where: {
                id: buildingId,
                userId
            },
            include: {
                equipment: {
                    include: {
                        powerSpecs: true,
                        dustSpecs: true,
                        airSpecs: true
                    }
                },
                zones: true,
                utilityPoints: true,
                layouts: true
            }
        });

        if (!building) {
            return apiError('Building not found or access denied', 404);
        }

        return apiSuccess(building);
    } catch (error) {
        console.error('Error fetching building:', error);
        return apiError('Failed to fetch building', 500);
    }
}))

export const PATCH = withRateLimit(withAuth(async (
    userId: string,
    request: Request,
    { params }: { params: { id: string } }
) => {
    try {
        const buildingId = parseInt(params.id);
        const body = await request.json();

        if (isNaN(buildingId)) {
            return apiError('Invalid building ID', 400);
        }

        // Validate input with Zod
        const validated = updateBuildingSchema.safeParse(body);
        if (!validated.success) {
            return apiError('Invalid input: ' + validated.error.errors.map(e => e.message).join(', '), 400);
        }

        // Verify ownership using helper
        const ownership = await verifyBuildingOwnership(buildingId, userId);
        if (!ownership.exists) {
            return apiError('Building not found or access denied', 404);
        }

        // Only include fields that were actually provided
        const updateData: Record<string, unknown> = {};
        if (validated.data.floorGeometry !== undefined) updateData.floorGeometry = validated.data.floorGeometry;
        if (validated.data.floorScaleFtPerUnit !== undefined) updateData.floorScaleFtPerUnit = validated.data.floorScaleFtPerUnit;
        if (validated.data.name !== undefined) updateData.name = validated.data.name;
        if (validated.data.widthFt !== undefined) updateData.widthFt = validated.data.widthFt;
        if (validated.data.depthFt !== undefined) updateData.depthFt = validated.data.depthFt;
        if (validated.data.ceilingHeightFt !== undefined) updateData.ceilingHeightFt = validated.data.ceilingHeightFt;

        const building = await prisma.shopBuilding.update({
            where: { id: buildingId },
            data: updateData
        });

        return apiSuccess(building);
    } catch (error) {
        console.error('Error updating building:', error);
        return apiError('Failed to update building', 500);
    }
}))

export const DELETE = withRateLimit(withAuth(async (
    userId: string,
    request: Request,
    { params }: { params: { id: string } }
) => {
    try {
        const buildingId = parseInt(params.id);

        if (isNaN(buildingId)) {
            return apiError('Invalid building ID', 400);
        }

        // Verify ownership using helper
        const ownership = await verifyBuildingOwnership(buildingId, userId);
        if (!ownership.exists) {
            return apiError('Building not found or access denied', 404);
        }

        await prisma.shopBuilding.delete({
            where: { id: buildingId },
        });

        return apiSuccess({ message: 'Building deleted successfully' });
    } catch (error) {
        console.error('Error deleting building:', error);
        return apiError('Failed to delete building', 500);
    }
}))
