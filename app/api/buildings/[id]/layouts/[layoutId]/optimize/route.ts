import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';
import { apiSuccess, apiError } from '@/lib/api-response';
import { AILayoutOptimizer, Equipment as OptimizerEquipment, LayoutConstraints } from '@/lib/ai/LayoutOptimizer';

interface RouteContext {
    params: Promise<{
        id: string;
        layoutId: string;
    }>;
}

async function optimizeLayoutHandler(
    userId: string,
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id: buildingId, layoutId } = await context.params;

        // Get the layout and building
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
            return apiError('Layout not found', 404);
        }

        // Get all equipment for this building
        const allEquipment = await prisma.equipment.findMany({
            where: {
                shopBuildingId: parseInt(buildingId),
            },
        });

        if (allEquipment.length === 0) {
            return apiError('No equipment found for this building', 400);
        }

        // Parse request body for optimization preferences
        const body = await request.json().catch(() => ({}));
        const {
            workflowPriority = 'efficiency',
            groupSimilar = true,
            nearUtilities = true,
            minClearance = 3, // 3 feet minimum clearance
        } = body;

        // Convert equipment to optimizer format
        const equipmentForOptimizer: OptimizerEquipment[] = allEquipment.map((eq) => ({
            id: eq.id.toString(),
            name: eq.name,
            width: eq.widthFt,
            height: eq.depthFt,
            category: eq.category,
            requiresDust: eq.requiresDust,
            requiresAir: eq.requiresAir,
            requiresElectrical: eq.requiresHighVoltage,
        }));

        // Set up constraints
        const constraints: LayoutConstraints = {
            buildingWidth: layout.shopBuilding.widthFt || 50,
            buildingHeight: layout.shopBuilding.depthFt || 40,
            minClearance,
            workflowPriority,
            groupSimilar,
            nearUtilities,
        };

        // Run the optimizer
        const optimizationResult = AILayoutOptimizer.optimize(
            equipmentForOptimizer,
            constraints
        );

        // Delete existing equipment positions for this layout
        await prisma.equipmentLayoutPosition.deleteMany({
            where: {
                layoutId: parseInt(layoutId),
            },
        });

        // Create new optimized positions
        const positionsToCreate = optimizationResult.placements.map((placement) => ({
            layoutId: parseInt(layoutId),
            equipmentId: parseInt(placement.equipmentId),
            x: placement.x,
            y: placement.y,
            orientation: placement.rotation,
            locked: false,
        }));

        await prisma.equipmentLayoutPosition.createMany({
            data: positionsToCreate,
        });

        // Get the updated layout with new positions
        const updatedLayout = await prisma.layoutInstance.findUnique({
            where: {
                id: parseInt(layoutId),
            },
            include: {
                equipmentPositions: {
                    include: {
                        equipment: {
                            include: {
                                powerSpecs: true,
                                dustSpecs: true,
                                airSpecs: true,
                            },
                        },
                    },
                },
            },
        });

        return apiSuccess({
            layout: updatedLayout,
            optimization: {
                totalScore: optimizationResult.totalScore,
                warnings: optimizationResult.warnings,
                suggestions: optimizationResult.suggestions,
                placementsCount: optimizationResult.placements.length,
            },
        });
    } catch (error) {
        console.error('Layout optimization error:', error);
        return apiError('Failed to optimize layout', 500);
    }
}

export const POST = withAuth(optimizeLayoutHandler);
