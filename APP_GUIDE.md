# 🏗️ Comet - Complete Application Guide

## Main Application Overview

**Comet** is a full-featured shop layout and design platform. Here's everything that's available:

---

## 🏠 Main Pages & Features

### 1. **Home Page** - `http://localhost:3000`
The landing page and navigation hub for the entire application.

### 2. **Buildings Management** - `http://localhost:3000/buildings`
**Core Feature:** Create and manage shop buildings

**What You Can Do:**
- View all your buildings
- Create new buildings with dimensions
- Upload floor plan PDFs for analysis
- Edit building details
- Delete buildings

**Key Features:**
- Building dimensions (width, depth, ceiling height)
- Mezzanine support
- Floor geometry drawing (2D canvas)
- PDF upload and analysis
- Calibration tools (feet per unit)

---

### 3. **Building Detail View** - `http://localhost:3000/buildings/[id]`
**Core Feature:** Design your shop layout

**What You Can Do:**
- **Add Equipment:** Place machines in your shop
- **Draw Floor Plan:** Use the wall designer to draw walls
- **Add Zones:** Define work areas (assembly, finishing, storage)
- **Add Utility Points:** Mark electrical panels, dust collectors, air compressors
- **Design Systems:** Route dust collection, electrical, compressed air

**Key Components:**
- **Wall Designer:** Interactive 2D canvas for drawing walls
- **Equipment Placement:** Drag-and-drop equipment positioning
- **Systems Layer:** Design routing for utilities
- **Measurement Tools:** Calibration and scaling

---

### 4. **3D Visualization** - `http://localhost:3000/buildings/[id]/3d`
**Core Feature:** View your shop in 3D with collision detection

**What You Can Do:**
- See your shop layout in 3D
- Rotate and zoom the view
- **Collision Detection:** Overlapping equipment turns RED
- Visual feedback with wireframe outlines
- Collision warning banner

**Technology:**
- Three.js for 3D rendering
- Real-time AABB collision detection
- Interactive camera controls

---

### 5. **Equipment Catalog** - `http://localhost:3000/equipment/new`
**Core Feature:** Add equipment to your building

**What You Can Do:**
- Browse equipment catalog
- Add custom equipment
- Specify dimensions (width, depth)
- Set power requirements (voltage, phase, amps)
- Define dust collection needs (CFM, port diameter)
- Set compressed air requirements

**Equipment Types:**
- Table Saws
- CNC Routers
- Jointers
- Planers
- Dust Collectors
- Air Compressors
- Workbenches
- And more...

---

### 6. **Machinery Spec Extraction** - `http://localhost:3000/specs`
**Core Feature:** AI-powered spec extraction from PDF manuals

**What You Can Do:**
- Upload equipment PDF manuals
- AI extracts specifications automatically
- Save specs to your equipment database

**Extracted Data:**
- Manufacturer and model
- Dimensions (W × D × H)
- Electrical requirements (voltage, phase, amps, power)
- Weight and other specs

---

### 7. **AI Vision Analysis** - `http://localhost:3000/ai-vision-test`
**NEW Feature:** Automatic floor plan analysis

**What You Can Do:**
- Upload floor plan images or PDFs
- AI detects equipment automatically
- Extracts building dimensions
- Maps utility port locations
- Generates equipment list with positions

---

## 🎨 Design Tools

### Wall Designer
**Location:** Within building detail view

**Features:**
- Draw walls with click-and-drag
- Set wall thickness
- Snap to grid
- Measurement display
- Export floor geometry

### Systems Layer
**Location:** Building detail view → Systems tab

**Features:**
- **Dust Collection Routing:** Design ductwork paths
- **Electrical Circuits:** Plan wire runs
- **Compressed Air Lines:** Route pneumatic systems
- **Automatic Calculations:**
  - Duct sizing (CFM, velocity, pressure loss)
  - Wire sizing (ampacity, voltage drop)
  - Conduit sizing
  - Breaker sizing

### Equipment Placement
**Location:** Building detail view

**Features:**
- Drag-and-drop positioning
- Rotation controls
- Snap to grid
- Clearance visualization
- Collision warnings

---

## 📊 Calculation Features

### 1. **Ducting Calculations** - `lib/systems/ducting.ts`
- Optimal diameter calculation
- Velocity calculation (FPM)
- Friction loss calculation
- Static pressure calculations

### 2. **Electrical Calculations** - `lib/systems/electrical.ts`
- Wire sizing by ampacity
- Voltage drop calculations
- Conduit sizing (NEC Chapter 9)
- Breaker sizing
- Circuit optimization

### 3. **BOM Generation** - `lib/systems/bom.ts` (NEW!)
- Material quantity calculations
- Automatic fitting detection (elbows, connectors)
- Cost estimation
- Categorized output (wire, pipe, fittings)

### 4. **Compressed Air** - `lib/systems/compressed-air.ts`
- Pressure drop calculations
- Pipe sizing
- Flow rate calculations

---

## 🗄️ Database Features

### Buildings
- Store building dimensions
- Save floor geometry
- Track calibration settings
- Link to equipment and layouts

### Equipment
- Equipment catalog
- Power specifications
- Dust collection specs
- Air requirements
- Custom equipment support

### Layouts
- Multiple layouts per building
- Equipment positions
- System routing
- Collision data
- Version history

### Utility Points
- Electrical panels
- Dust collectors
- Air compressors
- Connection points for routing

---

## 🔧 API Endpoints

### Buildings
- `GET /api/buildings` - List all buildings
- `POST /api/buildings` - Create building
- `GET /api/buildings/[id]` - Get building details
- `PUT /api/buildings/[id]` - Update building
- `DELETE /api/buildings/[id]` - Delete building

### Equipment
- `GET /api/equipment` - List equipment
- `POST /api/equipment` - Add equipment
- `GET /api/equipment/[id]` - Get equipment details

### Layouts
- `GET /api/layouts` - List layouts
- `POST /api/layouts` - Create layout
- `GET /api/layouts/[id]` - Get layout details
- `GET /api/layouts/[id]/collisions` - Get collision report
- `POST /api/layouts/[id]/collisions` - Save collision data

### Analysis
- `POST /api/analyze-floorplan` - AI vision analysis (NEW!)
- `POST /api/upload` - File upload (images, PDFs)

---

## 🎯 Complete User Workflows

### Workflow 1: Design a New Shop from Scratch
1. **Create Building** → `/buildings/new`
   - Enter dimensions (30' × 40')
   - Set ceiling height (10')
   - Click "Create"

2. **Draw Floor Plan** → Building detail page
   - Use wall designer to draw walls
   - Add doors and windows
   - Calibrate scale

3. **Add Equipment** → Equipment tab
   - Select from catalog or add custom
   - Position equipment on floor plan
   - Set orientations

4. **Design Systems** → Systems tab
   - Route dust collection from machines to collector
   - Plan electrical circuits from panel to machines
   - Add compressed air lines if needed

5. **Check Collisions** → 3D view
   - View layout in 3D
   - Verify no red equipment (collisions)
   - Adjust positions if needed

6. **Generate BOM** → Systems tab
   - Calculate materials needed
   - Export shopping list
   - Get cost estimates

---

### Workflow 2: Import Existing Shop from Photo
1. **Upload Floor Plan** → `/ai-vision-test`
   - Upload photo or PDF of existing shop
   - AI analyzes and detects equipment
   - Get dimensions and equipment list

2. **Create Building** → Use AI-detected dimensions
   - Copy width/length from analysis
   - Create building

3. **Add Detected Equipment** → Equipment tab
   - Add equipment matching AI detections
   - Position at AI-provided coordinates
   - Verify and adjust

4. **Continue with Workflow 1** (steps 4-6)

---

### Workflow 3: Optimize Existing Layout
1. **Open Building** → `/buildings/[id]`
2. **View Current Layout** → 3D view
3. **Identify Issues:**
   - Collisions (red equipment)
   - Inefficient workflow paths
   - Poor system routing
4. **Make Adjustments:**
   - Reposition equipment
   - Redesign system routes
   - Add missing utility points
5. **Verify Improvements:**
   - Check collisions cleared
   - Calculate new BOM
   - Compare before/after

---

## 🚀 Quick Start Guide

### For First-Time Users:

1. **Start the dev server** (already running):
   ```
   npm run dev
   ```

2. **Open the app**:
   ```
   http://localhost:3000
   ```

3. **Create your first building**:
   - Click "Buildings" or go to `/buildings/new`
   - Enter: "My Workshop", 30' × 40', 10' ceiling
   - Click "Create Building"

4. **Add some equipment**:
   - Click "Add Equipment"
   - Select "Table Saw" from catalog
   - Position it on the floor plan

5. **View in 3D**:
   - Click "View in 3D"
   - See your shop come to life!

---

## 📁 Key Files & Directories

### Pages (App Router)
```
app/
├── page.tsx                    # Home page
├── buildings/
│   ├── page.tsx               # Buildings list
│   ├── new/page.tsx           # Create building
│   └── [id]/
│       ├── page.tsx           # Building detail
│       └── 3d/page.tsx        # 3D view
├── equipment/
│   └── new/page.tsx           # Add equipment
├── specs/page.tsx             # Spec extraction
└── ai-vision-test/page.tsx   # AI vision (NEW!)
```

### Components
```
components/
├── 3d/
│   ├── Scene.tsx              # 3D scene setup
│   ├── BuildingShell.tsx      # Building walls
│   └── EquipmentModel.tsx     # Equipment 3D models
├── calculators/
│   └── DustCollectionCalculator.tsx
└── systems/
    └── IntelligentSystemDesigner.tsx
```

### Libraries
```
lib/
├── systems/
│   ├── ducting.ts             # Duct calculations
│   ├── electrical.ts          # Electrical calculations
│   ├── compressed-air.ts      # Air calculations
│   └── bom.ts                 # BOM generation (NEW!)
├── ai/
│   └── layout-generator.ts    # AI layout creation (NEW!)
├── validations/
│   ├── analysis.ts            # AI analysis schema (UPDATED!)
│   └── collision.ts           # Collision detection
└── pdf.ts                     # PDF conversion (NEW!)
```

---

## 🎨 UI Features

### Responsive Design
- Works on desktop, tablet, mobile
- Touch-friendly controls
- Adaptive layouts

### Dark Mode
- Modern dark theme
- High contrast for readability
- Reduced eye strain

### Interactive Canvas
- Zoom and pan
- Snap to grid
- Measurement overlays
- Real-time updates

### 3D Visualization
- Smooth camera controls
- Realistic lighting
- Color-coded collisions
- Wireframe mode

---

## 🔐 Authentication (If Configured)

**Clerk Integration:**
- User authentication
- Multi-user support
- Role-based access
- Session management

**Note:** Authentication is optional for local development.

---

## 📊 Database Schema

**Prisma Models:**
- `ShopBuilding` - Building records
- `Equipment` - Equipment catalog
- `LayoutInstance` - Layout versions
- `EquipmentLayoutPosition` - Equipment positions
- `UtilityPoint` - Electrical panels, dust collectors, etc.
- `DustRun` - Dust collection routing
- `ElectricalCircuit` - Electrical circuits
- `AirRun` - Compressed air routing
- `SystemRun` - Unified system routing (NEW!)

---

## 🧪 Testing the Full App

### Test the Complete Workflow:

1. **Home Page** → http://localhost:3000
2. **Create Building** → Click "Buildings" → "New Building"
3. **Add Equipment** → In building detail, add equipment
4. **View 3D** → Click "View in 3D"
5. **Test AI Vision** → Go to `/ai-vision-test`
6. **Test Spec Extraction** → Go to `/specs`

### Verify All Features Work:
- ✅ Building CRUD operations
- ✅ Equipment placement
- ✅ 3D rendering
- ✅ Collision detection
- ✅ System routing
- ✅ AI vision analysis
- ✅ PDF spec extraction
- ✅ BOM generation

---

## 🎯 What's Production-Ready

### ✅ Fully Implemented:
1. Building management
2. Equipment catalog
3. 2D floor plan designer
4. 3D visualization
5. Collision detection
6. System calculations (ducting, electrical, air)
7. BOM generation
8. AI vision analysis (images + PDFs)
9. PDF spec extraction

### 🚧 Future Enhancements:
1. Multi-user collaboration
2. Equipment marketplace
3. Template library
4. Export to CAD formats
5. Mobile app
6. AR visualization

---

**The full application is ready to test at `http://localhost:3000`!** 🚀

*Complete App Guide Version 1.0*  
*Created: January 8, 2026*
