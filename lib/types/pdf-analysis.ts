// Types for PDF floor plan analysis with AI vision

export interface WallPosition {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness?: number; // in feet
}

export interface DoorWindow {
  type: 'door' | 'window';
  x: number;
  y: number;
  width: number; // in feet
  height: number; // in feet
  orientation?: number; // degrees
}

export interface EquipmentPlacement {
  name: string;
  x: number;
  y: number;
  width: number; // in feet
  height: number; // in feet
  category?: string;
}

export interface FloorPlanData {
  width: number;
  length: number;
  height?: number;
  summary: string;
}

// Legacy interface for backward compatibility
export interface DetailedFloorPlanData {
  dimensions: {
    width: number; // in feet
    length: number; // in feet
    height?: number; // in feet (ceiling height)
  };
  scale?: {
    unit: 'feet' | 'inches' | 'meters' | 'centimeters';
    pixelsPerUnit?: number;
  };
  walls: WallPosition[];
  doors: DoorWindow[];
  windows: DoorWindow[];
  equipment: EquipmentPlacement[];
  labels?: string[]; // any text labels found in the plan
  notes?: string; // additional observations from AI analysis
}

export interface PDFAnalysisResponse {
  success: boolean;
  data?: FloorPlanData;
  error?: string;
  confidence?: number; // AI confidence score 0-1
}

export interface PDFUploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}
