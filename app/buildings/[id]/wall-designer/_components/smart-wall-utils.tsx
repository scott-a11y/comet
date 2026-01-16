'use client';

import type { BuildingVertex, BuildingWallSegment } from '@/lib/types/building-geometry';

export interface Room {
    id: string;
    name: string;
    vertices: string[]; // Vertex IDs in order
    area: number; // Square feet
    perimeter: number; // Feet
    centroid: { x: number; y: number };
    type?: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'office' | 'storage' | 'hallway' | 'other';
}

export interface WallCleanupResult {
    mergedSegments: BuildingWallSegment[];
    removedVertices: string[];
    fixedJunctions: Array<{
        vertexId: string;
        connectedSegments: string[];
    }>;
}

/**
 * Detect closed rooms from wall segments
 */
export function detectRooms(
    vertices: BuildingVertex[],
    segments: BuildingWallSegment[],
    scaleFtPerUnit: number = 0.05
): Room[] {
    const rooms: Room[] = [];
    const visitedSegments = new Set<string>();

    // Build adjacency map
    const adjacencyMap = new Map<string, string[]>();
    segments.forEach(seg => {
        if (!adjacencyMap.has(seg.a)) adjacencyMap.set(seg.a, []);
        if (!adjacencyMap.has(seg.b)) adjacencyMap.set(seg.b, []);
        adjacencyMap.get(seg.a)!.push(seg.b);
        adjacencyMap.get(seg.b)!.push(seg.a);
    });

    // Find all cycles (closed loops)
    function findCycle(startVertex: string, visited: Set<string>, path: string[]): string[] | null {
        if (path.length > 2 && path[path.length - 1] === startVertex) {
            return path;
        }

        const neighbors = adjacencyMap.get(path[path.length - 1]) || [];
        for (const neighbor of neighbors) {
            if (visited.has(neighbor) && neighbor !== startVertex) continue;
            if (path.length > 2 && neighbor === startVertex) {
                return [...path, neighbor];
            }

            visited.add(neighbor);
            const result = findCycle(startVertex, visited, [...path, neighbor]);
            if (result) return result;
            visited.delete(neighbor);
        }

        return null;
    }

    // Try to find cycles starting from each vertex
    vertices.forEach(vertex => {
        const visited = new Set<string>([vertex.id]);
        const cycle = findCycle(vertex.id, visited, [vertex.id]);

        if (cycle && cycle.length >= 4) { // At least 3 vertices + return to start
            const uniqueCycle = cycle.slice(0, -1); // Remove duplicate start vertex

            // Check if this is a new room (not already found)
            const cycleSet = new Set(uniqueCycle);
            const isNewRoom = !rooms.some(room => {
                const roomSet = new Set(room.vertices);
                return cycleSet.size === roomSet.size &&
                    [...cycleSet].every(v => roomSet.has(v));
            });

            if (isNewRoom) {
                const roomVertices = uniqueCycle.map(id =>
                    vertices.find(v => v.id === id)!
                );

                // Calculate area using shoelace formula
                let area = 0;
                for (let i = 0; i < roomVertices.length; i++) {
                    const j = (i + 1) % roomVertices.length;
                    area += roomVertices[i].x * roomVertices[j].y;
                    area -= roomVertices[j].x * roomVertices[i].y;
                }
                area = Math.abs(area / 2);

                // Convert to square feet
                const areaFt = area * (scaleFtPerUnit * scaleFtPerUnit);

                // Calculate perimeter
                let perimeter = 0;
                for (let i = 0; i < roomVertices.length; i++) {
                    const j = (i + 1) % roomVertices.length;
                    const dx = roomVertices[j].x - roomVertices[i].x;
                    const dy = roomVertices[j].y - roomVertices[i].y;
                    perimeter += Math.sqrt(dx * dx + dy * dy);
                }
                const perimeterFt = perimeter * scaleFtPerUnit;

                // Calculate centroid
                const centroid = {
                    x: roomVertices.reduce((sum, v) => sum + v.x, 0) / roomVertices.length,
                    y: roomVertices.reduce((sum, v) => sum + v.y, 0) / roomVertices.length
                };

                // Guess room type based on area
                let type: Room['type'] = 'other';
                if (areaFt < 50) type = 'bathroom';
                else if (areaFt < 150) type = 'bedroom';
                else if (areaFt < 250) type = 'living';
                else if (areaFt < 400) type = 'office';
                else type = 'storage';

                rooms.push({
                    id: `room_${rooms.length + 1}`,
                    name: `Room ${rooms.length + 1}`,
                    vertices: uniqueCycle,
                    area: areaFt,
                    perimeter: perimeterFt,
                    centroid,
                    type
                });
            }
        }
    });

    return rooms;
}

/**
 * Clean up walls by merging collinear segments and removing duplicate vertices
 */
export function cleanupWalls(
    vertices: BuildingVertex[],
    segments: BuildingWallSegment[],
    tolerance: number = 0.1
): WallCleanupResult {
    const result: WallCleanupResult = {
        mergedSegments: [...segments],
        removedVertices: [],
        fixedJunctions: []
    };

    // 1. Merge collinear segments
    let changed = true;
    while (changed) {
        changed = false;

        for (let i = 0; i < result.mergedSegments.length; i++) {
            const seg1 = result.mergedSegments[i];

            for (let j = i + 1; j < result.mergedSegments.length; j++) {
                const seg2 = result.mergedSegments[j];

                // Check if segments share a vertex
                const sharedVertex =
                    seg1.b === seg2.a ? seg1.b :
                        seg1.a === seg2.b ? seg1.a :
                            seg1.b === seg2.b ? seg1.b :
                                seg1.a === seg2.a ? seg1.a :
                                    null;

                if (!sharedVertex) continue;

                // Get the vertices
                const v1 = vertices.find(v => v.id === (seg1.a === sharedVertex ? seg1.b : seg1.a))!;
                const vShared = vertices.find(v => v.id === sharedVertex)!;
                const v2 = vertices.find(v => v.id === (seg2.a === sharedVertex ? seg2.b : seg2.a))!;

                // Check if collinear
                const angle1 = Math.atan2(vShared.y - v1.y, vShared.x - v1.x);
                const angle2 = Math.atan2(v2.y - vShared.y, v2.x - vShared.x);
                const angleDiff = Math.abs(angle1 - angle2);

                if (angleDiff < tolerance || Math.abs(angleDiff - Math.PI) < tolerance) {
                    // Merge segments
                    const newSegment: BuildingWallSegment = {
                        id: seg1.id,
                        a: v1.id,
                        b: v2.id,
                        material: seg1.material,
                        thickness: seg1.thickness
                    };

                    result.mergedSegments = result.mergedSegments.filter(
                        s => s.id !== seg1.id && s.id !== seg2.id
                    );
                    result.mergedSegments.push(newSegment);
                    result.removedVertices.push(sharedVertex);

                    changed = true;
                    break;
                }
            }

            if (changed) break;
        }
    }

    // 2. Fix T-junctions
    vertices.forEach(vertex => {
        const connectedSegments = segments.filter(
            s => s.a === vertex.id || s.b === vertex.id
        );

        if (connectedSegments.length === 3) {
            // This is a T-junction
            result.fixedJunctions.push({
                vertexId: vertex.id,
                connectedSegments: connectedSegments.map(s => s.id)
            });
        }
    });

    return result;
}

/**
 * Auto-close a room by finding the shortest path between two vertices
 */
export function autoCloseRoom(
    startVertexId: string,
    endVertexId: string,
    vertices: BuildingVertex[],
    segments: BuildingWallSegment[]
): BuildingWallSegment | null {
    const start = vertices.find(v => v.id === startVertexId);
    const end = vertices.find(v => v.id === endVertexId);

    if (!start || !end) return null;

    // Check if they're already connected
    const existing = segments.find(
        s => (s.a === startVertexId && s.b === endVertexId) ||
            (s.b === startVertexId && s.a === endVertexId)
    );

    if (existing) return null;

    // Create new segment
    return {
        id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        a: startVertexId,
        b: endVertexId,
        material: 'drywall',
        thickness: 0.5
    };
}

/**
 * Find gaps in walls (vertices that should be connected)
 */
export function findWallGaps(
    vertices: BuildingVertex[],
    segments: BuildingWallSegment[],
    maxGapDistance: number = 1.0
): Array<{ v1: string; v2: string; distance: number }> {
    const gaps: Array<{ v1: string; v2: string; distance: number }> = [];

    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            const v1 = vertices[i];
            const v2 = vertices[j];

            // Check if already connected
            const connected = segments.some(
                s => (s.a === v1.id && s.b === v2.id) || (s.b === v1.id && s.a === v2.id)
            );

            if (!connected) {
                const dx = v2.x - v1.x;
                const dy = v2.y - v1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= maxGapDistance) {
                    gaps.push({
                        v1: v1.id,
                        v2: v2.id,
                        distance
                    });
                }
            }
        }
    }

    return gaps.sort((a, b) => a.distance - b.distance);
}

/**
 * Suggest room names based on area and shape
 */
export function suggestRoomName(room: Room): string {
    const { area, type } = room;

    if (type === 'bathroom') {
        if (area < 30) return 'Powder Room';
        if (area < 50) return 'Half Bath';
        return 'Full Bath';
    }

    if (type === 'bedroom') {
        if (area < 100) return 'Small Bedroom';
        if (area < 150) return 'Bedroom';
        return 'Master Bedroom';
    }

    if (type === 'kitchen') {
        if (area < 100) return 'Kitchenette';
        if (area < 200) return 'Kitchen';
        return 'Large Kitchen';
    }

    if (type === 'living') {
        if (area < 150) return 'Living Room';
        if (area < 300) return 'Great Room';
        return 'Grand Hall';
    }

    if (type === 'office') {
        if (area < 100) return 'Office';
        if (area < 200) return 'Study';
        return 'Library';
    }

    if (type === 'hallway') {
        return 'Hallway';
    }

    if (type === 'storage') {
        if (area < 50) return 'Closet';
        if (area < 100) return 'Storage';
        return 'Warehouse';
    }

    return `Room (${Math.round(area)} sq ft)`;
}
