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
  material?: 'brick' | 'concrete' | 'drywall' | 'wood' | 'steel' | 'glass';
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

export type ComponentCategory = 'furniture' | 'cabinet' | 'machinery' | 'equipment' | 'storage';

export type Component = {
  id: string;
  category: ComponentCategory;
  name: string; // e.g., "Table Saw", "Workbench", "Cabinet"
  x: number; // grid units
  y: number; // grid units
  width: number; // feet
  depth: number; // feet
  height?: number; // feet (for 3D visualization)
  rotation: number; // degrees (0, 90, 180, 270)
  color?: string; // hex color for rendering
  metadata?: {
    manufacturer?: string;
    model?: string;
    powerRequirement?: string;
    notes?: string;
  };
};

export type SystemRun = {
  id: string;
  type: 'ELECTRICAL' | 'HVAC' | 'PLUMBING' | 'DUST_COLLECTION' | 'COMPRESSED_AIR';
  points: Array<{ x: number, y: number }>;
  status?: 'planned' | 'installed' | 'inspected';
  diameter?: number; // in inches for ducts/pipes
  gauge?: string; // wire gauge for electrical
  metadata?: {
    voltage?: number;
    amperage?: number;
    flowRate?: number;
    pressure?: number;
    notes?: string;
  };
};

export type LayerVisibility = {
  walls: boolean;
  openings: boolean;
  electrical: boolean;
  hvac: boolean;
  plumbing: boolean;
  dustCollection: boolean;
  compressedAir: boolean;
  components: boolean;
  measurements: boolean;
};

export type BuildingFloorGeometry = {
  version: 1;
  vertices: BuildingVertex[];
  segments: BuildingWallSegment[];
  openings?: BuildingOpening[];
  electricalEntries?: ElectricalEntry[];
  components?: Component[];
  systemRuns?: SystemRun[];
  layerVisibility?: LayerVisibility;
  ringVertexIds?: string[];
};

export type BuildingFloorPlane = {
  // points in building-local “units” (Konva world units). Scale is stored separately.
  points: Array<{ x: number; y: number }>;
  closed: true;
};
