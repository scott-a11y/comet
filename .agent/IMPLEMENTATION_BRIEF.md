# 🎯 Implementation Brief: 3D Collision Detection - API Slice

**Worktree:** `worktrees/comet-api`  
**Branch:** `feature/3d-collision-api`  
**Focus:** Layout persistence for collision metadata  
**Estimated Effort:** 3-4 hours

---

## 📋 **Objective**

Implement server-side validation and persistence for equipment collision data, ensuring layouts cannot be saved with overlapping equipment and storing collision metadata for analysis.

---

## 🎯 **Acceptance Criteria**

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

- `@prisma/client` (already installed)
- `zod` (already installed)
- `zsa` (already installed)

**No new dependencies required!**

---

## ⚠️ **Known Limitations**

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
