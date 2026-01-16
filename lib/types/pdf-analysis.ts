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
  detectedEquipment?: Array<{
    type: string;
    confidence: number;
    position: { x: number; y: number };
    estimatedDimensions?: { width: number; depth: number };
  }>;
  detectedPorts?: Array<{
    type: 'electrical' | 'dust' | 'pneumatic';
    position: { x: number; y: number };
  }>;
  walls?: Array<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }>;
  doors?: Array<{
    x: number;
    y: number;
    width?: number;
  }>;
  windows?: Array<{
    x: number;
    y: number;
    width?: number;
  }>;
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
