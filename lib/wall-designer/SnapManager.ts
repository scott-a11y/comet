/**
 * Smart Snapping System for Wall Designer
 * Provides CAD-like precision with multi-point snapping
 */

export type SnapType =
    | 'vertex'        // Snap to corners/endpoints
    | 'midpoint'      // Snap to middle of lines
    | 'center'        // Snap to center of objects
    | 'intersection'  // Snap to line intersections
    | 'grid'          // Snap to grid
    | 'perpendicular' // Snap perpendicular to lines
    | 'tangent';      // Snap tangent to curves

import { Point } from './types';

export interface SnapPoint extends Point {
    type: SnapType;
    elementId?: string;
    priority: number;
    distance: number;
}

export interface SnapSettings {
    enabled: boolean;
    snapDistance: number; // pixels
    enabledTypes: Set<SnapType>;
    showIndicators: boolean;
}

export const DEFAULT_SNAP_SETTINGS: SnapSettings = {
    enabled: true,
    snapDistance: 15, // 15 pixels snap radius
    enabledTypes: new Set(['vertex', 'midpoint', 'center', 'intersection', 'grid']),
    showIndicators: true
};

/**
 * Wall segment for snapping calculations
 */
export interface WallSegment {
    id: string;
    start: Point;
    end: Point;
}

/**
 * Equipment/object for snapping calculations
 */
export interface SnapObject {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
}

export class SnapManager {
    private settings: SnapSettings;

    constructor(settings: Partial<SnapSettings> = {}) {
        this.settings = { ...DEFAULT_SNAP_SETTINGS, ...settings };
    }

    /**
     * Find the best snap point for a given pointer position
     */
    findSnapPoint(
        pointer: Point,
        walls: WallSegment[],
        objects: SnapObject[] = [],
        gridSize: number = 12 // 1 foot grid in pixels
    ): SnapPoint | null {
        if (!this.settings.enabled) return null;

        const snapPoints: SnapPoint[] = [];

        // 1. Vertex snapping (wall endpoints)
        if (this.settings.enabledTypes.has('vertex')) {
            walls.forEach(wall => {
                snapPoints.push(
                    this.createSnapPoint(wall.start, 'vertex', wall.id, pointer),
                    this.createSnapPoint(wall.end, 'vertex', wall.id, pointer)
                );
            });
        }

        // 2. Midpoint snapping
        if (this.settings.enabledTypes.has('midpoint')) {
            walls.forEach(wall => {
                const midpoint = {
                    x: (wall.start.x + wall.end.x) / 2,
                    y: (wall.start.y + wall.end.y) / 2
                };
                snapPoints.push(
                    this.createSnapPoint(midpoint, 'midpoint', wall.id, pointer)
                );
            });
        }

        // 3. Center snapping (equipment/objects)
        if (this.settings.enabledTypes.has('center')) {
            objects.forEach(obj => {
                const center = {
                    x: obj.x + obj.width / 2,
                    y: obj.y + obj.height / 2
                };
                snapPoints.push(
                    this.createSnapPoint(center, 'center', obj.id, pointer)
                );
            });
        }

        // 4. Intersection snapping
        if (this.settings.enabledTypes.has('intersection')) {
            const intersections = this.findIntersections(walls);
            intersections.forEach(point => {
                snapPoints.push(
                    this.createSnapPoint(point, 'intersection', undefined, pointer)
                );
            });
        }

        // 5. Grid snapping
        if (this.settings.enabledTypes.has('grid')) {
            const gridPoint = {
                x: Math.round(pointer.x / gridSize) * gridSize,
                y: Math.round(pointer.y / gridSize) * gridSize
            };
            snapPoints.push(
                this.createSnapPoint(gridPoint, 'grid', undefined, pointer)
            );
        }

        // Filter by snap distance and sort by priority
        const validSnaps = snapPoints
            .filter(snap => snap.distance <= this.settings.snapDistance)
            .sort((a, b) => {
                // Sort by priority first, then by distance
                if (a.priority !== b.priority) {
                    return b.priority - a.priority;
                }
                return a.distance - b.distance;
            });

        return validSnaps.length > 0 ? validSnaps[0] : null;
    }

    /**
     * Create a snap point with distance and priority
     */
    private createSnapPoint(
        point: Point,
        type: SnapType,
        elementId: string | undefined,
        pointer: Point
    ): SnapPoint {
        const distance = this.calculateDistance(point, pointer);
        const priority = this.getSnapPriority(type);

        return {
            ...point,
            type,
            elementId,
            priority,
            distance
        };
    }

    /**
     * Calculate distance between two points
     */
    private calculateDistance(p1: Point, p2: Point): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Get priority for snap type (higher = more important)
     */
    private getSnapPriority(type: SnapType): number {
        const priorities: Record<SnapType, number> = {
            vertex: 10,        // Highest priority
            intersection: 9,
            midpoint: 8,
            center: 7,
            perpendicular: 6,
            tangent: 5,
            grid: 1            // Lowest priority
        };
        return priorities[type] || 0;
    }

    /**
     * Find all intersection points between walls
     */
    private findIntersections(walls: WallSegment[]): Point[] {
        const intersections: Point[] = [];

        for (let i = 0; i < walls.length; i++) {
            for (let j = i + 1; j < walls.length; j++) {
                const intersection = this.lineIntersection(
                    walls[i].start,
                    walls[i].end,
                    walls[j].start,
                    walls[j].end
                );
                if (intersection) {
                    intersections.push(intersection);
                }
            }
        }

        return intersections;
    }

    /**
     * Calculate intersection point between two line segments
     */
    private lineIntersection(
        p1: Point,
        p2: Point,
        p3: Point,
        p4: Point
    ): Point | null {
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (Math.abs(denom) < 0.0001) {
            return null; // Lines are parallel
        }

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        // Check if intersection is within both line segments
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }

        return null;
    }

    /**
     * Find perpendicular snap point on a line
     */
    findPerpendicularSnap(
        pointer: Point,
        wall: WallSegment
    ): SnapPoint | null {
        const { start, end } = wall;

        // Calculate perpendicular point
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) return null;

        const t = Math.max(0, Math.min(1,
            ((pointer.x - start.x) * dx + (pointer.y - start.y) * dy) / lengthSquared
        ));

        const perpPoint = {
            x: start.x + t * dx,
            y: start.y + t * dy
        };

        const distance = this.calculateDistance(perpPoint, pointer);

        if (distance <= this.settings.snapDistance) {
            return {
                ...perpPoint,
                type: 'perpendicular',
                elementId: wall.id,
                priority: this.getSnapPriority('perpendicular'),
                distance
            };
        }

        return null;
    }

    /**
     * Update snap settings
     */
    updateSettings(settings: Partial<SnapSettings>): void {
        this.settings = { ...this.settings, ...settings };
    }

    /**
     * Toggle snap type on/off
     */
    toggleSnapType(type: SnapType, enabled: boolean): void {
        if (enabled) {
            this.settings.enabledTypes.add(type);
        } else {
            this.settings.enabledTypes.delete(type);
        }
    }

    /**
     * Get current settings
     */
    getSettings(): SnapSettings {
        return { ...this.settings };
    }
}
