# Antigravity Engine - Implementation Guide

## 🚀 What is Antigravity?

**Antigravity** is a pattern that makes heavy engineering operations feel instant and weightless in the UI, while complex calculations happen asynchronously in the background.

### The Problem It Solves

**Before Antigravity**:
- User drags a wall → UI freezes → Server validates → UI updates → User sees result (500ms+ lag)
- Measurements feel sluggish
- Pipe routing is janky
- Calibration blocks the entire UI

**After Antigravity**:
- User drags a wall → UI updates INSTANTLY → Server validates in background → Toast confirms success
- Measurements update in real-time
- Pipe routing is smooth
- Calibration never blocks interaction

---

## 📁 Files Created

### 1. Core Hook: `hooks/use-antigravity.ts`
The reusable hook that powers all optimistic updates.

**Features**:
- `useAntigravity` - For arrays of items (walls, equipment, pipes)
- `useAntigravitySingle` - For single items (building properties)
- Automatic rollback on server errors
- Toast notifications for user feedback

### 2. Server Actions: `actions/blueprint-actions.ts`
Server-side validation and persistence with Zod schemas.

**Actions**:
- `updateWallSegmentAction` - Update wall properties
- `updateVertexAction` - Move wall vertices
- `updateEquipmentPlacementAction` - Drag equipment
- `updateSystemRunAction` - Route pipes/ducts/electrical

---

## 🎯 How to Use Antigravity

### Example 1: Wall Editor with Instant Updates

```tsx
'use client'

import { useAntigravity } from "@/hooks/use-antigravity";
import { updateVertexAction } from "@/actions/blueprint-actions";
import { BuildingVertex } from "@/lib/types/building-geometry";

export function WallEditor({ buildingId, initialVertices }: Props) {
  
  // ⚡ ENABLE ANTIGRAVITY
  const { data: vertices, isCalibrating, update } = useAntigravity(
    initialVertices,
    updateVertexAction,
    "id"
  );

  const handleVertexDrag = (vertexId: string, newX: number, newY: number) => {
    const vertex = vertices.find(v => v.id === vertexId);
    if (!vertex) return;

    // This updates the UI INSTANTLY, then syncs with server
    update({
      ...vertex,
      x: newX,
      y: newY,
      buildingId // Required for server action
    });
  };

  return (
    <div className="relative">
      {/* Status Indicator */}
      {isCalibrating && (
        <div className="absolute top-4 right-4 text-xs text-blue-600 font-mono">
          CALIBRATING GEOMETRY...
        </div>
      )}

      {/* Render Walls */}
      <svg className="w-full h-full">
        {vertices.map((vertex) => (
          <circle
            key={vertex.id}
            cx={vertex.x}
            cy={vertex.y}
            r={8}
            className="fill-blue-500 cursor-grab hover:fill-blue-600"
            onMouseDown={(e) => {
              // Implement drag logic
              // On drag end, call: handleVertexDrag(vertex.id, newX, newY)
            }}
          />
        ))}
      </svg>
    </div>
  );
}
```

### Example 2: Equipment Placement

```tsx
'use client'

import { useAntigravity } from "@/hooks/use-antigravity";
import { updateEquipmentPlacementAction } from "@/actions/blueprint-actions";

export function EquipmentLayer({ buildingId, initialEquipment }: Props) {
  
  const { data: equipment, isCalibrating, update } = useAntigravity(
    initialEquipment,
    updateEquipmentPlacementAction,
    "id"
  );

  const handleEquipmentDrag = (eqId: string, newX: number, newY: number) => {
    const eq = equipment.find(e => e.id === eqId);
    if (!eq) return;

    update({
      ...eq,
      x: newX,
      y: newY,
      buildingId
    });
  };

  return (
    <div>
      {equipment.map((eq) => (
        <div
          key={eq.id}
          style={{
            position: 'absolute',
            left: eq.x,
            top: eq.y,
            width: eq.width,
            height: eq.depth,
            transform: `rotate(${eq.rotation}deg)`,
            opacity: isCalibrating ? 0.7 : 1,
          }}
          className="bg-blue-500 cursor-move"
          draggable
          onDragEnd={(e) => {
            handleEquipmentDrag(eq.id, e.clientX, e.clientY);
          }}
        >
          {eq.name}
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Pipe Routing

```tsx
'use client'

import { useAntigravity } from "@/hooks/use-antigravity";
import { updateSystemRunAction } from "@/actions/blueprint-actions";

export function SystemsLayer({ buildingId, initialRuns }: Props) {
  
  const { data: runs, isCalibrating, update } = useAntigravity(
    initialRuns,
    updateSystemRunAction,
    "id"
  );

  const [drawingPoints, setDrawingPoints] = useState<{x: number, y: number}[]>([]);

  const handleCanvasClick = (x: number, y: number) => {
    setDrawingPoints(prev => [...prev, { x, y }]);
  };

  const finishRun = () => {
    if (drawingPoints.length < 2) return;

    const newRun = {
      id: crypto.randomUUID(),
      buildingId,
      type: 'DUST' as const,
      points: drawingPoints,
      diameter: 12,
    };

    update(newRun); // Instant UI update + server sync
    setDrawingPoints([]);
  };

  return (
    <svg className="absolute inset-0" onClick={(e) => handleCanvasClick(e.clientX, e.clientY)}>
      {/* Existing runs */}
      {runs.map((run) => (
        <polyline
          key={run.id}
          points={run.points.map(p => `${p.x},${p.y}`).join(' ')}
          stroke={run.type === 'DUST' ? 'orange' : run.type === 'AIR' ? 'blue' : 'red'}
          strokeWidth={run.diameter || 4}
          fill="none"
          opacity={isCalibrating ? 0.5 : 1}
        />
      ))}

      {/* Drawing preview */}
      {drawingPoints.length > 0 && (
        <polyline
          points={drawingPoints.map(p => `${p.x},${p.y}`).join(' ')}
          stroke="gray"
          strokeWidth={2}
          strokeDasharray="4 4"
          fill="none"
        />
      )}

      {isCalibrating && (
        <text x="20" y="40" className="fill-blue-600 text-xs font-mono">
          CALCULATING PRESSURE DROP...
        </text>
      )}
    </svg>
  );
}
```

---

## 🔧 Integration Steps

### Step 1: Update Wall Editor Component

Replace manual state management in `app/buildings/new/_components/wall-editor.tsx` with Antigravity:

```tsx
// OLD WAY (Manual state + fetch)
const [vertices, setVertices] = useState([]);
const updateVertex = async (v) => {
  setVertices(prev => ...); // Manual optimistic update
  await fetch('/api/vertices', { method: 'POST', body: JSON.stringify(v) });
};

// NEW WAY (Antigravity)
const { data: vertices, update } = useAntigravity(
  initialVertices,
  updateVertexAction,
  "id"
);
```

### Step 2: Update Systems Layer

Replace pipe routing logic in `app/buildings/new/_components/systems-layer.tsx`:

```tsx
const { data: systemRuns, isCalibrating, update } = useAntigravity(
  initialRuns,
  updateSystemRunAction,
  "id"
);
```

### Step 3: Add Status Indicators

Show the `isCalibrating` state to users:

```tsx
{isCalibrating && (
  <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
    <div className="flex items-center gap-2">
      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
      <span>Calibrating...</span>
    </div>
  </div>
)}
```

---

## 🎯 Benefits

### 1. Instant Feedback
- UI updates immediately when user drags/clicks
- No waiting for server response
- Feels like a native desktop app

### 2. Automatic Rollback
- If server validation fails, UI automatically reverts
- User sees toast notification explaining the error
- No manual state management needed

### 3. Background Processing
- Server can trigger heavy calculations (pressure drop, voltage calculations)
- UI never blocks
- Results appear when ready

### 4. Clean Code
- One hook handles all optimistic updates
- No scattered `fetch` calls
- Centralized error handling

---

## 🚨 Important Notes

### Server Actions Must Return Standard Format

```typescript
return {
  success: boolean,
  error?: string,
  data?: TResult
};
```

### Always Include Required IDs

When calling `update()`, include the `buildingId` or other required fields:

```typescript
update({
  ...item,
  buildingId, // Required for server action
});
```

### Handle Errors Gracefully

The hook automatically shows toast notifications, but you can add custom error handling:

```typescript
const { update } = useAntigravity(...);

const handleUpdate = async (item) => {
  try {
    update(item);
  } catch (error) {
    // Custom error handling
  }
};
```

---

## 🔮 Future Enhancements

### 1. Background Jobs (Trigger.dev)

Add to server actions:

```typescript
await client.sendEvent({
  name: "engineering.recalculate_zone",
  payload: { 
    buildingId: wall.buildingId,
    impactedZone: { x: wall.start.x, y: wall.start.y } 
  }
});
```

### 2. Real-time Collaboration

Combine with WebSockets to show other users' changes:

```typescript
useEffect(() => {
  socket.on('wall_updated', (wall) => {
    // Update local state without triggering server action
    setOptimisticData(wall);
  });
}, []);
```

### 3. Undo/Redo

Track history of optimistic updates:

```typescript
const [history, setHistory] = useState([]);

const updateWithHistory = (item) => {
  setHistory(prev => [...prev, optimisticData]);
  update(item);
};

const undo = () => {
  const previous = history[history.length - 1];
  update(previous);
};
```

---

## ✅ Testing Checklist

After implementing Antigravity:

- [ ] Drag a wall vertex - does it move instantly?
- [ ] Check measurements - do they update in real-time?
- [ ] Draw a pipe route - is it smooth?
- [ ] Trigger a server error - does UI rollback?
- [ ] Check toast notifications - do they appear?
- [ ] Test with slow network - does UI still feel fast?

---

## 📚 Additional Resources

- [React useOptimistic Docs](https://react.dev/reference/react/useOptimistic)
- [React useTransition Docs](https://react.dev/reference/react/useTransition)
- [Server Actions Best Practices](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

**Status**: ✅ READY TO IMPLEMENT  
**Impact**: Fixes all UX issues (measurements, calibration, pipework)  
**Priority**: HIGH - This is the foundation for a professional engineering tool  

**Next Step**: Integrate into Wall Editor component and test!
