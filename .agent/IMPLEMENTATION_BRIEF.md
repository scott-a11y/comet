# 🎯 Implementation Brief: 3D Collision Detection - UI Slice

**Worktree:** `worktrees/comet-ui`  
**Branch:** `feature/3d-collision-ui`  
**Focus:** Three.js collision detection with visual feedback  
**Estimated Effort:** 4-6 hours
# 🎯 Implementation Brief: 3D Collision Detection - API Slice

**Worktree:** `worktrees/comet-api`  
**Branch:** `feature/3d-collision-api`  
**Focus:** Layout persistence for collision metadata  
**Estimated Effort:** 3-4 hours

---

## 📋 **Objective**

Implement real-time collision detection for equipment in the 3D scene with visual feedback (red highlighting, collision warnings) when equipment overlaps.
Implement server-side validation and persistence for equipment collision data, ensuring layouts cannot be saved with overlapping equipment and storing collision metadata for analysis.

---

## 🎯 **Acceptance Criteria**

1. ✅ Equipment bounding boxes detect overlaps in real-time
2. ✅ Colliding equipment highlights in red
3. ✅ Non-colliding equipment shows normal colors
4. ✅ Collision state updates when equipment is moved/rotated
5. ✅ Visual indicator shows number of active collisions
6. ✅ Performance: <16ms per frame (60 FPS) with 50+ equipment items
7. ✅ TypeScript: Zero type errors
8. ✅ No console warnings or errors
1. ✅ Server validates equipment positions before saving layout
2. ✅ API returns collision errors with specific equipment IDs
3. ✅ Collision metadata persists in database
4. ✅ Layout history tracks collision-free status
5. ✅ API endpoint returns collision report for existing layouts
6. ✅ TypeScript: Zero type errors
7. ✅ All validation tests pass
8. ✅ Database migrations apply successfully

---

## 📁 **Files to Modify**

### **1. Create: `lib/3d/collision-detection.ts`**
**Purpose:** Core collision detection logic

```typescript
import * as THREE from 'three';

export interface CollisionBox {
  id: string;
  box: THREE.Box3;
  position: THREE.Vector3;
  dimensions: { width: number; height: number; depth: number };
}

export interface CollisionResult {
  hasCollision: boolean;
  collidingPairs: Array<{ id1: string; id2: string }>;
  collisionCount: number;
}

export class CollisionDetector {
  private boxes: Map<string, CollisionBox>;
  
  constructor();
  
  // Add or update equipment bounding box
  updateBox(id: string, position: THREE.Vector3, dimensions: {...}): void;
  
  // Remove equipment from collision detection
  removeBox(id: string): void;
  
  // Check all collisions
  detectCollisions(): CollisionResult;
  
  // Check if specific equipment is colliding
  isColliding(id: string): boolean;
  
  // Get all equipment IDs colliding with specific equipment
  getCollidingWith(id: string): string[];
}
```

**Key Implementation Details:**
- Use `THREE.Box3` for axis-aligned bounding boxes (AABB)
- Implement broad-phase spatial hashing for performance
- Cache collision results between frames
- Support rotation by updating box bounds

---

### **2. Modify: `components/3d/EquipmentModel.tsx`**
**Purpose:** Add collision visual feedback

**Changes:**
```typescript
interface EquipmentModelProps {
  item: Equipment;
  position?: [number, number, number]; // NEW: Accept position from parent
  isColliding?: boolean; // NEW: Collision state
  onBoundsUpdate?: (id: string, bounds: THREE.Box3) => void; // NEW: Report bounds
}

export function EquipmentModel({ 
  item, 
  position = [0, 0, 0],
  isColliding = false,
  onBoundsUpdate 
}: EquipmentModelProps) {
  // ... existing code ...
  
  // NEW: Update collision detector when position/size changes
  useEffect(() => {
    if (meshRef.current && onBoundsUpdate) {
      const box = new THREE.Box3().setFromObject(meshRef.current);
      onBoundsUpdate(item.id.toString(), box);
    }
  }, [position, item.widthFt, item.depthFt, orientation]);
  
  // NEW: Collision color override
  const color = useMemo(() => {
    if (isColliding) return "#ef4444"; // Red for collision
    if (hovered) return "#fbbf24"; // Yellow when hovered
    // ... existing color logic ...
  }, [category, hovered, isColliding]);
  
  // NEW: Add collision outline
  {isColliding && (
    <lineSegments position={[0, height / 2, 0]}>
      <edgesGeometry args={[new THREE.BoxGeometry(widthFt, height, depthFt)]} />
      <lineBasicMaterial color="#ef4444" linewidth={4} />
    </lineSegments>
  )}
}
```

---

### **3. Modify: `components/3d/Scene.tsx`**
**Purpose:** Integrate collision detection into scene

**Changes:**
```typescript
'use client';

import { CollisionDetector } from '@/lib/3d/collision-detection';
import { useState, useEffect, useRef } from 'react';

export function Scene({ equipment, building }: SceneProps) {
  const [collisionState, setCollisionState] = useState<Map<string, boolean>>(new Map());
  const collisionDetector = useRef(new CollisionDetector());
  
  // NEW: Handle bounds updates from equipment
  const handleBoundsUpdate = useCallback((id: string, bounds: THREE.Box3) => {
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    bounds.getCenter(center);
    bounds.getSize(size);
    
    collisionDetector.current.updateBox(id, center, {
      width: size.x,
      height: size.y,
      depth: size.z
    });
    
    // Check collisions
    const result = collisionDetector.current.detectCollisions();
    
    // Update collision state
    const newState = new Map<string, boolean>();
    equipment.forEach(eq => {
      newState.set(eq.id.toString(), collisionDetector.current.isColliding(eq.id.toString()));
    });
    setCollisionState(newState);
  }, [equipment]);
  
  return (
    <Canvas>
      {/* NEW: Collision warning UI */}
      {collisionState.size > 0 && Array.from(collisionState.values()).some(v => v) && (
        <Html position={[0, 20, 0]} center>
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            ⚠️ {Array.from(collisionState.values()).filter(v => v).length} Collision(s) Detected
          </div>
        </Html>
      )}
      
      {/* Render equipment with collision state */}
      {equipment.map(eq => (
        <EquipmentModel
          key={eq.id}
          item={eq}
          position={[eq.x || 0, 0, eq.y || 0]}
          isColliding={collisionState.get(eq.id.toString()) || false}
          onBoundsUpdate={handleBoundsUpdate}
        />
      ))}
    </Canvas>
  );
}
```

---

### **4. Create: `hooks/use-collision-detection.ts`**
**Purpose:** React hook for collision detection

```typescript
import { useRef, useCallback, useState } from 'react';
import { CollisionDetector, CollisionResult } from '@/lib/3d/collision-detection';
import * as THREE from 'three';

export function useCollisionDetection() {
  const detector = useRef(new CollisionDetector());
  const [collisions, setCollisions] = useState<CollisionResult>({
    hasCollision: false,
    collidingPairs: [],
    collisionCount: 0
  });
  
  const updateBounds = useCallback((id: string, bounds: THREE.Box3) => {
    // ... implementation ...
    const result = detector.current.detectCollisions();
    setCollisions(result);
  }, []);
  
  const removeBounds = useCallback((id: string) => {
    detector.current.removeBox(id);
    const result = detector.current.detectCollisions();
    setCollisions(result);
  }, []);
  
  return {
    collisions,
    updateBounds,
    removeBounds,
    isColliding: (id: string) => detector.current.isColliding(id)
  };
### **1. Create: `prisma/migrations/[timestamp]_add_collision_metadata/migration.sql`**
**Purpose:** Add collision tracking to database

```sql
-- Add collision metadata to LayoutInstance
ALTER TABLE "layout_instances" 
ADD COLUMN "has_collisions" BOOLEAN DEFAULT false,
ADD COLUMN "collision_count" INTEGER DEFAULT 0,
ADD COLUMN "collision_data" JSONB;

-- Add collision validation timestamp
ALTER TABLE "layout_instances"
ADD COLUMN "last_collision_check" TIMESTAMP;

-- Create index for collision queries
CREATE INDEX "idx_layout_collisions" ON "layout_instances"("has_collisions");

-- Add comment
COMMENT ON COLUMN "layout_instances"."collision_data" IS 
'JSON array of collision pairs: [{"eq1": id, "eq2": id, "overlap": area}]';
```

---

### **2. Update: `prisma/schema.prisma`**
**Purpose:** Add collision fields to schema

```prisma
model LayoutInstance {
  id                 Int                       @id @default(autoincrement())
  shopBuildingId     Int                       @map("shop_building_id")
  name               String
  createdAt          DateTime                  @default(now()) @map("created_at")
  updatedAt          DateTime                  @updatedAt @map("updated_at")
  
  // NEW: Collision tracking
  hasCollisions      Boolean                   @default(false) @map("has_collisions")
  collisionCount     Int                       @default(0) @map("collision_count")
  collisionData      Json?                     @map("collision_data")
  lastCollisionCheck DateTime?                 @map("last_collision_check")
  
  shopBuilding       ShopBuilding              @relation(fields: [shopBuildingId], references: [id], onDelete: Cascade)
  equipmentPositions EquipmentLayoutPosition[]
  dustRuns           DustRun[]
  airRuns            AirRun[]
  circuits           ElectricalCircuit[]
  systemRuns         SystemRun[]

  @@index([shopBuildingId])
  @@index([createdAt])
  @@index([hasCollisions]) // NEW
  @@map("layout_instances")
}
```

---

### **3. Create: `lib/validations/collision.ts`**
**Purpose:** Server-side collision validation logic

```typescript
import { z } from 'zod';

export const collisionCheckSchema = z.object({
  layoutId: z.number().int().positive(),
  equipmentPositions: z.array(z.object({
    equipmentId: z.number().int(),
    x: z.number(),
    y: z.number(),
    orientation: z.number().min(0).max(360),
    widthFt: z.number().positive(),
    depthFt: z.number().positive()
  }))
});

export interface CollisionPair {
  equipment1Id: number;
  equipment2Id: number;
  overlapArea: number;
  equipment1Name: string;
  equipment2Name: string;
}

export interface CollisionValidationResult {
  isValid: boolean;
  hasCollisions: boolean;
  collisionCount: number;
  collisions: CollisionPair[];
  message: string;
}

export class CollisionValidator {
  /**
   * Check if two rectangles overlap (AABB collision)
   */
  static checkRectangleOverlap(
    rect1: { x: number; y: number; width: number; depth: number; rotation: number },
    rect2: { x: number; y: number; width: number; depth: number; rotation: number }
  ): { overlaps: boolean; area: number } {
    // For MVP: Assume axis-aligned (ignore rotation)
    // Calculate bounds
    const r1 = {
      left: rect1.x - rect1.width / 2,
      right: rect1.x + rect1.width / 2,
      top: rect1.y - rect1.depth / 2,
      bottom: rect1.y + rect1.depth / 2
    };
    
    const r2 = {
      left: rect2.x - rect2.width / 2,
      right: rect2.x + rect2.width / 2,
      top: rect2.y - rect2.depth / 2,
      bottom: rect2.y + rect2.depth / 2
    };
    
    // Check overlap
    const overlaps = !(
      r1.right < r2.left ||
      r1.left > r2.right ||
      r1.bottom < r2.top ||
      r1.top > r2.bottom
    );
    
    if (!overlaps) return { overlaps: false, area: 0 };
    
    // Calculate overlap area
    const overlapWidth = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
    const overlapDepth = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
    const area = overlapWidth * overlapDepth;
    
    return { overlaps: true, area };
  }
  
  /**
   * Validate entire layout for collisions
   */
  static async validateLayout(
    layoutId: number,
    equipmentPositions: Array<{
      equipmentId: number;
      x: number;
      y: number;
      orientation: number;
      equipment: { widthFt: number; depthFt: number; name: string };
    }>
  ): Promise<CollisionValidationResult> {
    const collisions: CollisionPair[] = [];
    
    // Check all pairs
    for (let i = 0; i < equipmentPositions.length; i++) {
      for (let j = i + 1; j < equipmentPositions.length; j++) {
        const eq1 = equipmentPositions[i];
        const eq2 = equipmentPositions[j];
        
        const result = this.checkRectangleOverlap(
          {
            x: eq1.x,
            y: eq1.y,
            width: eq1.equipment.widthFt,
            depth: eq1.equipment.depthFt,
            rotation: eq1.orientation
          },
          {
            x: eq2.x,
            y: eq2.y,
            width: eq2.equipment.widthFt,
            depth: eq2.equipment.depthFt,
            rotation: eq2.orientation
          }
        );
        
        if (result.overlaps) {
          collisions.push({
            equipment1Id: eq1.equipmentId,
            equipment2Id: eq2.equipmentId,
            overlapArea: result.area,
            equipment1Name: eq1.equipment.name,
            equipment2Name: eq2.equipment.name
          });
        }
      }
    }
    
    return {
      isValid: collisions.length === 0,
      hasCollisions: collisions.length > 0,
      collisionCount: collisions.length,
      collisions,
      message: collisions.length === 0
        ? 'Layout is collision-free'
        : `Found ${collisions.length} collision(s)`
    };
  }
}
```

---

### **4. Create: `actions/validate-layout-collisions.ts`**
**Purpose:** Server action for collision validation

```typescript
'use server';

import { createServerAction } from 'zsa';
import { prisma } from '@/lib/prisma';
import { CollisionValidator, collisionCheckSchema } from '@/lib/validations/collision';

export const validateLayoutCollisions = createServerAction()
  .input(collisionCheckSchema)
  .handler(async ({ input }) => {
    const { layoutId, equipmentPositions } = input;
    
    // Get equipment details
    const equipmentIds = equipmentPositions.map(p => p.equipmentId);
    const equipment = await prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      select: { id: true, name: true, widthFt: true, depthFt: true }
    });
    
    // Merge positions with equipment data
    const positionsWithEquipment = equipmentPositions.map(pos => {
      const eq = equipment.find(e => e.id === pos.equipmentId);
      if (!eq) throw new Error(`Equipment ${pos.equipmentId} not found`);
      
      return {
        ...pos,
        equipment: eq
      };
    });
    
    // Validate collisions
    const result = await CollisionValidator.validateLayout(
      layoutId,
      positionsWithEquipment
    );
    
    // Update layout collision metadata
    await prisma.layoutInstance.update({
      where: { id: layoutId },
      data: {
        hasCollisions: result.hasCollisions,
        collisionCount: result.collisionCount,
        collisionData: result.collisions,
        lastCollisionCheck: new Date()
      }
    });
    
    return result;
  });
```

---

### **5. Create: `app/api/layouts/[id]/collisions/route.ts`**
**Purpose:** REST API endpoint for collision checking

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CollisionValidator } from '@/lib/validations/collision';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const layoutId = parseInt(params.id);
    
    // Get layout with equipment positions
    const layout = await prisma.layoutInstance.findUnique({
      where: { id: layoutId },
      include: {
        equipmentPositions: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                widthFt: true,
                depthFt: true
              }
            }
          }
        }
      }
    });
    
    if (!layout) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }
    
    // Validate collisions
    const result = await CollisionValidator.validateLayout(
      layoutId,
      layout.equipmentPositions
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Collision check error:', error);
    return NextResponse.json(
      { error: 'Failed to check collisions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const layoutId = parseInt(params.id);
    const body = await request.json();
    
    // Validate and save collision data
    const result = await CollisionValidator.validateLayout(
      layoutId,
      body.equipmentPositions
    );
    
    // Update layout
    await prisma.layoutInstance.update({
      where: { id: layoutId },
      data: {
        hasCollisions: result.hasCollisions,
        collisionCount: result.collisionCount,
        collisionData: result.collisions,
        lastCollisionCheck: new Date()
      }
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Collision save error:', error);
    return NextResponse.json(
      { error: 'Failed to save collision data' },
      { status: 500 }
    );
  }
}
```

---

## 🔧 **Technical Constraints**

### **From CLAUDE.md:**
- ✅ Use TypeScript strict mode (no `any`)
- ✅ Client components need `'use client'` directive
- ✅ Run `npm run typecheck` before committing
- ✅ Keep performance <16ms per frame

### **Additional Constraints:**
- Use `THREE.Box3` for bounding boxes (built-in Three.js)
- Implement spatial hashing for O(n) collision detection (not O(n²))
- Cache collision results to avoid recalculating every frame
- Use `useRef` for detector to avoid re-creating on re-renders
- Debounce collision checks if performance drops
- ✅ Use Prisma for all database interactions
- ✅ TypeScript strict mode (no `any`)
- ✅ Server actions use `zsa` pattern
- ✅ Run migrations: `npx prisma migrate dev`
- ✅ Generate types: `npx prisma generate`

### **Additional Constraints:**
- Validate on server before saving (never trust client)
- Return detailed error messages with equipment IDs
- Log collision events for analytics
- Use transactions for atomic updates

---

## 🧪 **Testing Checklist**

- [ ] Create scene with 2 overlapping equipment items → Both highlight red
- [ ] Move equipment apart → Red highlighting disappears
- [ ] Rotate equipment into collision → Red highlighting appears
- [ ] Add 50+ equipment items → FPS stays above 60
- [ ] Check browser console → No errors or warnings
- [ ] Run `npm run typecheck` → Zero errors
- [ ] Test with different equipment sizes (1x1 to 10x10)
- [ ] Test with equipment at different heights

---

## 📊 **Performance Targets**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Frame time | <16ms | Chrome DevTools Performance tab |
| Collision check | <5ms | `console.time()` around detection |
| Memory usage | <50MB increase | Chrome Task Manager |
| Equipment count | 100+ items | Test with large layouts |
- [ ] Create migration → Applies without errors
- [ ] Run `npx prisma generate` → Types update
- [ ] Save layout with collisions → Returns validation error
- [ ] Save layout without collisions → Saves successfully
- [ ] GET `/api/layouts/[id]/collisions` → Returns collision report
- [ ] POST collision data → Updates database
- [ ] Run `npm run typecheck` → Zero errors
- [ ] Check database → Collision fields populated

---

## 🚀 **Implementation Steps**

1. **Create collision detection library** (`lib/3d/collision-detection.ts`)
   - Implement `CollisionDetector` class
   - Add spatial hashing for performance
   - Write unit tests for collision logic

2. **Create React hook** (`hooks/use-collision-detection.ts`)
   - Wrap detector in React-friendly API
   - Handle state updates
   - Add cleanup on unmount

3. **Update EquipmentModel** (`components/3d/EquipmentModel.tsx`)
   - Accept `isColliding` prop
   - Change color when colliding
   - Report bounds to parent
   - Add collision outline

4. **Update Scene** (`components/3d/Scene.tsx`)
   - Integrate collision hook
   - Pass collision state to equipment
   - Add collision warning UI

5. **Test and optimize**
   - Test with various scenarios
   - Profile performance
   - Optimize if needed
1. **Create database migration**
   - Add collision fields to schema
   - Run `npx prisma migrate dev --name add_collision_metadata`
   - Verify migration applied

2. **Update Prisma schema**
   - Add new fields to LayoutInstance model
   - Run `npx prisma generate`
   - Verify types updated

3. **Create validation library**
   - Implement `CollisionValidator` class
   - Add rectangle overlap detection
   - Write unit tests

4. **Create server action**
   - Implement `validateLayoutCollisions`
   - Add error handling
   - Test with sample data

5. **Create API endpoint**
   - Implement GET/POST routes
   - Add authentication (if needed)
   - Test with Postman/curl

6. **Test end-to-end**
   - Test validation logic
   - Test database updates
   - Verify error messages

---

## 📝 **Commit Message Template**

```
feat(3d): add real-time collision detection for equipment

- Implement CollisionDetector class with spatial hashing
- Add visual feedback (red highlighting) for colliding equipment
- Create useCollisionDetection React hook
- Add collision warning UI in Scene component
- Performance: <5ms collision checks for 100+ items
feat(api): add server-side collision validation

- Add collision metadata fields to LayoutInstance
- Implement CollisionValidator for server-side checks
- Create validateLayoutCollisions server action
- Add /api/layouts/[id]/collisions endpoint
- Prevent saving layouts with overlapping equipment

Closes #[issue-number]
```

---

## 🔗 **Dependencies**

- `three` (already installed)
- `@react-three/fiber` (already installed)
- `@react-three/drei` (already installed)
- `@prisma/client` (already installed)
- `zod` (already installed)
- `zsa` (already installed)

**No new dependencies required!**

---

## ⚠️ **Known Limitations**

1. **AABB Only:** Uses axis-aligned bounding boxes (not oriented bounding boxes)
   - Rotation may cause false positives for non-rectangular equipment
   - Acceptable for MVP, can improve later with OBB

2. **2D Collision:** Only checks X/Z plane (ignores height)
   - Equipment at different heights won't collide
   - Can add height checking if needed

3. **No Collision Resolution:** Only detects, doesn't prevent movement
   - API slice will handle persistence validation
   - UI just provides visual feedback
1. **AABB Only:** Uses axis-aligned bounding boxes
   - Rotation ignored for MVP
   - Can add OBB later if needed

2. **No Real-time Updates:** Validation on save only
   - UI slice handles real-time feedback
   - API validates before persistence

3. **Performance:** O(n²) for n equipment items
   - Acceptable for <100 items
   - Can optimize with spatial indexing if needed

---

**Ready to implement!** 🚀
