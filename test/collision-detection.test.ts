import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';

// Type definitions for collision detection
interface CollisionBox {
    id: string;
    box: THREE.Box3;
    position: THREE.Vector3;
    dimensions: { width: number; height: number; depth: number };
}

interface CollisionResult {
    hasCollision: boolean;
    collidingPairs: Array<{ id1: string; id2: string }>;
    collisionCount: number;
}

// Mock implementation for testing - will be replaced by actual implementation
class CollisionDetector {
    private boxes: Map<string, CollisionBox> = new Map();
    private cachedResult: CollisionResult | null = null;

    updateBox(id: string, position: THREE.Vector3, dimensions: { width: number; height: number; depth: number }): void {
        const box = new THREE.Box3();
        const halfWidth = dimensions.width / 2;
        const halfHeight = dimensions.height / 2;
        const halfDepth = dimensions.depth / 2;

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

        this.boxes.set(id, { id, box, position, dimensions });
        this.cachedResult = null; // Invalidate cache
    }

    removeBox(id: string): void {
        this.boxes.delete(id);
        this.cachedResult = null;
    }

    detectCollisions(): CollisionResult {
        if (this.cachedResult) {
            return this.cachedResult;
        }

        const collidingPairs: Array<{ id1: string; id2: string }> = [];
        const boxArray = Array.from(this.boxes.values());

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

        this.cachedResult = {
            hasCollision: collidingPairs.length > 0,
            collidingPairs,
            collisionCount: collidingPairs.length
        };

        return this.cachedResult;
    }

    isColliding(id: string): boolean {
        const result = this.detectCollisions();
        return result.collidingPairs.some(
            pair => pair.id1 === id || pair.id2 === id
        );
    }

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
}

describe('CollisionDetector', () => {
    let detector: CollisionDetector;

    beforeEach(() => {
        detector = new CollisionDetector();
    });

    describe('Basic Collision Detection', () => {
        it('should detect overlapping boxes', () => {
            // Equipment 1: 5x5x5 box at (0, 0, 0)
            detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            // Equipment 2: 5x5x5 box at (3, 0, 0) - overlaps by 2 units
            detector.updateBox('eq2', new THREE.Vector3(3, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            const result = detector.detectCollisions();

            expect(result.hasCollision).toBe(true);
            expect(result.collisionCount).toBe(1);
            expect(result.collidingPairs).toHaveLength(1);
            expect(result.collidingPairs[0]).toEqual({
                id1: 'eq1',
                id2: 'eq2'
            });
        });

        it('should not detect non-overlapping boxes', () => {
            // Equipment 1: 5x5x5 box at (0, 0, 0)
            detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            // Equipment 2: 5x5x5 box at (10, 0, 0) - no overlap
            detector.updateBox('eq2', new THREE.Vector3(10, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            const result = detector.detectCollisions();

            expect(result.hasCollision).toBe(false);
            expect(result.collisionCount).toBe(0);
            expect(result.collidingPairs).toHaveLength(0);
        });

        it('should detect touching boxes as collision', () => {
            // Equipment 1: 5x5x5 box at (0, 0, 0)
            detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            // Equipment 2: 5x5x5 box at (5, 0, 0) - edges touching
            detector.updateBox('eq2', new THREE.Vector3(5, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            const result = detector.detectCollisions();

            // Touching edges should be considered collision
            expect(result.hasCollision).toBe(true);
        });
    });

    describe('Multiple Equipment', () => {
        it('should detect multiple collisions', () => {
            // Create 3 overlapping boxes
            detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
                width: 10,
                height: 5,
                depth: 10
            });

            detector.updateBox('eq2', new THREE.Vector3(5, 0, 0), {
                width: 10,
                height: 5,
                depth: 10
            });

            detector.updateBox('eq3', new THREE.Vector3(2.5, 0, 0), {
                width: 10,
                height: 5,
                depth: 10
            });

            const result = detector.detectCollisions();

            // Should detect 3 pairs: (1,2), (1,3), (2,3)
            expect(result.collisionCount).toBe(3);
            expect(result.collidingPairs).toHaveLength(3);
        });

        it('should handle removal of equipment', () => {
            detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            detector.updateBox('eq2', new THREE.Vector3(3, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            expect(detector.detectCollisions().hasCollision).toBe(true);

            // Remove one equipment
            detector.removeBox('eq2');

            expect(detector.detectCollisions().hasCollision).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero-size boxes', () => {
            detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
                width: 0,
                height: 0,
                depth: 0
            });

            detector.updateBox('eq2', new THREE.Vector3(0, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            const result = detector.detectCollisions();

            // Zero-size box at same position should collide
            expect(result.hasCollision).toBe(true);
        });

        it('should handle very large boxes', () => {
            detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
                width: 1000,
                height: 100,
                depth: 1000
            });

            detector.updateBox('eq2', new THREE.Vector3(500, 0, 500), {
                width: 10,
                height: 10,
                depth: 10
            });

            const result = detector.detectCollisions();

            expect(result.hasCollision).toBe(true);
        });

        it('should handle negative positions', () => {
            detector.updateBox('eq1', new THREE.Vector3(-10, 0, -10), {
                width: 5,
                height: 5,
                depth: 5
            });

            detector.updateBox('eq2', new THREE.Vector3(-8, 0, -8), {
                width: 5,
                height: 5,
                depth: 5
            });

            const result = detector.detectCollisions();

            expect(result.hasCollision).toBe(true);
        });
    });

    describe('Performance', () => {
        it('should handle 100 equipment items efficiently', () => {
            const startTime = performance.now();

            // Add 100 equipment items in a grid
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    detector.updateBox(`eq-${i}-${j}`, new THREE.Vector3(i * 10, 0, j * 10), {
                        width: 5,
                        height: 5,
                        depth: 5
                    });
                }
            }

            const result = detector.detectCollisions();
            const endTime = performance.now();

            // Should complete in <100ms
            expect(endTime - startTime).toBeLessThan(100);

            // No collisions (spaced 10 units apart, boxes are 5 units)
            expect(result.hasCollision).toBe(false);
        });

        it('should handle 100 overlapping items efficiently', () => {
            const startTime = performance.now();

            // Add 100 overlapping equipment items
            for (let i = 0; i < 100; i++) {
                detector.updateBox(`eq-${i}`, new THREE.Vector3(0, 0, 0), {
                    width: 5,
                    height: 5,
                    depth: 5
                });
            }

            const result = detector.detectCollisions();
            const endTime = performance.now();

            // Should complete in <500ms even with all colliding
            expect(endTime - startTime).toBeLessThan(500);

            // Should detect collisions
            expect(result.hasCollision).toBe(true);
            expect(result.collisionCount).toBeGreaterThan(0);
        });
    });

    describe('isColliding method', () => {
        it('should return true for colliding equipment', () => {
            detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            detector.updateBox('eq2', new THREE.Vector3(3, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            detector.detectCollisions();

            expect(detector.isColliding('eq1')).toBe(true);
            expect(detector.isColliding('eq2')).toBe(true);
        });

        it('should return false for non-colliding equipment', () => {
            detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            detector.updateBox('eq2', new THREE.Vector3(10, 0, 0), {
                width: 5,
                height: 5,
                depth: 5
            });

            detector.detectCollisions();

            expect(detector.isColliding('eq1')).toBe(false);
            expect(detector.isColliding('eq2')).toBe(false);
        });
    });

    describe('getCollidingWith method', () => {
        it('should return IDs of colliding equipment', () => {
            detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
                width: 10,
                height: 5,
                depth: 10
            });

            detector.updateBox('eq2', new THREE.Vector3(5, 0, 0), {
                width: 10,
                height: 5,
                depth: 10
            });

            detector.updateBox('eq3', new THREE.Vector3(2.5, 0, 0), {
                width: 10,
                height: 5,
                depth: 10
            });

            detector.detectCollisions();

            const collidingWithEq1 = detector.getCollidingWith('eq1');

            expect(collidingWithEq1).toContain('eq2');
            expect(collidingWithEq1).toContain('eq3');
            expect(collidingWithEq1).toHaveLength(2);
        });
    });
});
