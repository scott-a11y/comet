export type BuildingVertex = {
  id: string;
  x: number;
  y: number;
};

export type BuildingWallSegment = {
  id: string;
  a: string; // vertex id
  b: string; // vertex id
};

export type BuildingFloorGeometry = {
  version: 1;
  vertices: BuildingVertex[];
  segments: BuildingWallSegment[];
  // Optional cached polygon ring (closed) derived from segments, in vertex id order
  ringVertexIds?: string[];
};

export type BuildingFloorPlane = {
  // points in building-local “units” (Konva world units). Scale is stored separately.
  points: Array<{ x: number; y: number }>;
  closed: true;
};
