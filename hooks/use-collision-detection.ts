import { useRef, useCallback, useState, useEffect } from 'react';
import { CollisionDetector, CollisionResult } from '@/lib/3d/collision-detection';
import * as THREE from 'three';

/**
 * React hook for managing collision detection in 3D scenes
 * Provides collision state and methods to update equipment positions
 */
export function useCollisionDetection() {
    const detector = useRef(new CollisionDetector());
    const [collisions, setCollisions] = useState<CollisionResult>({
        hasCollision: false,
        collidingPairs: [],
        collisionCount: 0
    });

    /**
     * Update or add equipment bounding box
     */
    const updateBounds = useCallback((
        id: string,
        position: THREE.Vector3,
        dimensions: { width: number; height: number; depth: number }
    ) => {
        detector.current.updateBox(id, position, dimensions);
        const result = detector.current.detectCollisions();
        setCollisions(result);
    }, []);

    /**
     * Remove equipment from collision detection
     */
    const removeBounds = useCallback((id: string) => {
        detector.current.removeBox(id);
        const result = detector.current.detectCollisions();
        setCollisions(result);
    }, []);

    /**
     * Check if specific equipment is colliding
     */
    const isColliding = useCallback((id: string): boolean => {
        return detector.current.isColliding(id);
    }, []);

    /**
     * Get all equipment IDs colliding with specified equipment
     */
    const getCollidingWith = useCallback((id: string): string[] => {
        return detector.current.getCollidingWith(id);
    }, []);

    /**
     * Manually trigger collision detection
     * Useful when you want to check collisions without updating boxes
     */
    const checkCollisions = useCallback(() => {
        const result = detector.current.detectCollisions();
        setCollisions(result);
        return result;
    }, []);

    /**
     * Clear all collision data
     */
    const clearCollisions = useCallback(() => {
        detector.current.clear();
        setCollisions({
            hasCollision: false,
            collidingPairs: [],
            collisionCount: 0
        });
    }, []);

    return {
        collisions,
        updateBounds,
        removeBounds,
        isColliding,
        getCollidingWith,
        checkCollisions,
        clearCollisions
    };
}
