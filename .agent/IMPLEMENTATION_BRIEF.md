# 🎯 Implementation Brief: 3D Collision Detection - Tests Slice

**Worktree:** `worktrees/comet-tests`  
**Branch:** `feature/3d-collision-tests`  
**Focus:** Geometric validation tests  
**Estimated Effort:** 2-3 hours

---

## 📋 **Objective**

Implement comprehensive test suite for collision detection logic, covering edge cases, performance benchmarks, and integration scenarios.

---

## 🎯 **Acceptance Criteria**

1. ✅ Unit tests for collision detection algorithm
2. ✅ Edge case tests (touching, overlapping, rotated)
3. ✅ Performance benchmarks (100+ equipment items)
4. ✅ Integration tests for API validation
5. ✅ Test coverage >90% for collision code
6. ✅ All tests pass with exit code 0
7. ✅ TypeScript: Zero type errors
8. ✅ Tests run in <5 seconds

---

## 📁 **Files to Create**

### **1. Create: `test/collision-detection.test.ts`**
**Purpose:** Unit tests for collision detection logic

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionDetector } from '@/lib/3d/collision-detection';
import * as THREE from 'three';

describe('CollisionDetector', () => {
  let detector: CollisionDetector;
  
  beforeEach(() => {
    detector = new CollisionDetector();
  });
  
  describe('Basic Collision Detection', () => {
    it('should detect overlapping boxes', () => {
      // Equipment 1: 5x5 box at (0, 0)
      detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      // Equipment 2: 5x5 box at (3, 0, 0) - overlaps by 2 units
      detector.updateBox('eq2', new THREE.Vector3(3, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      const result = detector.detectCollisions();
      
      expect(result.hasCollision).toBe(true);
      expect(result.collisionCount).toBe(1);
      expect(result.collidingPairs).toHaveLength(1);
      expect(result.collidingPairs[0]).toEqual({
        id1: 'eq1',
        id2: 'eq2'
      });
    });
    
    it('should not detect non-overlapping boxes', () => {
      // Equipment 1: 5x5 box at (0, 0)
      detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      // Equipment 2: 5x5 box at (10, 0, 0) - no overlap
      detector.updateBox('eq2', new THREE.Vector3(10, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      const result = detector.detectCollisions();
      
      expect(result.hasCollision).toBe(false);
      expect(result.collisionCount).toBe(0);
      expect(result.collidingPairs).toHaveLength(0);
    });
    
    it('should detect touching boxes as collision', () => {
      // Equipment 1: 5x5 box at (0, 0)
      detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      // Equipment 2: 5x5 box at (5, 0, 0) - edges touching
      detector.updateBox('eq2', new THREE.Vector3(5, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      const result = detector.detectCollisions();
      
      // Touching edges should be considered collision
      expect(result.hasCollision).toBe(true);
    });
  });
  
  describe('Multiple Equipment', () => {
    it('should detect multiple collisions', () => {
      // Create 3 overlapping boxes
      detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
        width: 10,
        height: 5,
        depth: 10
      });
      
      detector.updateBox('eq2', new THREE.Vector3(5, 0, 0), {
        width: 10,
        height: 5,
        depth: 10
      });
      
      detector.updateBox('eq3', new THREE.Vector3(2.5, 0, 0), {
        width: 10,
        height: 5,
        depth: 10
      });
      
      const result = detector.detectCollisions();
      
      // Should detect 3 pairs: (1,2), (1,3), (2,3)
      expect(result.collisionCount).toBe(3);
      expect(result.collidingPairs).toHaveLength(3);
    });
    
    it('should handle removal of equipment', () => {
      detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      detector.updateBox('eq2', new THREE.Vector3(3, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      expect(detector.detectCollisions().hasCollision).toBe(true);
      
      // Remove one equipment
      detector.removeBox('eq2');
      
      expect(detector.detectCollisions().hasCollision).toBe(false);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle zero-size boxes', () => {
      detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
        width: 0,
        height: 0,
        depth: 0
      });
      
      detector.updateBox('eq2', new THREE.Vector3(0, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      const result = detector.detectCollisions();
      
      // Zero-size box at same position should collide
      expect(result.hasCollision).toBe(true);
    });
    
    it('should handle very large boxes', () => {
      detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
        width: 1000,
        height: 100,
        depth: 1000
      });
      
      detector.updateBox('eq2', new THREE.Vector3(500, 0, 500), {
        width: 10,
        height: 10,
        depth: 10
      });
      
      const result = detector.detectCollisions();
      
      expect(result.hasCollision).toBe(true);
    });
    
    it('should handle negative positions', () => {
      detector.updateBox('eq1', new THREE.Vector3(-10, 0, -10), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      detector.updateBox('eq2', new THREE.Vector3(-8, 0, -8), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      const result = detector.detectCollisions();
      
      expect(result.hasCollision).toBe(true);
    });
  });
  
  describe('Performance', () => {
    it('should handle 100 equipment items efficiently', () => {
      const startTime = performance.now();
      
      // Add 100 equipment items in a grid
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          detector.updateBox(`eq-${i}-${j}`, new THREE.Vector3(i * 10, 0, j * 10), {
            width: 5,
            height: 5,
            depth: 5
          });
        }
      }
      
      const result = detector.detectCollisions();
      const endTime = performance.now();
      
      // Should complete in <100ms
      expect(endTime - startTime).toBeLessThan(100);
      
      // No collisions (spaced 10 units apart, boxes are 5 units)
      expect(result.hasCollision).toBe(false);
    });
    
    it('should handle 100 overlapping items efficiently', () => {
      const startTime = performance.now();
      
      // Add 100 overlapping equipment items
      for (let i = 0; i < 100; i++) {
        detector.updateBox(`eq-${i}`, new THREE.Vector3(0, 0, 0), {
          width: 5,
          height: 5,
          depth: 5
        });
      }
      
      const result = detector.detectCollisions();
      const endTime = performance.now();
      
      // Should complete in <500ms even with all colliding
      expect(endTime - startTime).toBeLessThan(500);
      
      // Should detect collisions
      expect(result.hasCollision).toBe(true);
      expect(result.collisionCount).toBeGreaterThan(0);
    });
  });
  
  describe('isColliding method', () => {
    it('should return true for colliding equipment', () => {
      detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      detector.updateBox('eq2', new THREE.Vector3(3, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      detector.detectCollisions();
      
      expect(detector.isColliding('eq1')).toBe(true);
      expect(detector.isColliding('eq2')).toBe(true);
    });
    
    it('should return false for non-colliding equipment', () => {
      detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      detector.updateBox('eq2', new THREE.Vector3(10, 0, 0), {
        width: 5,
        height: 5,
        depth: 5
      });
      
      detector.detectCollisions();
      
      expect(detector.isColliding('eq1')).toBe(false);
      expect(detector.isColliding('eq2')).toBe(false);
    });
  });
  
  describe('getCollidingWith method', () => {
    it('should return IDs of colliding equipment', () => {
      detector.updateBox('eq1', new THREE.Vector3(0, 0, 0), {
        width: 10,
        height: 5,
        depth: 10
      });
      
      detector.updateBox('eq2', new THREE.Vector3(5, 0, 0), {
        width: 10,
        height: 5,
        depth: 10
      });
      
      detector.updateBox('eq3', new THREE.Vector3(2.5, 0, 0), {
        width: 10,
        height: 5,
        depth: 10
      });
      
      detector.detectCollisions();
      
      const collidingWithEq1 = detector.getCollidingWith('eq1');
      
      expect(collidingWithEq1).toContain('eq2');
      expect(collidingWithEq1).toContain('eq3');
      expect(collidingWithEq1).toHaveLength(2);
    });
  });
});
```

---

### **2. Create: `test/collision-validator.test.ts`**
**Purpose:** Tests for server-side validation

```typescript
import { describe, it, expect } from 'vitest';
import { CollisionValidator } from '@/lib/validations/collision';

describe('CollisionValidator', () => {
  describe('checkRectangleOverlap', () => {
    it('should detect overlapping rectangles', () => {
      const rect1 = { x: 0, y: 0, width: 10, depth: 10, rotation: 0 };
      const rect2 = { x: 5, y: 0, width: 10, depth: 10, rotation: 0 };
      
      const result = CollisionValidator.checkRectangleOverlap(rect1, rect2);
      
      expect(result.overlaps).toBe(true);
      expect(result.area).toBeGreaterThan(0);
    });
    
    it('should not detect non-overlapping rectangles', () => {
      const rect1 = { x: 0, y: 0, width: 5, depth: 5, rotation: 0 };
      const rect2 = { x: 10, y: 10, width: 5, depth: 5, rotation: 0 };
      
      const result = CollisionValidator.checkRectangleOverlap(rect1, rect2);
      
      expect(result.overlaps).toBe(false);
      expect(result.area).toBe(0);
    });
    
    it('should calculate correct overlap area', () => {
      // Two 10x10 rectangles overlapping by 5x10
      const rect1 = { x: 0, y: 0, width: 10, depth: 10, rotation: 0 };
      const rect2 = { x: 5, y: 0, width: 10, depth: 10, rotation: 0 };
      
      const result = CollisionValidator.checkRectangleOverlap(rect1, rect2);
      
      expect(result.overlaps).toBe(true);
      expect(result.area).toBe(50); // 5 * 10
    });
  });
  
  describe('validateLayout', () => {
    it('should validate collision-free layout', async () => {
      const positions = [
        {
          equipmentId: 1,
          x: 0,
          y: 0,
          orientation: 0,
          equipment: { widthFt: 5, depthFt: 5, name: 'Table Saw' }
        },
        {
          equipmentId: 2,
          x: 10,
          y: 10,
          orientation: 0,
          equipment: { widthFt: 5, depthFt: 5, name: 'Jointer' }
        }
      ];
      
      const result = await CollisionValidator.validateLayout(1, positions);
      
      expect(result.isValid).toBe(true);
      expect(result.hasCollisions).toBe(false);
      expect(result.collisionCount).toBe(0);
      expect(result.collisions).toHaveLength(0);
    });
    
    it('should detect collisions in layout', async () => {
      const positions = [
        {
          equipmentId: 1,
          x: 0,
          y: 0,
          orientation: 0,
          equipment: { widthFt: 10, depthFt: 10, name: 'Table Saw' }
        },
        {
          equipmentId: 2,
          x: 5,
          y: 0,
          orientation: 0,
          equipment: { widthFt: 10, depthFt: 10, name: 'Jointer' }
        }
      ];
      
      const result = await CollisionValidator.validateLayout(1, positions);
      
      expect(result.isValid).toBe(false);
      expect(result.hasCollisions).toBe(true);
      expect(result.collisionCount).toBe(1);
      expect(result.collisions).toHaveLength(1);
      expect(result.collisions[0]).toMatchObject({
        equipment1Id: 1,
        equipment2Id: 2,
        equipment1Name: 'Table Saw',
        equipment2Name: 'Jointer'
      });
    });
  });
});
```

---

### **3. Create: `test/collision-api.test.ts`**
**Purpose:** Integration tests for API endpoints

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Collision API Integration', () => {
  let testLayoutId: number;
  let testBuildingId: number;
  
  beforeAll(async () => {
    // Create test building
    const building = await prisma.shopBuilding.create({
      data: {
        name: 'Test Building',
        widthFt: 100,
        depthFt: 100
      }
    });
    testBuildingId = building.id;
    
    // Create test layout
    const layout = await prisma.layoutInstance.create({
      data: {
        shopBuildingId: testBuildingId,
        name: 'Test Layout'
      }
    });
    testLayoutId = layout.id;
  });
  
  afterAll(async () => {
    // Cleanup
    await prisma.layoutInstance.deleteMany({
      where: { shopBuildingId: testBuildingId }
    });
    await prisma.shopBuilding.delete({
      where: { id: testBuildingId }
    });
  });
  
  it('should update collision metadata in database', async () => {
    // Update layout with collision data
    await prisma.layoutInstance.update({
      where: { id: testLayoutId },
      data: {
        hasCollisions: true,
        collisionCount: 2,
        collisionData: [
          { equipment1Id: 1, equipment2Id: 2, overlapArea: 25 }
        ],
        lastCollisionCheck: new Date()
      }
    });
    
    // Verify update
    const layout = await prisma.layoutInstance.findUnique({
      where: { id: testLayoutId }
    });
    
    expect(layout?.hasCollisions).toBe(true);
    expect(layout?.collisionCount).toBe(2);
    expect(layout?.collisionData).toBeDefined();
    expect(layout?.lastCollisionCheck).toBeDefined();
  });
});
```

---

## 🔧 **Technical Constraints**

### **From CLAUDE.md:**
- ✅ Use Vitest for testing
- ✅ TypeScript strict mode
- ✅ Tests must pass before PR
- ✅ Run: `npm test`

### **Additional Constraints:**
- Test coverage >90% for collision code
- Performance tests must complete in <5s
- Use `beforeEach` for test isolation
- Mock Prisma for unit tests (use real DB for integration)

---

## 🧪 **Testing Checklist**

- [ ] Run `npm test` → All tests pass
- [ ] Run `npm run test:coverage` → >90% coverage
- [ ] Performance tests complete in <5s
- [ ] Edge cases covered (zero-size, negative, large)
- [ ] Integration tests use real database
- [ ] Run `npm run typecheck` → Zero errors

---

## 🚀 **Implementation Steps**

1. **Create unit tests** (`test/collision-detection.test.ts`)
   - Test basic collision detection
   - Test multiple equipment
   - Test edge cases
   - Add performance benchmarks

2. **Create validation tests** (`test/collision-validator.test.ts`)
   - Test rectangle overlap
   - Test layout validation
   - Test error cases

3. **Create integration tests** (`test/collision-api.test.ts`)
   - Test database updates
   - Test API endpoints
   - Test end-to-end flow

4. **Run and verify**
   - Run all tests
   - Check coverage
   - Fix any failures

---

## 📝 **Commit Message Template**

```
test(collision): add comprehensive test suite

- Add unit tests for CollisionDetector class
- Add validation tests for server-side logic
- Add integration tests for API endpoints
- Add performance benchmarks (100+ items)
- Coverage: >90% for collision code

Closes #[issue-number]
```

---

## 🔗 **Dependencies**

- `vitest` (already installed)
- `@testing-library/react` (already installed)
- `@prisma/client` (already installed)

**No new dependencies required!**

---

**Ready to implement!** 🚀
