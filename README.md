# Comet - Shop Layout Tool for Cabinet/Wood Shops

A web-based shop layout planning tool for cabinet and woodworking shops. Design optimal layouts for machines, storage, electrical circuits, dust collection systems, and compressed air runs.

## Project Status

✅ Database schema created with 15 tables
✅ Seed data created for 804 N Killingsworth shop
✅ Next.js 14 + TypeScript + Prisma initialized

## Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS

## Database Schema

The database includes 15 tables:

1. **shop_buildings** - Physical shop locations
2. **shop_zones** - Zones within buildings (warehouse, office, yard)
3. **utility_points** - Electrical panels, transformers, dust collectors, compressors
4. **equipment** - Machines and tools
5. **equipment_power_specs** - Power requirements
6. **equipment_dust_specs** - Dust collection specs
7. **equipment_air_specs** - Compressed air specs
8. **layout_instances** - Different layout scenarios
9. **equipment_layout_positions** - Equipment placement in layouts
10. **dust_runs** - Dust collection duct runs
11. **air_runs** - Compressed air piping
12. **electrical_circuits** - Circuit definitions
13. **equipment_circuits** - Equipment-to-circuit mappings

## Initial Seed Data

The seed includes:

- **Building**: 804 N Killingsworth Ct (100' × 43' warehouse)
- **Zones**: Warehouse, Office Area, Storage Yard
- **Utility Points**: 
  - Main 480V Panel
  - Auto Transformer (40 kVA)
  - AL-KO APU 250 P Dust Collector
- **Equipment** (9 machines):
  - OMGA T 50/350 O.P. US (industrial miter saw)
  - Festool KAPEX KS 120 REB (sliding miter saw)
  - Grizzly G0621X Bandsaw
  - Central Machinery 39955 Drill Press
  - Maksiwa PHM.30 Planer
  - DeWalt DW735 Thickness Planer
  - Azzuno MF-200PRO Welder
  - BARTH Hydraulic Lift Table
  - Horizontal Panel Storage Rack

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

You need a PostgreSQL database. Options:

**Option A: Use a cloud database (recommended for Codespaces)**
- Create a free database at [Neon](https://neon.tech) or [Supabase](https://supabase.com)
- Copy the connection string

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL locally or use Docker
docker run --name comet-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 3. Configure Environment

Update `.env` with your database URL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/comet?schema=public"
```

### 4. Run Migrations

```bash
npx prisma migrate dev --name init
```

This creates all 15 tables in your database.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Seed the Database

First, add the seed script to `package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Install tsx:
```bash
npm install -D tsx
```

Run the seed:
```bash
npx prisma db seed
```

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Development Commands

```bash
# Run development server
npm run dev

# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Run seed script
npx prisma db seed
```

## Next Steps

1. **Implement Authentication** - Add NextAuth.js or Supabase Auth
2. **Build Buildings Dashboard** - List and create shop buildings
3. **Create Layout Canvas** - 2D draggable canvas for equipment placement
4. **Add Routing Tools** - Draw dust runs, air lines, and electrical circuits
5. **Export Features** - Generate PDFs, PNGs, and CSV/JSON exports

## Project Structure

```
comet/
├── app/                  # Next.js App Router pages
├── prisma/
│   ├── schema.prisma    # Database schema (15 tables)
│   └── seed.ts          # Seed script with 804 N Killingsworth data
├── .env                 # Database connection string
├── package.json
└── README.md
```

## Database Relationships

- Buildings → Zones (1:many)
- Buildings → Equipment (1:many)
- Buildings → Utility Points (1:many)
- Buildings → Layouts (1:many)
- Equipment → Power/Dust/Air Specs (1:1)
- Layouts → Equipment Positions (1:many)
- Layouts → Dust Runs (1:many)
- Layouts → Air Runs (1:many)
- Layouts → Electrical Circuits (1:many)

## License

MIT
