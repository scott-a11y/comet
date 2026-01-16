import { FloorPlanData } from '@/lib/types/pdf-analysis';
import type { BuildingFloorGeometry, BuildingVertex, BuildingWallSegment } from '@/lib/types/building-geometry';

function newId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function convertAnalysisToGeometry(
    data: FloorPlanData,
    pixelsPerFoot: number = 20
): { geometry: BuildingFloorGeometry; scaleFtPerUnit: number } {

    // Scale factor: 1 unit (pixel) = 1/20 ft (default)
    // We convert all normalized coordinates (0-1) to canvas pixels

    const widthPx = data.width * pixelsPerFoot;
    const heightPx = data.length * pixelsPerFoot;
    const scaleFtPerUnit = 1 / pixelsPerFoot;

    const vertices: BuildingVertex[] = [];
    const segments: BuildingWallSegment[] = [];

    // Helper to find or create vertex at position
    // Uses a small threshold to merge close vertices
    const getVertexId = (xRatio: number, yRatio: number): string => {
        const x = xRatio * widthPx;
        const y = yRatio * heightPx;

        // Simple snapping (threshold 10px)
        const existing = vertices.find(v =>
            Math.abs(v.x - x) < 10 && Math.abs(v.y - y) < 10
        );

        if (existing) return existing.id;

        const id = newId('v');
        vertices.push({ id, x, y });
        return id;
    };

    if (data.walls) {
        data.walls.forEach(wall => {
            const idA = getVertexId(wall.startX, wall.startY);
            const idB = getVertexId(wall.endX, wall.endY);

            // Avoid duplicate segments or zero-length segments
            if (idA !== idB && !segments.some(s =>
                (s.a === idA && s.b === idB) || (s.a === idB && s.b === idA)
            )) {
                segments.push({
                    id: newId('s'),
                    a: idA,
                    b: idB,
                    material: 'drywall'
                });
            }
        });
    } else {
        // Fallback: Create a rectangle if no specific walls were detected but dimensions exist
        const v1 = getVertexId(0, 0);
        const v2 = getVertexId(1, 0);
        const v3 = getVertexId(1, 1);
        const v4 = getVertexId(0, 1);

        const addSeg = (a: string, b: string) => segments.push({ id: newId('s'), a, b, material: 'drywall' });

        addSeg(v1, v2);
        addSeg(v2, v3);
        addSeg(v3, v4);
        addSeg(v4, v1);
    }

    // TODO: Handle doors and windows (needs BuildingOpening type logic)

    return {
        geometry: {
            version: 1,
            vertices,
            segments,
        },
        scaleFtPerUnit
    };
}
