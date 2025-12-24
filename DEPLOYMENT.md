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

### 2. Set Up Clerk Authentication (2 minutes)

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Go to **API Keys** section (or use this link: https://dashboard.clerk.com/last-active?path=api-keys)
4. Copy both keys:
   - **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret Key** (starts with `sk_test_...` or `sk_live_...`)

⚠️ **IMPORTANT**: Don't mix up these keys! The publishable key is public-safe, the secret key must be kept private.

### 3. Deploy to Vercel (3 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Click **Import Project**
3. Import from GitHub: `scott-a11y/comet`
4. In **Environment Variables**, add:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `DATABASE_URL` | `postgresql://...` | Your Supabase connection string |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | From Clerk dashboard (must start with `pk_`) |
   | `CLERK_SECRET_KEY` | `sk_test_...` | From Clerk dashboard (must start with `sk_`) |
   | `BLOB_READ_WRITE_TOKEN` | `vercel_blob_...` | Optional: For PDF uploads |
   | `OPENAI_API_KEY` | `sk-...` | Optional: For PDF analysis |

5. Click **Deploy**
6. Wait ~2 minutes for build

### 4. Run Database Migrations (1 minute)

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

### 5. Done!

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

### Clerk Authentication Errors

**"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_"**
- You've set a secret key (`sk_...`) where a publishable key should be
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to your **publishable** key (starts with `pk_`)
- Redeploy the application

**"CLERK_SECRET_KEY must start with sk_"**
- You've set a publishable key (`pk_...`) where a secret key should be
- Set `CLERK_SECRET_KEY` to your **secret** key (starts with `sk_`)
- Redeploy the application

**Authentication not working after deploy**
1. Verify both Clerk variables are set in Vercel:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_test_...` or `pk_live_...`
   - `CLERK_SECRET_KEY` = `sk_test_...` or `sk_live_...`
2. Make sure you're using keys from the same Clerk application
3. Redeploy after making changes

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
