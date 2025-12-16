# Deployment Guide for Comet

## Quick Deploy to Vercel + Supabase

### 1. Create Supabase Database (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create account
2. Click **New Project**
3. Fill in:
   - Name: `comet-db`
   - Database Password: (generate strong password)
   - Region: Choose closest to you
4. Wait ~2 minutes for provisioning
5. Go to **Settings** → **Database**
6. Copy the **Connection String** (starts with `postgresql://`)
7. Replace `[YOUR-PASSWORD]` with your actual password

### 2. Deploy to Vercel (3 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Click **Import Project**
3. Import from GitHub: `scott-a11y/comet`
4. In **Environment Variables**, add:
   ```
   DATABASE_URL=your_supabase_connection_string_here
   ```
5. Click **Deploy**
6. Wait ~2 minutes for build

### 3. Run Database Migrations (1 minute)

Option A: Use Vercel CLI locally
```bash
npm i -g vercel
vercel login
vercel link
npx prisma migrate deploy
npx prisma db seed
```

Option B: Run in your terminal with Supabase URL
```bash
DATABASE_URL="your_supabase_url" npx prisma migrate deploy
DATABASE_URL="your_supabase_url" npx prisma db seed
```

### 4. Done!

Your app is live at: `https://comet-[random].vercel.app`

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Setup

1. Clone the repo:
```bash
git clone https://github.com/scott-a11y/comet.git
cd comet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env and add your DATABASE_URL
```

4. Run migrations:
```bash
npx prisma migrate dev
```

5. Seed the database:
```bash
npx prisma db seed
```

6. Start dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"
```

## Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name description

# Deploy migrations (production)
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### "Can't reach database server"
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall/network settings

### "Migration failed"
```bash
# Reset and try again
npx prisma migrate reset
npx prisma migrate deploy
```

### "Prisma Client not generated"
```bash
npx prisma generate
```

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Database migrations deployed
- [ ] Seed data loaded
- [ ] Test all pages load
- [ ] Verify building detail page works
- [ ] Check API endpoints respond

