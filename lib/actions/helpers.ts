import { prisma } from '@/lib/prisma';
import { BuildingFloorGeometry } from '@/lib/types/building-geometry';
import { revalidatePath } from 'next/cache';

/**
 * Helper to safely work with building floor geometry
 * Encapsulates the common pattern of:
 * 1. Fetch building and geometry
 * 2. Apply changes via callback
 * 3. Save and revalidate
 */
export async function withBuildingGeometry<T>(
    buildingId: number,
    updater: (geometry: BuildingFloorGeometry) => T
): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
        const building = await prisma.shopBuilding.findUnique({
            where: { id: buildingId },
            select: { floorGeometry: true }
        });

        if (!building) {
            return { success: false, error: 'Building not found' };
        }

        // Initialize default geometry if none exists
        const geometry: BuildingFloorGeometry = (building.floorGeometry as BuildingFloorGeometry) || {
            version: 1,
            vertices: [],
            segments: []
        };

        const result = updater(geometry);

        await prisma.shopBuilding.update({
            where: { id: buildingId },
            data: { floorGeometry: geometry as object }
        });

        revalidatePath(`/buildings/${buildingId}`);

        return { success: true, data: result };
    } catch (error) {
        console.error('withBuildingGeometry error:', error);
        return { success: false, error: 'Database update failed' };
    }
}

/**
 * Helper to verify building ownership before operations
 */
export async function verifyBuildingOwnership(
    buildingId: number,
    userId: string
): Promise<{ exists: boolean; building?: { id: number } }> {
    const building = await prisma.shopBuilding.findFirst({
        where: { id: buildingId, userId },
        select: { id: true }
    });

    return { exists: !!building, building: building || undefined };
}

/**
 * Find and update an item in an array by ID
 */
export function upsertById<T extends { id: string }>(
    array: T[],
    item: T
): T[] {
    const index = array.findIndex(existing => existing.id === item.id);
    if (index === -1) {
        return [...array, item];
    }
    const result = [...array];
    result[index] = { ...result[index], ...item };
    return result;
}
