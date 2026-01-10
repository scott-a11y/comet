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

export type BuildingOpening = {
  id: string;
  segmentId: string;
  type: 'door' | 'window';
  position: number; // 0.0 to 1.0 along the segment from a to b
  width: number; // in feet
};

export type ElectricalEntry = {
  id: string;
  x: number;
  y: number;
  type: 'single-phase' | 'three-phase';
  voltage: number; // e.g. 120, 240, 480
  amps: number; // e.g. 100, 200, 400
};

export type BuildingFloorGeometry = {
  version: 1;
  vertices: BuildingVertex[];
  segments: BuildingWallSegment[];
  openings?: BuildingOpening[];
  electricalEntries?: ElectricalEntry[];
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
