import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const buildingId = parseInt(params.id);

        if (isNaN(buildingId)) {
            return apiError('Invalid building ID', 400);
        }

        const building = await prisma.shopBuilding.findUnique({
            where: { id: buildingId },
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
            return apiError('Building not found', 404);
        }

        return apiSuccess(building);
    } catch (error) {
        console.error('Error fetching building:', error);
        return apiError('Failed to fetch building', 500);
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const buildingId = parseInt(params.id);
        const body = await request.json();

        if (isNaN(buildingId)) {
            return apiError('Invalid building ID', 400);
        }

        const building = await prisma.shopBuilding.update({
            where: { id: buildingId },
            data: {
                floorGeometry: body.floorGeometry,
                floorScaleFtPerUnit: body.floorScaleFtPerUnit,
                // Any other fields that might be updated
            }
        });

        return apiSuccess(building);
    } catch (error) {
        console.error('Error updating building:', error);
        return apiError('Failed to update building', 500);
    }
}
