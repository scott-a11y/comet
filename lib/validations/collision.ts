import { z } from 'zod';

/**
 * Validation schema for collision checking
 */
export const collisionCheckSchema = z.object({
    layoutId: z.number().int().positive(),
    equipmentPositions: z.array(z.object({
        equipmentId: z.number().int(),
        x: z.number(),
        y: z.number(),
        orientation: z.number().min(0).max(360),
        widthFt: z.number().positive(),
        depthFt: z.number().positive()
    }))
});

/**
 * Represents a collision between two equipment items
 */
export interface CollisionPair {
    equipment1Id: number;
    equipment2Id: number;
    overlapArea: number;
    equipment1Name: string;
    equipment2Name: string;
}

/**
 * Result of collision validation
 */
export interface CollisionValidationResult {
    isValid: boolean;
    hasCollisions: boolean;
    collisionCount: number;
    collisions: CollisionPair[];
    message: string;
}

/**
 * Server-side collision validator using AABB (Axis-Aligned Bounding Box) detection
 */
export class CollisionValidator {
    /**
     * Check if two rectangles overlap (AABB collision)
     * For MVP: Assumes axis-aligned (ignores rotation)
     */
    static checkRectangleOverlap(
        rect1: { x: number; y: number; width: number; depth: number; rotation: number },
        rect2: { x: number; y: number; width: number; depth: number; rotation: number }
    ): { overlaps: boolean; area: number } {
        // Calculate bounds (axis-aligned, rotation ignored for MVP)
        const r1 = {
            left: rect1.x - rect1.width / 2,
            right: rect1.x + rect1.width / 2,
            top: rect1.y - rect1.depth / 2,
            bottom: rect1.y + rect1.depth / 2
        };

        const r2 = {
            left: rect2.x - rect2.width / 2,
            right: rect2.x + rect2.width / 2,
            top: rect2.y - rect2.depth / 2,
            bottom: rect2.y + rect2.depth / 2
        };

        // Check overlap
        const overlaps = !(
            r1.right < r2.left ||
            r1.left > r2.right ||
            r1.bottom < r2.top ||
            r1.top > r2.bottom
        );

        if (!overlaps) return { overlaps: false, area: 0 };

        // Calculate overlap area
        const overlapWidth = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
        const overlapDepth = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
        const area = overlapWidth * overlapDepth;

        return { overlaps: true, area };
    }

    /**
     * Validate entire layout for collisions
     */
    static async validateLayout(
        layoutId: number,
        equipmentPositions: Array<{
            equipmentId: number;
            x: number;
            y: number;
            orientation: number;
            equipment: { widthFt: number; depthFt: number; name: string };
        }>
    ): Promise<CollisionValidationResult> {
        const collisions: CollisionPair[] = [];

        // Check all pairs for collisions (O(n²) but acceptable for <100 items)
        for (let i = 0; i < equipmentPositions.length; i++) {
            for (let j = i + 1; j < equipmentPositions.length; j++) {
                const eq1 = equipmentPositions[i];
                const eq2 = equipmentPositions[j];

                const result = this.checkRectangleOverlap(
                    {
                        x: eq1.x,
                        y: eq1.y,
                        width: eq1.equipment.widthFt,
                        depth: eq1.equipment.depthFt,
                        rotation: eq1.orientation
                    },
                    {
                        x: eq2.x,
                        y: eq2.y,
                        width: eq2.equipment.widthFt,
                        depth: eq2.equipment.depthFt,
                        rotation: eq2.orientation
                    }
                );

                if (result.overlaps) {
                    collisions.push({
                        equipment1Id: eq1.equipmentId,
                        equipment2Id: eq2.equipmentId,
                        overlapArea: result.area,
                        equipment1Name: eq1.equipment.name,
                        equipment2Name: eq2.equipment.name
                    });
                }
            }
        }

        return {
            isValid: collisions.length === 0,
            hasCollisions: collisions.length > 0,
            collisionCount: collisions.length,
            collisions,
            message: collisions.length === 0
                ? 'Layout is collision-free'
                : `Found ${collisions.length} collision(s)`
        };
    }
}
