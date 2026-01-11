# 🗺️ Comet Application Routes

## Current Route Structure (Phase 1 Complete)

### Public Routes

#### Homepage
- **URL:** `/`
- **File:** `app/page.tsx`
- **Description:** Landing page with feature cards and navigation

---

### Building Management

#### Buildings List
- **URL:** `/buildings`
- **File:** `app/buildings/page.tsx`
- **Description:** List all buildings with create button

#### Building Details
- **URL:** `/buildings/[id]`
- **File:** `app/buildings/[id]/page.tsx`
- **Features:**
  - Building information
  - Equipment list
  - **Entry Point Manager** (Phase 1 - NEW)
  - Layout list
  - 3D view link

#### Create Building
- **URL:** `/buildings/new`
- **File:** `app/buildings/new/page.tsx`
- **Description:** Form to create new building

#### Building 3D View
- **URL:** `/buildings/[id]/3d`
- **File:** `app/buildings/[id]/3d/page.tsx`
- **Description:** 3D visualization of building

---

### Layout Management

#### Layout Canvas (Interactive)
- **URL:** `/buildings/[id]/layouts/[layoutId]`
- **File:** `app/buildings/[id]/layouts/[layoutId]/page.tsx`
- **Features:**
  - Interactive equipment placement (drag-and-drop)
  - AI Layout Optimizer
  - **Material Flow Path Editor** (Phase 1 - NEW)
  - Equipment list with positions
  - PDF export

#### Create Layout
- **URL:** `/buildings/[id]/layouts/new`
- **File:** `app/buildings/[id]/layouts/new/page.tsx`
- **Description:** Form to create new layout

---

### Equipment Management

#### Equipment List
- **URL:** `/equipment`
- **File:** `app/equipment/page.tsx`
- **Description:** List all equipment across all buildings

#### Create Equipment
- **URL:** `/equipment/new`
- **File:** `app/equipment/new/page.tsx`
- **Description:** Form to add new equipment with specs

---

### Phase 1 Features (NEW)

#### Lean Analysis (Spaghetti Diagram)
- **URL:** `/lean-analysis`
- **File:** `app/lean-analysis/page.tsx`
- **Features:**
  - Workflow distance calculation
  - Lean score (0-100)
  - **Enhanced Spaghetti Diagram** with quantified metrics
  - **22% cycle time reduction potential**
  - Travel time as % of cycle time
  - Touches/handoffs count
  - Non-value-added time analysis
  - Optimization suggestions

#### KPI Dashboard
- **URL:** `/kpi-dashboard`
- **File:** `app/kpi-dashboard/page.tsx`
- **Features:**
  - **Overall Equipment Effectiveness (OEE)**
    - Availability × Performance × Quality
    - World-class benchmark: ≥85%
  - **Cycle Time vs Takt Time**
    - Real-time comparison
    - Status indicators
  - **Throughput Rate**
    - Current vs target units/hour
    - Daily/weekly projections
  - **Quality Metrics**
    - First-Pass Yield
    - Defect Rate
    - Rework Rate
  - **Live Updates** toggle for real-time simulation

---

### Other Features

#### Settings
- **URL:** `/settings`
- **File:** `app/settings/page.tsx`
- **Description:** Application settings

#### Quality Management
- **URL:** `/quality`
- **File:** `app/quality/page.tsx`
- **Description:** Quality control and inspection

#### SOP (Standard Operating Procedures)
- **URL:** `/sop`
- **File:** `app/sop/page.tsx`
- **Description:** List of SOPs

#### SOP Details
- **URL:** `/sop/[id]`
- **File:** `app/sop/[id]/page.tsx`
- **Description:** Individual SOP view

#### Kaizen (Continuous Improvement)
- **URL:** `/kaizen`
- **File:** `app/kaizen/page.tsx`
- **Description:** Kaizen events and improvements

#### Inventory
- **URL:** `/inventory`
- **File:** `app/inventory/page.tsx`
- **Description:** Inventory management

---

## API Routes

### Buildings
- `GET /api/buildings` - List all buildings
- `POST /api/buildings` - Create building
- `GET /api/buildings/[id]` - Get building details
- `PUT /api/buildings/[id]` - Update building
- `DELETE /api/buildings/[id]` - Delete building

### Entry Points (Phase 1 - NEW)
- `GET /api/buildings/[id]/entry-points` - List entry points
- `POST /api/buildings/[id]/entry-points` - Create entry point
- `PUT /api/buildings/[id]/entry-points/[entryPointId]` - Update entry point
- `DELETE /api/buildings/[id]/entry-points/[entryPointId]` - Delete entry point

### Layouts
- `GET /api/buildings/[id]/layouts` - List layouts
- `POST /api/buildings/[id]/layouts` - Create layout
- `PUT /api/layouts/[layoutId]/positions` - Update equipment positions
- `GET /api/buildings/[id]/layouts/[layoutId]/export` - Export layout to PDF

### Material Flow Paths (Phase 1 - NEW)
- `POST /api/layouts/[layoutId]/material-flow-paths` - Create flow path
- `DELETE /api/layouts/[layoutId]/material-flow-paths/[pathId]` - Delete flow path

### Equipment
- `GET /api/equipment` - List all equipment
- `POST /api/equipment` - Create equipment
- `PUT /api/equipment/[id]` - Update equipment
- `DELETE /api/equipment/[id]` - Delete equipment

---

## Route Conflicts Fixed

### ❌ REMOVED (Conflicted with layouts/[layoutId])
- `/buildings/[id]/layout` → Renamed to `layout.old`

This route was causing the error:
```
Error: You cannot use different slug names for the same dynamic path ('layoutId' !== 'id').
```

---

## Dynamic Route Parameters

| Route | Parameter | Type | Description |
|-------|-----------|------|-------------|
| `/buildings/[id]` | `id` | number | Building ID |
| `/buildings/[id]/layouts/[layoutId]` | `layoutId` | number | Layout ID |
| `/equipment/[id]` | `id` | number | Equipment ID |
| `/sop/[id]` | `id` | string | SOP ID (CUID) |
| `/api/buildings/[id]/entry-points/[entryPointId]` | `entryPointId` | number | Entry Point ID |
| `/api/layouts/[layoutId]/material-flow-paths/[pathId]` | `pathId` | number | Flow Path ID |

---

## Navigation Flow

```
Homepage (/)
├── Buildings (/buildings)
│   ├── Building Details (/buildings/[id])
│   │   ├── Entry Point Manager (on page)
│   │   ├── Layout List (on page)
│   │   └── 3D View (/buildings/[id]/3d)
│   ├── Layout Canvas (/buildings/[id]/layouts/[layoutId])
│   │   ├── Interactive Canvas
│   │   ├── Material Flow Path Editor
│   │   └── AI Optimizer
│   └── Create Building (/buildings/new)
├── Equipment (/equipment)
│   └── Create Equipment (/equipment/new)
├── Lean Analysis (/lean-analysis)
│   └── Spaghetti Diagram with Metrics
└── KPI Dashboard (/kpi-dashboard)
    └── Real-time Performance Metrics
```

---

## Phase 2 Planned Routes (Future)

- `/cellular-layouts` - Pre-configured cellular manufacturing layouts
- `/5s-checklist` - 5S workplace organization
- `/standard-work` - Standard work documentation
- `/oee-tracking` - Real-time OEE data collection

---

*Last Updated: 2026-01-09*  
*Phase 1: Complete (5/5 features)*  
*Total Routes: 20+ pages, 15+ API endpoints*
