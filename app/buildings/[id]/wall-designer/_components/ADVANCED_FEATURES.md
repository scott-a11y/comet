# Advanced Wall Drawing Tool - Feature Documentation

## Overview
This document outlines the comprehensive advanced features added to the wall drawing tool for creating detailed building layouts.

## 🎯 Advanced Drawing Modes

### 1. **Orthogonal Mode** (`orthogonal`)
- **Purpose**: Lock wall drawing to 90° angles (horizontal/vertical only)
- **Use Case**: Creating rectangular rooms and standard building layouts
- **How to Use**: Select Orthogonal mode, click start point, move mouse - wall automatically snaps to horizontal or vertical
- **Keyboard Shortcut**: `O` key

### 2. **Angle Lock Mode** (`angle-lock`)
- **Purpose**: Lock wall drawing to a specific angle
- **Use Case**: Creating angled walls, bay windows, or non-orthogonal designs
- **How to Use**: 
  - Select Angle Lock mode
  - Enter desired angle in degrees (0-360)
  - Quick presets available: 0°, 45°, 90°, 135°
- **Keyboard Shortcut**: `A` key

### 3. **Parallel Mode** (`parallel`)
- **Purpose**: Draw walls parallel to an existing wall
- **Use Case**: Creating hallways, parallel room divisions
- **How to Use**:
  - Select an existing wall as reference
  - Select Parallel mode
  - Draw new wall - it will maintain parallel orientation
- **Keyboard Shortcut**: `P` key

### 4. **Perpendicular Mode** (`perpendicular`)
- **Purpose**: Draw walls perpendicular to an existing wall
- **Use Case**: Creating T-junctions, room divisions
- **How to Use**:
  - Select an existing wall as reference
  - Select Perpendicular mode
  - Draw new wall at 90° to reference
- **Keyboard Shortcut**: `Shift+P`

### 5. **Offset Mode** (`offset`)
- **Purpose**: Create walls at a specific distance from existing walls
- **Use Case**: Creating double walls, insulation gaps, parallel structures
- **How to Use**:
  - Select existing wall
  - Enter offset distance in feet
  - Choose side (left/right)
  - New wall created automatically
- **Keyboard Shortcut**: `F` key

### 6. **Arc/Curved Wall Mode** (`arc`)
- **Purpose**: Create curved wall segments
- **Use Case**: Curved facades, circular rooms, architectural features
- **How to Use**:
  - Click start point
  - Click end point
  - Drag to set curve radius
- **Keyboard Shortcut**: `C` key

### 7. **Free Drawing Mode** (`free`)
- **Purpose**: Unrestricted wall drawing
- **Use Case**: Complex, irregular layouts
- **Keyboard Shortcut**: `F` key

## 📏 Dimension Input Methods

### 1. **Length Input** (Simple)
- **Format**: Just type a number (e.g., `10`)
- **Behavior**: Extends wall in current direction by specified length
- **Example**: `10` = 10 feet in current direction

### 2. **Absolute Coordinates**
- **Format**: `x,y` or `x y`
- **Behavior**: Places point at exact coordinates
- **Example**: `10,20` = point at (10, 20)

### 3. **Relative Coordinates**
- **Format**: `@dx,dy` or `@dx dy`
- **Behavior**: Places point relative to last point
- **Example**: `@5,10` = 5 feet right, 10 feet up from last point

### 4. **Polar Coordinates**
- **Format**: `length<angle`
- **Behavior**: Places point at specified distance and angle
- **Example**: `10<45` = 10 feet at 45° angle

## 🏗️ Wall Properties

### Wall Types
1. **Interior** - Standard interior partition walls
2. **Exterior** - Building envelope walls
3. **Load-Bearing** - Structural walls supporting loads
4. **Partition** - Non-structural dividers
5. **Curtain Wall** - Non-structural exterior glazing systems

### Wall Thickness Presets
- **4"** (0.33 ft) - Interior partitions
- **6"** (0.5 ft) - Standard interior walls
- **8"** (0.67 ft) - Exterior/load-bearing walls
- **12"** (1.0 ft) - Heavy exterior walls

### Wall Height Presets
- 8', 9', 10', 12', 16', 20'
- Custom heights supported

### Wall Materials
- **Drywall** - Standard interior finish
- **Brick** - Masonry construction
- **Concrete** - Solid concrete walls
- **Wood Frame** - Timber construction
- **Steel Frame** - Metal stud construction
- **Glass** - Glazing systems

### Advanced Properties
- **Insulation Type & R-Value** - For energy calculations
- **Interior Finish** - Paint, wallpaper, tile, etc.
- **Exterior Finish** - Siding, stucco, brick veneer, etc.

## 🤖 Smart Features

### 1. **Room Detection**
- **Function**: `detectRooms(vertices, segments, scaleFtPerUnit)`
- **Purpose**: Automatically identifies closed room boundaries
- **Returns**: Array of Room objects with:
  - Unique ID
  - Suggested name
  - Area (sq ft)
  - Perimeter (ft)
  - Centroid coordinates
  - Suggested room type

### 2. **Wall Cleanup**
- **Function**: `cleanupWalls(vertices, segments, tolerance)`
- **Purpose**: Optimizes wall layout
- **Features**:
  - Merges collinear wall segments
  - Removes redundant vertices
  - Fixes T-junctions
  - Identifies and repairs gaps

### 3. **Auto-Close Rooms**
- **Function**: `autoCloseRoom(startVertex, endVertex, vertices, segments)`
- **Purpose**: Automatically completes room boundaries
- **Use Case**: Click two endpoints to close a room

### 4. **Gap Detection**
- **Function**: `findWallGaps(vertices, segments, maxDistance)`
- **Purpose**: Finds vertices that should be connected
- **Returns**: List of potential connections sorted by distance

### 5. **Smart Room Naming**
- **Function**: `suggestRoomName(room)`
- **Purpose**: Suggests appropriate room names based on:
  - Area
  - Shape
  - Location
  - Connections

## 🎨 Visual Enhancements

### Dimension Display
- Real-time length display while drawing
- Permanent dimensions on completed walls
- Area calculations for rooms
- Perimeter measurements

### Snapping Indicators
- Visual feedback for snap points
- Crosshairs for precision
- Angle indicators
- Distance markers

### Color Coding
- Different colors for wall types
- Highlight selected walls
- Show room boundaries
- Indicate structural vs. non-structural

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `D` | Draw mode |
| `O` | Orthogonal mode |
| `A` | Angle lock mode |
| `P` | Parallel mode |
| `Shift+P` | Perpendicular mode |
| `F` | Offset mode |
| `C` | Arc/Curved mode |
| `Esc` | Cancel current operation |
| `Enter` | Complete wall/room |
| `Delete` | Delete selected |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+D` | Duplicate |
| `Ctrl+G` | Group |
| `Ctrl+Shift+G` | Ungroup |
| `M` | Mirror |
| `R` | Rotate |
| `S` | Scale |
| `T` | Trim |
| `E` | Extend |

## 🔧 Advanced Editing Tools

### Multi-Select
- Click and drag to select multiple walls
- Hold `Shift` to add to selection
- Hold `Ctrl` to remove from selection

### Array/Pattern
- Duplicate walls in linear or circular patterns
- Specify count and spacing
- Maintain or adjust properties

### Mirror
- Mirror walls across horizontal/vertical axis
- Custom mirror line
- Option to keep or delete original

### Trim/Extend
- Trim walls to boundaries
- Extend walls to meet other walls
- Auto-detect intersection points

### Fillet/Chamfer
- Round wall corners with specified radius
- Chamfer corners at 45° or custom angle
- Maintain wall thickness

## 📊 Calculations & Analysis

### Automatic Calculations
- **Room Areas** - Square footage for each room
- **Wall Lengths** - Linear feet of walls
- **Material Quantities** - Drywall, studs, insulation
- **Cost Estimates** - Based on material and labor rates

### Energy Analysis
- **R-Value Calculations** - Total wall insulation
- **Heat Loss/Gain** - Based on wall properties
- **Window-to-Wall Ratio** - Code compliance checking

## 🎯 Best Practices

### For Accurate Layouts
1. Always calibrate scale using known dimensions
2. Use orthogonal mode for standard rooms
3. Enable snap to grid for alignment
4. Use dimension input for exact measurements
5. Run wall cleanup before finalizing

### For Complex Buildings
1. Start with exterior walls
2. Add major interior divisions
3. Use room detection to verify closure
4. Add details (doors, windows) last
5. Use layers to organize different systems

### For Collaboration
1. Use consistent wall types
2. Name rooms clearly
3. Add notes for special conditions
4. Export to standard formats (DXF, PDF)
5. Include scale and legend

## 🚀 Future Enhancements

### Planned Features
- [ ] 3D wall extrusion
- [ ] Automatic door/window placement
- [ ] Code compliance checking
- [ ] Material takeoff reports
- [ ] BIM integration
- [ ] Clash detection
- [ ] Parametric walls
- [ ] Wall assemblies/templates
- [ ] Multi-story support
- [ ] Structural analysis integration

## 📝 API Reference

### Core Functions

```typescript
// Advanced drawing modes
calculateOrthogonalPoint(start, current): Point
calculateAngleLockedPoint(start, current, angle): Point
calculateParallelPoint(refStart, refEnd, start, current): Point
calculatePerpendicularPoint(refStart, refEnd, start, current): Point
calculateOffsetWall(wallStart, wallEnd, distance, side): Wall

// Dimension input
dimensionToCoordinates(input, lastPoint, currentAngle): Point
parseInput(value, mode): DimensionInput

// Smart features
detectRooms(vertices, segments, scale): Room[]
cleanupWalls(vertices, segments, tolerance): CleanupResult
autoCloseRoom(start, end, vertices, segments): Segment
findWallGaps(vertices, segments, maxDistance): Gap[]
suggestRoomName(room): string
```

## 🎓 Tutorial Examples

### Example 1: Simple Rectangular Room
```
1. Select Orthogonal mode
2. Click start point
3. Type: 20 (20 feet right)
4. Type: 15 (15 feet up)
5. Type: 20 (20 feet left)
6. Click start point to close
```

### Example 2: L-Shaped Room
```
1. Draw outer rectangle (30x20)
2. Draw inner rectangle (10x10) at corner
3. Select both
4. Use Boolean subtract
5. Result: L-shaped room
```

### Example 3: Curved Wall
```
1. Select Arc mode
2. Click start point
3. Click end point
4. Drag to set curve
5. Click to confirm
```

## 📞 Support

For questions or issues:
- Check documentation
- Review examples
- Contact support team
- Submit feature requests

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-15  
**Author**: Comet Development Team
