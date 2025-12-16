# Comet Setup Guide

## What's Been Built

### ✅ Completed Features

1. **Database Schema** (15 tables)
   - Complete Prisma schema with all relationships
   - Support for buildings, zones, equipment, layouts, utilities
   - Power specs, dust collection, compressed air tracking
   - Electrical circuits and equipment wiring

2. **Seed Data**
   - 804 N Killingsworth building (100' × 43')
   - 3 zones (Warehouse, Office, Storage Yard)
   - 3 utility points (Panel, Transformer, Dust Collector)
   - 9 machines with full specifications

3. **API Routes**
   - GET /api/buildings - List all buildings with equipment
   - POST /api/buildings - Create new building

4. **Pages Built**
   - Homepage with feature overview
   - Buildings list page (server-side rendered)
   - Responsive UI with Tailwind CSS

### 📦 Files Created

```
comet/
├── lib/
│   └── prisma.ts           # Prisma client singleton
├── app/
│   ├── page.tsx            # Homepage
│   ├── api/buildings/
│   │   └── route.ts        # Buildings API
│   └── buildings/
│       └── page.tsx        # Buildings list
├── prisma/
│   ├── schema.prisma       # Complete schema
│   └── seed.ts             # Seed data
└── .env                    # Database connection
```

## Next Steps to Deploy

### 1. Create Database

**Option A: Supabase (Recommended)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string from Settings → Database
4. Update `.env` file

**Option B: Neon**
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy Prisma connection string
4. Update `.env` file

### 2. Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create tables in database
npx prisma migrate dev --name init

# Seed the database
npm install -D tsx
npx prisma db seed
```

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable in Vercel dashboard:
# DATABASE_URL=your_connection_string
```

## Development Workflow

### Making Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe_change`
3. Prisma client auto-regenerates

### Testing Database

```bash
# Open Prisma Studio
npx prisma studio
```

### Viewing Data

Browse to:
- http://localhost:3000 - Homepage
- http://localhost:3000/buildings - Buildings list
- http://localhost:3000/api/buildings - API endpoint

## Troubleshooting

### Can't connect to database
- Check DATABASE_URL in `.env`
- Ensure database is running
- Check firewall/network settings

### Prisma client errors
```bash
npx prisma generate
```

### Migration issues
```bash
# Reset database (WARNING: deletes data)
npx prisma migrate reset
```

## What's Next

### Immediate Priorities
1. ✅ Database schema and migrations
2. ✅ Seed data for your shop
3. ✅ Basic UI and API
4. 🔲 Individual building detail page
5. 🔲 Equipment management
6. 🔲 Layout canvas (drag & drop)
7. 🔲 Electrical circuit planner
8. 🔲 Dust collection designer
9. 🔲 Export to PDF/CSV

### Future Features
- Authentication (NextAuth.js)
- Multi-user support
- Real-time collaboration
- 3D visualization
- Mobile app
- BOM/material lists
- Cost estimation
