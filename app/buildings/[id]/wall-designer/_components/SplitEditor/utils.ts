/**
 * Wall Editor Utilities and Constants
 */

export const GRID_SIZE = 20; // pixels
export const SNAP_DIST = 15; // pixels
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;

/**
 * Generate a new ID with an optional prefix
 */
export function newId(prefix: string = 'id'): string {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
}

/**
 * Snap a point to the nearest grid intersection
 */
export function snapToGrid(p: { x: number; y: number }, gridSize = GRID_SIZE): { x: number; y: number } {
    return {
        x: Math.round(p.x / gridSize) * gridSize,
        y: Math.round(p.y / gridSize) * gridSize
    };
}

/**
 * Calculate distance between two points
 */
export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Convert radians to degrees
 */
export function radToDeg(rad: number): number {
    return (rad * 180) / Math.PI;
}

/**
 * Convert degrees to radians
 */
export function degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
}
