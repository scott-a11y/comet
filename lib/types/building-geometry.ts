export type BuildingVertex = {
  id: string;
  x: number;
  y: number;
};

export type BuildingWallSegment = {
  id: string;
  a: string; // vertex id
  b: string; // vertex id
  thickness?: number; // in feet, e.g. 0.5
  material?: 'brick' | 'concrete' | 'drywall';
};

export type BuildingFloorGeometry = {
  version: 1;
  vertices: BuildingVertex[];
  segments: BuildingWallSegment[];
  // Optional cached polygon ring (closed) derived from segments, in vertex id order
  // Optional cached polygon ring (closed) derived from segments, in vertex id order
  ringVertexIds?: string[];
  equipment?: Array<{
    id: string;
    name: string;
    x: number; // units
    y: number; // units
    width: number; // units
    depth: number; // units
    rotation: number; // degrees
  }>;
  systemRuns?: Array<{
    id: string;
    type: 'DUST' | 'AIR' | 'ELECTRICAL';
    points: Array<{ x: number, y: number }>; // Polyline points in units
    diameter?: number; // In feet (or units? typically units relative to scale) - let's say units for rendering
    meta?: Record<string, any>; // For flow data etc.
  }>;
};

export type BuildingFloorPlane = {
  // points in building-local “units” (Konva world units). Scale is stored separately.
  points: Array<{ x: number; y: number }>;
  closed: true;
};
