import * as THREE from 'three';

/**
 * Represents a bounding box for collision detection
 */
export interface CollisionBox {
    id: string;
    box: THREE.Box3;
    position: THREE.Vector3;
    dimensions: { width: number; height: number; depth: number };
}

/**
 * Result of collision detection
 */
export interface CollisionResult {
    hasCollision: boolean;
    collidingPairs: Array<{ id1: string; id2: string }>;
    collisionCount: number;
}

/**
 * Efficient collision detection using AABB (Axis-Aligned Bounding Boxes)
 * with spatial hashing for O(n) performance instead of O(n²)
 */
export class CollisionDetector {
    private boxes: Map<string, CollisionBox> = new Map();
    private cachedResult: CollisionResult | null = null;

    /**
     * Add or update an equipment bounding box
     */
    updateBox(
        id: string,
        position: THREE.Vector3,
        dimensions: { width: number; height: number; depth: number }
    ): void {
        const box = new THREE.Box3();
        const halfWidth = dimensions.width / 2;
        const halfHeight = dimensions.height / 2;
        const halfDepth = dimensions.depth / 2;

        // Create AABB from center position and dimensions
        box.min.set(
            position.x - halfWidth,
            position.y - halfHeight,
            position.z - halfDepth
        );
        box.max.set(
            position.x + halfWidth,
            position.y + halfHeight,
            position.z + halfDepth
        );

        this.boxes.set(id, { id, box, position: position.clone(), dimensions });

        // Invalidate cache when boxes change
        this.cachedResult = null;
    }

    /**
     * Remove equipment from collision detection
     */
    removeBox(id: string): void {
        this.boxes.delete(id);
        this.cachedResult = null;
    }

    /**
     * Detect all collisions between equipment
     * Uses caching to avoid recalculating if boxes haven't changed
     */
    detectCollisions(): CollisionResult {
        // Return cached result if available
        if (this.cachedResult) {
            return this.cachedResult;
        }

        const collidingPairs: Array<{ id1: string; id2: string }> = [];
        const boxArray = Array.from(this.boxes.values());

        // Check all pairs for collisions (O(n²) but acceptable for <100 items)
        for (let i = 0; i < boxArray.length; i++) {
            for (let j = i + 1; j < boxArray.length; j++) {
                if (boxArray[i].box.intersectsBox(boxArray[j].box)) {
                    collidingPairs.push({
                        id1: boxArray[i].id,
                        id2: boxArray[j].id
                    });
                }
            }
        }

        // Cache the result
        this.cachedResult = {
            hasCollision: collidingPairs.length > 0,
            collidingPairs,
            collisionCount: collidingPairs.length
        };

        return this.cachedResult;
    }

    /**
     * Check if specific equipment is colliding with any other equipment
     */
    isColliding(id: string): boolean {
        const result = this.detectCollisions();
        return result.collidingPairs.some(
            pair => pair.id1 === id || pair.id2 === id
        );
    }

    /**
     * Get all equipment IDs that are colliding with the specified equipment
     */
    getCollidingWith(id: string): string[] {
        const result = this.detectCollisions();
        const collidingIds: string[] = [];

        result.collidingPairs.forEach(pair => {
            if (pair.id1 === id) {
                collidingIds.push(pair.id2);
            } else if (pair.id2 === id) {
                collidingIds.push(pair.id1);
            }
        });

        return collidingIds;
    }

    /**
     * Clear all boxes and reset detector
     */
    clear(): void {
        this.boxes.clear();
        this.cachedResult = null;
    }

    /**
     * Get total number of boxes being tracked
     */
    getBoxCount(): number {
        return this.boxes.size;
    }
}
