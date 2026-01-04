# Cabinet Design System - Mozaik-Like Functionality

**Project:** Comet Cabinet Designer  
**Date:** 2026-01-04  
**Goal:** Build a web-based cabinet design system with functionality similar to Mozaik

---

## Executive Summary

Based on analysis of the Mozaik installation, we'll build a modern web-based cabinet design system that includes:

- **Parametric cabinet generation** (wall, base, tall, closet cabinets)
- **3D visualization** with materials and hardware
- **Cut list generation** and optimization
- **Job management** and pricing
- **Export to manufacturing** (CNC, labels, assembly)

---

## Mozaik Feature Analysis

### Product Categories (from Product Libraries):
1. **Face Frame Cabinets** - Traditional American style
2. **Frameless Cabinets** - European/modern style
3. **Closets** - Wall-mount and floor-mount systems
4. **Cabinet Accessories** - Columns, panels, shelving
5. **Appliances** - Wall ovens, ranges, etc.
6. **Plumbing & Electrical** - Sinks, faucets, outlets

### Key Features Observed:
- Parametric product definitions (`.moz` files)
- Job-based organization (customer projects)
- Optimization engine (`Optimize.exe`)
- Assembly/cutlist app (`MozaikAssemblyCutlistApp.exe`)
- SketchUp integration for 3D models
- DXF import/export for floor plans

---

## System Architecture

### Technology Stack

```typescript
// Frontend
- Next.js 14+ (App Router)
- React Three Fiber (@react-three/fiber, @react-three/drei)
- Zustand (state management)
- TailwindCSS (styling)
- Konva (2D canvas for floor plans)

// Backend
- Next.js API routes
- PostgreSQL (Vercel Postgres)
- Prisma ORM
- Vercel Blob (3D models, textures)

// 3D & CAD
- Three.js (3D rendering)
- @jscad/modeling (parametric geometry)
- earcut (polygon triangulation)
- makerjs (2D CAD operations)

// Manufacturing
- CNC G-code generation
- PDF generation (cut lists, labels)
- CSV export (for optimization software)
```

---

## Database Schema

```prisma
// schema.prisma

model CabinetProduct {
  id          String   @id @default(cuid())
  name        String
  category    String   // "wall", "base", "tall", "closet"
  style       String   // "frameless", "faceframe"
  
  // Parametric definition
  parameters  Json     // { width: {min, max, default}, depth: {...}, ... }
  rules       Json     // Construction rules and constraints
  
  // 3D Model
  modelType   String   // "parametric" | "static"
  modelData   Json?    // Parametric generation rules
  modelUrl    String?  // Static 3D model URL
  
  // Materials & Hardware
  materials   Json     // Default materials
  hardware    Json     // Hinges, slides, pulls
  
  // Pricing
  baseCost    Float
  costFormula String?  // Formula for parametric pricing
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  instances   CabinetInstance[]
}

model Job {
  id          String   @id @default(cuid())
  name        String
  customer    String?
  
  // Room/Project info
  rooms       Room[]
  
  // Pricing
  totalCost   Float    @default(0)
  markup      Float    @default(1.4)
  
  // Status
  status      String   @default("design") // design, approved, production, complete
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  cabinets    CabinetInstance[]
}

model Room {
  id          String   @id @default(cuid())
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  
  name        String
  
  // Floor plan (2D)
  floorPlan   Json?    // Wall geometry from wall-editor
  
  cabinets    CabinetInstance[]
}

model CabinetInstance {
  id          String   @id @default(cuid())
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  roomId      String?
  room        Room?    @relation(fields: [roomId], references: [id])
  
  productId   String
  product     CabinetProduct @relation(fields: [productId], references: [id])
  
  // Instance-specific parameters
  width       Float
  height      Float
  depth       Float
  
  // Position in room
  x           Float
  y           Float
  z           Float    @default(0)
  rotation    Float    @default(0)
  
  // Customizations
  material    String?
  finish      String?
  hardware    Json?
  
  // Manufacturing
  parts       Part[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Part {
  id          String   @id @default(cuid())
  cabinetId   String
  cabinet     CabinetInstance @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  
  name        String   // "Left Side", "Top", "Door", etc.
  type        String   // "panel", "door", "drawer", "shelf"
  
  // Dimensions
  width       Float
  height      Float
  thickness   Float
  
  // Material
  material    String
  grain       String?  // "horizontal", "vertical"
  
  // Edgebanding
  edges       Json     // {top: "PVC", bottom: "none", left: "PVC", right: "PVC"}
  
  // Machining
  holes       Json[]   // Drilling operations
  grooves     Json[]   // Routing operations
  
  // Quantity
  quantity    Int      @default(1)
  
  // Optimization
  nestingGroup String? // For sheet optimization
  
  createdAt   DateTime @default(now())
}

model Material {
  id          String   @id @default(cuid())
  name        String
  type        String   // "plywood", "mdf", "melamine", "solid_wood"
  
  // Sheet dimensions
  sheetWidth  Float
  sheetLength Float
  thickness   Float
  
  // Pricing
  costPerSheet Float
  
  // Properties
  color       String?
  texture     String?
  textureUrl  String?
  
  createdAt   DateTime @default(now())
}
```

---

## Core Features

### 1. Parametric Cabinet Generator

```typescript
// lib/cabinet-generator/types.ts

export type CabinetParameters = {
  width: number;
  height: number;
  depth: number;
  style: 'frameless' | 'faceframe';
  doorStyle: 'slab' | 'shaker' | 'raised_panel';
  drawerCount?: number;
  shelfCount?: number;
};

export type CabinetPart = {
  name: string;
  type: 'panel' | 'door' | 'drawer_front' | 'drawer_box' | 'shelf';
  width: number;
  height: number;
  thickness: number;
  material: string;
  edges: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
  holes?: Hole[];
  grooves?: Groove[];
};

export type Hole = {
  x: number;
  y: number;
  diameter: number;
  depth: number;
  face: 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';
};

export type Groove = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  width: number;
  depth: number;
  face: 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';
};
```

```typescript
// lib/cabinet-generator/frameless-wall.ts

export class FramelessWallCabinet {
  constructor(private params: CabinetParameters) {}
  
  generate(): CabinetPart[] {
    const parts: CabinetPart[] = [];
    const { width, height, depth } = this.params;
    
    // Material thickness (19mm = 3/4")
    const t = 0.75;
    
    // 1. Sides (2x)
    parts.push({
      name: 'Left Side',
      type: 'panel',
      width: depth,
      height: height,
      thickness: t,
      material: 'melamine',
      edges: { top: 'none', bottom: 'none', left: 'PVC', right: 'none' },
      holes: this.generateSystemHoles(depth, height)
    });
    
    parts.push({
      name: 'Right Side',
      type: 'panel',
      width: depth,
      height: height,
      thickness: t,
      material: 'melamine',
      edges: { top: 'none', bottom: 'none', left: 'none', right: 'PVC' },
      holes: this.generateSystemHoles(depth, height)
    });
    
    // 2. Top
    parts.push({
      name: 'Top',
      type: 'panel',
      width: width,
      height: depth,
      thickness: t,
      material: 'melamine',
      edges: { top: 'PVC', bottom: 'none', left: 'none', right: 'none' }
    });
    
    // 3. Bottom
    parts.push({
      name: 'Bottom',
      type: 'panel',
      width: width,
      height: depth,
      thickness: t,
      material: 'melamine',
      edges: { top: 'none', bottom: 'PVC', left: 'none', right: 'none' }
    });
    
    // 4. Back (1/4" plywood)
    parts.push({
      name: 'Back',
      type: 'panel',
      width: width - (2 * 0.25), // Inset into dado
      height: height - (2 * 0.25),
      thickness: 0.25,
      material: 'plywood',
      edges: { top: 'none', bottom: 'none', left: 'none', right: 'none' },
      grooves: [] // Back sits in 1/4" dado
    });
    
    // 5. Doors
    const doorWidth = (width - 2) / 2; // 2mm gap
    parts.push({
      name: 'Left Door',
      type: 'door',
      width: doorWidth,
      height: height - 2,
      thickness: t,
      material: 'melamine',
      edges: { top: 'PVC', bottom: 'PVC', left: 'PVC', right: 'PVC' },
      holes: this.generateHingeHoles('left')
    });
    
    parts.push({
      name: 'Right Door',
      type: 'door',
      width: doorWidth,
      height: height - 2,
      thickness: t,
      material: 'melamine',
      edges: { top: 'PVC', bottom: 'PVC', left: 'PVC', right: 'PVC' },
      holes: this.generateHingeHoles('right')
    });
    
    // 6. Shelves (adjustable)
    const shelfCount = this.params.shelfCount || 2;
    for (let i = 0; i < shelfCount; i++) {
      parts.push({
        name: `Shelf ${i + 1}`,
        type: 'shelf',
        width: width - (2 * t) - 0.125, // Clearance
        height: depth - 0.75, // Front clearance
        thickness: t,
        material: 'melamine',
        edges: { top: 'none', bottom: 'none', left: 'PVC', right: 'PVC' }
      });
    }
    
    return parts;
  }
  
  private generateSystemHoles(depth: number, height: number): Hole[] {
    // 32mm system holes for adjustable shelves
    const holes: Hole[] = [];
    const spacing = 32 / 25.4; // 32mm in inches
    const offset = 1.5; // From front/back edges
    
    // Two rows of holes
    for (let row of [offset, depth - offset]) {
      for (let y = 3; y < height - 3; y += spacing) {
        holes.push({
          x: row,
          y: y,
          diameter: 5 / 25.4, // 5mm
          depth: 0.5,
          face: 'left' // or 'right' depending on side
        });
      }
    }
    
    return holes;
  }
  
  private generateHingeHoles(side: 'left' | 'right'): Hole[] {
    // European cup hinges (35mm)
    const holes: Hole[] = [];
    const cupDiameter = 35 / 25.4; // 35mm in inches
    const depth = 0.5; // 12-13mm typical
    
    // Top hinge
    holes.push({
      x: side === 'left' ? 0.875 : this.params.width - 0.875,
      y: 3,
      diameter: cupDiameter,
      depth: depth,
      face: 'back'
    });
    
    // Bottom hinge
    holes.push({
      x: side === 'left' ? 0.875 : this.params.width - 0.875,
      y: this.params.height - 3,
      diameter: cupDiameter,
      depth: depth,
      face: 'back'
    });
    
    return holes;
  }
  
  // Generate 3D model
  generate3D(): THREE.Group {
    const group = new THREE.Group();
    const parts = this.generate();
    
    // Create 3D meshes for each part
    // (Implementation using Three.js)
    
    return group;
  }
}
```

### 2. 3D Visualization Component

```typescript
// components/cabinet-designer/CabinetViewer3D.tsx

'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { CabinetModel } from './CabinetModel';

type Props = {
  cabinets: CabinetInstance[];
  selectedId?: string;
  onSelect?: (id: string) => void;
};

export function CabinetViewer3D({ cabinets, selectedId, onSelect }: Props) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        shadows
      >
        <color attach="background" args={['#f0f0f0']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        {/* Environment */}
        <Environment preset="apartment" />
        
        {/* Grid */}
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6e6e6e"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
        />
        
        {/* Cabinets */}
        {cabinets.map(cabinet => (
          <CabinetModel
            key={cabinet.id}
            cabinet={cabinet}
            isSelected={cabinet.id === selectedId}
            onClick={() => onSelect?.(cabinet.id)}
          />
        ))}
        
        {/* Controls */}
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
```

```typescript
// components/cabinet-designer/CabinetModel.tsx

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CabinetInstance } from '@prisma/client';

type Props = {
  cabinet: CabinetInstance;
  isSelected: boolean;
  onClick: () => void;
};

export function CabinetModel({ cabinet, isSelected, onClick }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate geometry based on cabinet parameters
  const geometry = useMemo(() => {
    return generateCabinetGeometry(cabinet);
  }, [cabinet]);
  
  return (
    <group
      ref={groupRef}
      position={[cabinet.x, cabinet.z, cabinet.y]}
      rotation={[0, cabinet.rotation * Math.PI / 180, 0]}
      onClick={onClick}
    >
      {/* Cabinet box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[cabinet.width, cabinet.height, cabinet.depth]} />
        <meshStandardMaterial
          color={isSelected ? '#fbbf24' : '#94a3b8'}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Selection outline */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(
            cabinet.width + 0.1,
            cabinet.height + 0.1,
            cabinet.depth + 0.1
          )]} />
          <lineBasicMaterial color="#fbbf24" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}
```

### 3. Cut List Generator

```typescript
// lib/manufacturing/cutlist.ts

export type CutListItem = {
  partName: string;
  width: number;
  height: number;
  thickness: number;
  material: string;
  edges: string;
  quantity: number;
  cabinetName: string;
  roomName: string;
};

export function generateCutList(job: Job): CutListItem[] {
  const items: CutListItem[] = [];
  
  for (const cabinet of job.cabinets) {
    for (const part of cabinet.parts) {
      items.push({
        partName: part.name,
        width: part.width,
        height: part.height,
        thickness: part.thickness,
        material: part.material,
        edges: formatEdges(part.edges),
        quantity: part.quantity,
        cabinetName: cabinet.product.name,
        roomName: cabinet.room?.name || 'Unassigned'
      });
    }
  }
  
  // Sort by material, then thickness, then size
  return items.sort((a, b) => {
    if (a.material !== b.material) return a.material.localeCompare(b.material);
    if (a.thickness !== b.thickness) return b.thickness - a.thickness;
    return (b.width * b.height) - (a.width * a.height);
  });
}

function formatEdges(edges: Part['edges']): string {
  const e = [];
  if (edges.top !== 'none') e.push('T');
  if (edges.bottom !== 'none') e.push('B');
  if (edges.left !== 'none') e.push('L');
  if (edges.right !== 'none') e.push('R');
  return e.join('');
}

// Export to CSV for optimization software
export function exportCutListCSV(items: CutListItem[]): string {
  const headers = ['Part Name', 'Width', 'Height', 'Thickness', 'Material', 'Edges', 'Qty', 'Cabinet', 'Room'];
  const rows = items.map(item => [
    item.partName,
    item.width.toFixed(3),
    item.height.toFixed(3),
    item.thickness.toFixed(3),
    item.material,
    item.edges,
    item.quantity,
    item.cabinetName,
    item.roomName
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
```

### 4. Sheet Optimization

```typescript
// lib/manufacturing/optimizer.ts

export type Sheet = {
  width: number;
  height: number;
  thickness: number;
  material: string;
};

export type Placement = {
  part: CutListItem;
  x: number;
  y: number;
  rotated: boolean;
};

export type OptimizedSheet = {
  sheet: Sheet;
  placements: Placement[];
  efficiency: number; // 0-1
  wasteArea: number;
};

export function optimizeSheets(
  parts: CutListItem[],
  availableSheets: Sheet[],
  sawKerf: number = 0.125 // 1/8" blade width
): OptimizedSheet[] {
  // Guillotine cutting algorithm
  const results: OptimizedSheet[] = [];
  
  // Group parts by material and thickness
  const groups = groupParts(parts);
  
  for (const [key, groupParts] of Object.entries(groups)) {
    const [material, thickness] = key.split('|');
    const sheet = availableSheets.find(
      s => s.material === material && s.thickness === parseFloat(thickness)
    );
    
    if (!sheet) continue;
    
    // Sort parts by area (largest first)
    const sorted = [...groupParts].sort((a, b) => 
      (b.width * b.height) - (a.width * a.height)
    );
    
    // Pack parts into sheets
    const packed = packParts(sorted, sheet, sawKerf);
    results.push(...packed);
  }
  
  return results;
}

function packParts(
  parts: CutListItem[],
  sheet: Sheet,
  sawKerf: number
): OptimizedSheet[] {
  const sheets: OptimizedSheet[] = [];
  let currentSheet: OptimizedSheet = {
    sheet,
    placements: [],
    efficiency: 0,
    wasteArea: sheet.width * sheet.height
  };
  
  // Simple guillotine packing
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  
  for (const part of parts) {
    let placed = false;
    
    // Try normal orientation
    if (x + part.width <= sheet.width && y + part.height <= sheet.height) {
      currentSheet.placements.push({ part, x, y, rotated: false });
      x += part.width + sawKerf;
      rowHeight = Math.max(rowHeight, part.height);
      placed = true;
    }
    // Try rotated
    else if (x + part.height <= sheet.width && y + part.width <= sheet.height) {
      currentSheet.placements.push({ part, x, y, rotated: true });
      x += part.height + sawKerf;
      rowHeight = Math.max(rowHeight, part.width);
      placed = true;
    }
    // Move to next row
    else if (y + rowHeight + sawKerf + part.height <= sheet.height) {
      y += rowHeight + sawKerf;
      x = 0;
      rowHeight = 0;
      
      currentSheet.placements.push({ part, x, y, rotated: false });
      x += part.width + sawKerf;
      rowHeight = part.height;
      placed = true;
    }
    
    // Need new sheet
    if (!placed) {
      calculateEfficiency(currentSheet);
      sheets.push(currentSheet);
      
      currentSheet = {
        sheet,
        placements: [{ part, x: 0, y: 0, rotated: false }],
        efficiency: 0,
        wasteArea: sheet.width * sheet.height
      };
      x = part.width + sawKerf;
      y = 0;
      rowHeight = part.height;
    }
  }
  
  if (currentSheet.placements.length > 0) {
    calculateEfficiency(currentSheet);
    sheets.push(currentSheet);
  }
  
  return sheets;
}

function calculateEfficiency(sheet: OptimizedSheet) {
  const totalArea = sheet.sheet.width * sheet.sheet.height;
  const usedArea = sheet.placements.reduce((sum, p) => 
    sum + (p.part.width * p.part.height), 0
  );
  sheet.efficiency = usedArea / totalArea;
  sheet.wasteArea = totalArea - usedArea;
}

function groupParts(parts: CutListItem[]): Record<string, CutListItem[]> {
  const groups: Record<string, CutListItem[]> = {};
  
  for (const part of parts) {
    const key = `${part.material}|${part.thickness}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(part);
  }
  
  return groups;
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up database schema
- [ ] Create basic cabinet product models
- [ ] Build parametric cabinet generator for wall cabinets
- [ ] Implement basic 3D viewer
- [ ] Create job management UI

### Phase 2: Cabinet Library (Week 3-4)
- [ ] Implement frameless wall cabinets (1-door, 2-door)
- [ ] Implement frameless base cabinets
- [ ] Implement frameless tall cabinets
- [ ] Add drawer systems
- [ ] Create material library

### Phase 3: Manufacturing (Week 5-6)
- [ ] Cut list generation
- [ ] Sheet optimization algorithm
- [ ] PDF export for cut lists
- [ ] Label generation
- [ ] CNC export (basic)

### Phase 4: Advanced Features (Week 7-8)
- [ ] Face frame cabinets
- [ ] Closet systems
- [ ] Hardware library (hinges, slides, pulls)
- [ ] Pricing calculator
- [ ] Room layout tool (integrate with wall-editor)

### Phase 5: Polish (Week 9-10)
- [ ] Advanced 3D rendering (materials, textures)
- [ ] Assembly instructions
- [ ] Customer presentation mode
- [ ] Export to various formats
- [ ] Mobile optimization

---

## Next Steps

1. **Review & Approve** this plan
2. **Start with Phase 1** - Database and basic cabinet generator
3. **Iterate** based on your specific needs

Would you like me to:
1. Start implementing Phase 1?
2. Create more detailed specs for a specific feature?
3. Build a prototype of the cabinet generator?
4. Something else?
