"use server";

import { createServerAction } from 'zsa';
import { prisma } from '@/lib/prisma';
import { CollisionValidator, collisionCheckSchema } from '@/lib/validations/collision';

/**
 * Server action to validate layout collisions
 * Checks all equipment positions for overlaps and stores collision metadata
 */
export const validateLayoutCollisions = createServerAction()
    .input(collisionCheckSchema)
    .handler(async ({ input }) => {
        const { layoutId, equipmentPositions } = input;

        try {
            // Get equipment details from database
            const equipmentIds = equipmentPositions.map(p => p.equipmentId);
            const equipment = await prisma.equipment.findMany({
                where: { id: { in: equipmentIds } },
                select: { id: true, name: true, widthFt: true, depthFt: true }
            });

            // Merge positions with equipment data
            const positionsWithEquipment = equipmentPositions.map(pos => {
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

            // Update layout collision metadata
            await prisma.layoutInstance.update({
                where: { id: layoutId },
                data: {
                    hasCollisions: result.hasCollisions,
                    collisionCount: result.collisionCount,
                    collisionData: result.collisions,
                    lastCollisionCheck: new Date()
                }
            });

            return {
                success: true,
                result
            };
        } catch (error) {
            throw new Error(
                error instanceof Error ? error.message : 'Failed to validate collisions'
            );
        }
    });
