# 🎯 Implementation Brief: 3D Collision Detection - UI Slice

**Worktree:** `worktrees/comet-ui`  
**Branch:** `feature/3d-collision-ui`  
**Focus:** Three.js collision detection with visual feedback  
**Estimated Effort:** 4-6 hours

---

## 📋 **Objective**

Implement real-time collision detection for equipment in the 3D scene with visual feedback (red highlighting, collision warnings) when equipment overlaps.

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

---

## 📝 **Commit Message Template**

```
feat(3d): add real-time collision detection for equipment

- Implement CollisionDetector class with spatial hashing
- Add visual feedback (red highlighting) for colliding equipment
- Create useCollisionDetection React hook
- Add collision warning UI in Scene component
- Performance: <5ms collision checks for 100+ items

Closes #[issue-number]
```

---

## 🔗 **Dependencies**

- `three` (already installed)
- `@react-three/fiber` (already installed)
- `@react-three/drei` (already installed)

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

---

**Ready to implement!** 🚀
