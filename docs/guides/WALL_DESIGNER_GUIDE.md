# 🏗️ Wall Designer & Ducting Design - Complete Workflow Guide

## Overview

The **Wall Designer** is an advanced 2D CAD-like tool built with Konva.js that allows you to:
1. Draw building floor plans with precise measurements
2. Design and route mechanical systems (ducting, compressed air, electrical)
3. Place equipment with AI assistance
4. Visualize everything in an integrated canvas

---

## 🎨 Wall Designer Features

### **Modes**

The wall designer has 5 distinct modes:

#### 1. **DRAW Mode** 🖊️
Draw walls by clicking to place vertices.

**Features:**
- ✅ **Grid Snapping**: Auto-snaps to 25px grid
- ✅ **Vertex Snapping**: Snaps to existing vertices within 10px
- ✅ **Ortho Lock**: Hold `Shift` to lock to horizontal/vertical
- ✅ **Smart Guides**: Visual alignment guides to other vertices
- ✅ **Angle Snapping**: Auto-snaps to 90° angles
- ✅ **Draw by Measurement**: Type a length (e.g., "20") to draw exact distances
- ✅ **Auto-Close Loop**: Click near start vertex to close the building outline

**Workflow:**
```
1. Click "Draw" mode
2. Click to place first vertex (green dot)
3. Click to place subsequent vertices (blue dots)
4. Optional: Type a number (e.g., "20") to draw exact length
5. Optional: Hold Shift for ortho lock
6. Click near the first vertex to close the loop
7. Click "Close Loop" button to finalize
```

#### 2. **EDIT Mode** ✏️
Modify existing walls and vertices.

**Features:**
- ✅ **Drag Vertices**: Click and drag any vertex to move it
- ✅ **Drag Walls**: Click and drag entire wall segments
- ✅ **Edit Wall Length**: Select wall, enter new length in feet
- ✅ **Split Walls**: Split a wall segment at its midpoint
- ✅ **Change Material**: Select brick, concrete, or drywall
- ✅ **Delete**: Double-click vertices or walls to delete
- ✅ **Wall Thickness**: Automatically calculated based on material

**Workflow:**
```
1. Click "Edit" mode
2. Click on a wall to select it (highlighted in yellow)
3. Drag vertices or walls to reposition
4. Use "Split Wall" button to divide a wall
5. Change material from dropdown
6. Enter new length and click "Apply" to resize
```

#### 3. **SYSTEMS Mode** 🔧
Design and route mechanical systems.

**Features:**
- ✅ **Ducting Routes**: Draw dust collection duct runs
- ✅ **Compressed Air**: Draw air line routes
- ✅ **Electrical**: Draw electrical conduit routes
- ✅ **Color Coding**:
  - 🔵 Gray = Dust collection (thick lines)
  - 🔵 Blue = Compressed air
  - 🟡 Yellow (dashed) = Electrical
- ✅ **Diameter Visualization**: Duct thickness reflects actual diameter
- ✅ **Polyline Drawing**: Click multiple points to create routes

**Workflow:**
```
1. Click "Systems" mode
2. Click to place first point of duct run
3. Click to place subsequent points (creates polyline)
4. Press Enter to commit the run
5. Press Escape to cancel
6. Repeat for multiple runs
```

#### 4. **CALIBRATE Mode** 📏
Set the scale for accurate measurements.

**Features:**
- ✅ **Two-Point Calibration**: Click two points on a known distance
- ✅ **Real-World Measurement**: Enter actual distance in feet
- ✅ **Scale Calculation**: Automatically calculates ft/unit ratio
- ✅ **Measurement Display**: All measurements update to show feet

**Workflow:**
```
1. Click "Calibrate" mode
2. Click first point on a known distance (e.g., wall)
3. Click second point
4. Enter real-world distance in feet (e.g., "20")
5. Click "Apply"
6. All measurements now show in feet
```

#### 5. **PAN Mode** (Automatic)
Pan and zoom the canvas.

**Features:**
- ✅ **Drag to Pan**: Click and drag canvas background
- ✅ **Scroll to Zoom**: Mouse wheel to zoom in/out
- ✅ **Zoom Range**: 10% to 600%

---

## 🌪️ Ducting Design Integration

### **How It Works**

The ducting design system integrates with the wall designer through the `SystemsLayer` component and uses the calculation libraries we created.

### **Data Structure**

Ducting runs are stored in the building geometry:

```typescript
type SystemRun = {
    id: string;
    type: 'DUST' | 'AIR' | 'ELECTRICAL';
    points: Array<{ x: number, y: number }>; // Canvas coordinates
    diameter?: number; // In inches
    meta?: {
        cfm?: number;
        velocity?: number;
        frictionLoss?: number;
    };
}
```

### **Visual Representation**

In the 2D canvas:
- **Dust Collection**: Thick gray lines (thickness = diameter in pixels)
- **Compressed Air**: Blue lines (2px width)
- **Electrical**: Yellow dashed lines (2px width)

### **Calculation Integration**

When you draw a duct run, you can calculate optimal sizing:

```typescript
import { calculateOptimalDiameter, VELOCITY_STANDARDS } from '@/lib/systems/ducting';

// Example: Size duct for table saw
const cfm = 350; // Table saw requirement
const diameter = calculateOptimalDiameter(cfm, VELOCITY_STANDARDS.BRANCH_LINE);
// Returns: 4.2 inches

// Create the run with calculated diameter
const ductRun = {
    id: newId('run'),
    type: 'DUST',
    points: [{ x: 100, y: 100 }, { x: 300, y: 100 }],
    diameter: Math.ceil(diameter), // 5 inches
    meta: {
        cfm: 350,
        velocity: VELOCITY_STANDARDS.BRANCH_LINE
    }
};
```

---

## 🔄 Complete Workflow Example

### **Scenario: Design a Woodshop with Dust Collection**

#### **Step 1: Draw the Building** (5 minutes)

```
1. Click "Draw" mode
2. Click to place vertices for a 40' x 30' shop:
   - Click at (0, 0)
   - Type "40" and click to place 40' wall
   - Hold Shift, type "30" and click for 30' wall
   - Continue to complete rectangle
   - Click near start to close loop
3. Click "Close Loop"
```

#### **Step 2: Calibrate** (1 minute)

```
1. Click "Calibrate" mode
2. Click on one corner of the building
3. Click on the opposite corner (40' away)
4. Enter "40" in the input field
5. Click "Apply"
6. All measurements now show in feet
```

#### **Step 3: Place Equipment** (3 minutes)

```
1. Click "Edit" mode
2. Click "Auto-Place (AI)" button
   - AI suggests optimal placement
   - Equipment appears on canvas
3. Drag equipment to fine-tune positions
4. Repeat for all machines:
   - Table saw
   - Jointer
   - Planer
   - Band saw
```

#### **Step 4: Design Dust Collection** (10 minutes)

```
1. Calculate requirements for each machine:
   - Table saw: 350 CFM → 5" duct
   - Jointer: 400 CFM → 5" duct
   - Planer: 500 CFM → 6" duct
   - Band saw: 300 CFM → 4" duct

2. Click "Systems" mode

3. Draw main trunk line:
   - Click at dust collector location
   - Click along path to center of shop
   - Press Enter to commit
   - Set diameter to 8" (main trunk)

4. Draw branch lines to each machine:
   - Click at main trunk
   - Click at table saw
   - Press Enter
   - Repeat for each machine

5. Verify with calculations:
   import { calculateFrictionLossPre100Ft } from '@/lib/systems/ducting';
   
   const mainTrunkLoss = calculateFrictionLossPre100Ft(1500, 8);
   // Check if loss is acceptable (< 2" wg per 100ft)
```

#### **Step 5: Add Compressed Air** (5 minutes)

```
1. Still in "Systems" mode
2. Draw air lines (shown in blue):
   - Click at compressor location
   - Click along path to tools
   - Press Enter

3. Calculate pipe size:
   import { calculateOptimalAirPipeSize } from '@/lib/systems/compressed-air';
   
   const result = calculateOptimalAirPipeSize({
       flowSCFM: 25,
       pressurePSI: 90,
       lengthFt: 50,
       maxPressureDropPSI: 1
   });
   // Use result.pipeSize for installation
```

#### **Step 6: Add Electrical** (5 minutes)

```
1. Still in "Systems" mode
2. Draw electrical runs (shown in yellow dashed):
   - Click at panel location
   - Click along path to equipment
   - Press Enter

3. Calculate wire size:
   import { calculateOptimalWireSize } from '@/lib/systems/electrical';
   
   const circuit = calculateOptimalWireSize({
       load: { voltage: 240, phase: 1, amps: 30 },
       lengthFt: 75,
       maxVoltageDrop: 3
   });
   // Use circuit.wireSize for installation
```

#### **Step 7: Review and Export** (2 minutes)

```
1. Toggle "Show lengths" to verify all measurements
2. Toggle "Material" to see wall textures
3. Use mouse wheel to zoom in/out for details
4. The geometry is automatically saved to the database
5. Switch to 3D view to see the building in 3D
```

---

## 🎯 Advanced Features

### **Equipment Placement**

Equipment is stored with position and rotation:

```typescript
type EquipmentPlacement = {
    id: string;
    name: string;
    x: number;      // Canvas units
    y: number;      // Canvas units
    width: number;  // Canvas units
    depth: number;  // Canvas units
    rotation: number; // Degrees
}
```

**Draggable in Edit Mode:**
- Click and drag equipment to reposition
- Rotation can be adjusted programmatically

### **Material Visualization**

Walls can have different materials:
- **Brick**: Red brick texture
- **Concrete**: Gray concrete texture
- **Drywall**: White/beige texture

Toggle "Material" button to see textures instead of solid colors.

### **Wall Thickness**

Wall thickness is calculated based on material:
- **Default**: 0.5 ft (6 inches)
- **Brick**: Can be customized
- **Concrete**: Can be customized
- **Drywall**: Typically 0.5 ft with framing

### **Smart Snapping**

The editor includes intelligent snapping:
1. **Vertex Snapping**: Within 10px of existing vertices
2. **Grid Snapping**: To 25px grid
3. **Alignment Guides**: Vertical/horizontal alignment with other vertices
4. **Angle Snapping**: To 90° increments
5. **Length Constraint**: Type exact measurements

---

## 📊 Data Flow

```
User Draws Walls
    ↓
Wall Editor (Konva Canvas)
    ↓
BuildingFloorGeometry Object
    ├── vertices: BuildingVertex[]
    ├── segments: BuildingWallSegment[]
    ├── equipment: EquipmentPlacement[]
    └── systemRuns: SystemRun[]
    ↓
Saved to Database (Prisma)
    ↓
Retrieved for 3D Visualization
    ↓
Scene Component (React Three Fiber)
    ├── BuildingShell (walls in 3D)
    ├── EquipmentModel (equipment in 3D)
    └── SystemRouting (systems in 3D)
```

---

## 🔧 System Calculation Workflow

### **For Each System Type:**

#### **Dust Collection**
```typescript
1. Identify equipment CFM requirements
2. Calculate optimal duct diameter:
   const diameter = calculateOptimalDiameter(cfm, targetVelocity);

3. Calculate velocity:
   const velocity = calculateVelocity(cfm, diameter);

4. Calculate friction loss:
   const loss = calculateFrictionLossPre100Ft(cfm, diameter);

5. Verify velocity is 3500-4000 FPM for wood dust
6. Verify friction loss < 2" wg per 100ft
7. Draw route in Systems mode
8. Store with calculated diameter
```

#### **Compressed Air**
```typescript
1. Calculate compressor requirements:
   const comp = calculateCompressorRequirement(tools);

2. Size main line:
   const pipe = calculateOptimalAirPipeSize({
       flowSCFM: comp.requiredCFM,
       pressurePSI: 90,
       lengthFt: runLength,
       maxPressureDropPSI: 1
   });

3. Verify velocity < 6000 FPM
4. Verify pressure drop < 1 PSI per 100ft
5. Draw route in Systems mode
```

#### **Electrical**
```typescript
1. Calculate wire size:
   const circuit = calculateOptimalWireSize({
       load: { voltage, phase, amps },
       lengthFt: runLength,
       maxVoltageDrop: 3
   });

2. Calculate conduit size:
   const conduit = calculateConduitSize(circuit.wireSize, numConductors);

3. Calculate breaker size:
   const breaker = calculateBreakerSize(load, isMotor);

4. Verify voltage drop < 3%
5. Draw route in Systems mode
```

---

## 🎨 Visual Legend

### **Colors**
- 🟢 **Green Dot**: First vertex (start point)
- 🔵 **Blue Dots**: Subsequent vertices
- 🟡 **Yellow Highlight**: Selected wall segment
- ⚫ **Gray Lines**: Dust collection ducts
- 🔵 **Blue Lines**: Compressed air lines
- 🟡 **Yellow Dashed**: Electrical conduit
- 🟣 **Purple Rectangles**: Equipment

### **Interaction**
- **Single Click**: Place vertex / Select wall
- **Double Click**: Delete vertex / Delete wall
- **Click + Drag**: Move vertex / Move wall / Pan canvas
- **Mouse Wheel**: Zoom in/out
- **Shift + Click**: Ortho lock
- **Type Number**: Draw by measurement
- **Enter**: Commit system run
- **Escape**: Cancel system run

---

## 💡 Tips & Best Practices

### **Drawing Walls**
1. Always calibrate before drawing by measurement
2. Use grid snapping for clean, aligned walls
3. Hold Shift for perfect horizontal/vertical walls
4. Close the loop before switching to Edit mode
5. Use "Show lengths" to verify measurements

### **Designing Systems**
1. Start with main trunk lines, then branches
2. Size ducts using calculation functions
3. Keep duct runs as short as possible
4. Minimize elbows and bends
5. Verify velocity and pressure drop calculations

### **Equipment Placement**
1. Use AI auto-placement as a starting point
2. Consider workflow and material flow
3. Leave adequate space for operation and maintenance
4. Group related equipment together
5. Keep dust collection ports accessible

### **Performance**
1. Use "Hide grid" for complex drawings
2. Zoom in for detailed work
3. Use undo liberally (50-step history)
4. Save frequently (auto-saves on changes)

---

## 🚀 Future Enhancements

Planned features:
- [ ] Automatic duct routing with pathfinding
- [ ] Real-time CFM calculations as you draw
- [ ] Collision detection for equipment
- [ ] Bill of materials generation
- [ ] Export to CAD formats (DXF, DWG)
- [ ] 3D system routing visualization
- [ ] Cost estimation
- [ ] Code compliance checking

---

## 📚 Related Documentation

- **Calculation Libraries**: See `SYSTEMS_QUICK_REFERENCE.md`
- **3D Visualization**: See `ENHANCEMENT_SUMMARY.md`
- **API Reference**: See inline JSDoc comments
- **Type Definitions**: See `lib/types/building-geometry.ts`

---

**Last Updated**: January 4, 2026  
**Version**: 2.0  
**Status**: ✅ Fully Functional
