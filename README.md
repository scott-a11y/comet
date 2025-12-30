# Comet - Shop Layout SaaS for Cabinet/Wood Shops

A modern web application for designing and managing shop layouts for cabinet and woodworking shops. Built with Next.js 14, Prisma, PostgreSQL, and TypeScript.

## Features

### ✅ Completed Features

#### Data Model & Database
- **15-table relational schema** with Postgres + Prisma ORM
- Tables: shops, shop_buildings, equipment_types, equipment, power_specs, equipment_placements, layouts, dust_collection_points, air_line_points, electrical_circuits, wall_outlets, ceiling_drops, overhead_doors, and more
- Full relationships and constraints
- Seeded with real data for "804 N Killingsworth" building and 9+ pieces of equipment

#### Buildings & Layouts Management
- **Dashboard** showing all buildings in the shop
- **Building detail pages** with dimensions and layout listings
- **Layout canvas** with visual grid display (10px = 1 foot scale)
- View equipment placements with dimensions and positions

#### Equipment Management
- **Equipment inventory page** with searchable table
- Equipment details including:
  - Name, manufacturer, model
  - Dimensions (length × width × height in inches)
  - Power specs (voltage, amperage, phase)
  - Equipment type categorization
- **Add new equipment form** with validation
- Edit and manage existing equipment

#### Interactive Layout Canvas
- **Drag-and-drop equipment placement**
  - Drag equipment blocks to reposition
  - Visual feedback with selection highlighting
  - Precise positioning on grid
- **Rotation tool** - Rotate selected equipment 90°
- **Real-time visual updates**
- Equipment displayed as scaled blocks with labels

#### Export Tools
- **Export to PNG** - Canvas screenshot download
- **Export to CSV** - Equipment list with positions
- **Export to JSON** - Complete layout data structure
- One-click download for all formats

#### Routing Tools
- **Dust Collection routing** - Orange lines for dust collection paths
- **Air Line routing** - Blue lines for compressed air
- **Electrical routing** - Red lines for electrical circuits
- Interactive point-by-point route drawing
- Route management (add/delete)
- Visual SVG-based rendering

## BOM‑V2 Floor Plan / Routing Editor (MVP)

The current MVP editor lives at:

- `app/editor/[layoutId]`

It persists a **versioned plan JSON** into `layout.canvasState`.

### Plan JSON shape (v2)

```ts
type LayoutPlanV2 = {
  version: 2
  ftPerPx: number | null
  items: CanvasItem[]
  runs: Run[]
}

type Run = {
  id: string
  system: "ELECTRICAL" | "AIR" | "DUCT" | "DUST" | "PIPING"
  from: { itemId: string; portId: string }
  to: { itemId: string; portId: string }
  segments: Array<{ x1: number; y1: number; x2: number; y2: number }>
}
```

### Adding equipment ports

Equipment definitions live in `lib/data/catalog.ts`. Add ports like:

```ts
ports: [
  { id: "power", system: "ELECTRICAL", offsetX: 0.1, offsetY: 0.1 }, // offsets in FEET
]
```

When an item is placed from the Library, ports are stored on the canvas item at `item.metadata.ports` with offsets converted to **pixels**.

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/scott-a11y/comet.git
cd comet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your DATABASE_URL
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Seed the database:
```bash
npx prisma db seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

Key tables and relationships:

- **shops** → **shop_buildings** (1:many)
- **shop_buildings** → **layouts** (1:many)
- **layouts** → **equipment_placements** (1:many)
- **equipment** → **equipment_placements** (1:many)
- **equipment** → **power_specs** (1:many)
- **layouts** → **dust_collection_points**, **air_line_points**, **electrical_circuits** (1:many each)

## API Routes

- `GET /api/buildings` - List all buildings
- `GET /api/buildings/[id]` - Get building details
- `GET /api/layouts/[id]` - Get layout with equipment placements
- `POST /api/equipment` - Add new equipment
- `GET /api/equipment` - List all equipment

## Project Structure

```
comet/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── buildings/
│   │   ├── page.tsx                # Buildings list
│   │   └── [id]/
│   │       ├── page.tsx            # Building detail
│   │       └── layouts/[layoutId]/
│   │           ├── page.tsx        # Layout canvas
│   │           ├── interactive-canvas.tsx
│   │           └── routing-tools.tsx
│   └── equipment/
│       ├── page.tsx                # Equipment list
│       └── new/
│           └── page.tsx            # Add equipment form
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Seed data
├── lib/
│   ├── prisma.ts                   # Prisma client
│   └── export.ts                   # Export utilities
└── public/
```

## Development Roadmap

### Future Enhancements
- [ ] Multi-tenant authentication (Clerk or Auth.js)
- [ ] Real-time collaboration
- [ ] 3D visualization
- [ ] PDF export with detailed annotations
- [ ] Cost estimation tools
- [ ] Mobile-responsive design improvements
- [ ] Workflow/cut list generation
- [ ] Integration with CAD tools

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
4. Deploy!

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ for cabinet makers and woodworkers