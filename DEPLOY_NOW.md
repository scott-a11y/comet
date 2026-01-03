# Vercel Deployment Guide - Step by Step

## 🚀 Deploy Comet to Vercel

### Current Status
✅ Code committed locally  
⚠️ Git push to GitHub has authentication issues  
✅ Vercel CLI installed (v50.1.3)  

---

## Option 1: Deploy Directly with Vercel CLI (Recommended)

You can deploy directly from your local machine without pushing to GitHub first.

### Step 1: Login to Vercel
```bash
vercel login
```
This will open your browser to authenticate.

### Step 2: Deploy to Vercel
```bash
cd c:\Dev\comet
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (first time)
- **Project name?** → comet (or your preferred name)
- **Directory?** → ./ (current directory)
- **Override settings?** → No

This will deploy to a preview URL first.

### Step 3: Deploy to Production
```bash
vercel --prod
```

This deploys to your production domain.

---

## Option 2: Fix Git Push & Deploy via GitHub

### Fix Git Authentication
The push is failing due to authentication. Try one of these:

#### A. Use GitHub CLI
```bash
gh auth login
git push origin main
```

#### B. Use Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic) with `repo` scope
3. Use token as password when pushing

#### C. Check Git Credentials
```bash
git config --global credential.helper manager-core
git push origin main
```

### Then Connect Vercel to GitHub
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import from GitHub: `scott-a11y/comet`
3. Configure and deploy

---

## 🔧 Environment Variables (Required)

After deploying, you MUST set these environment variables in Vercel:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

### Required Variables:

```env
# Database (CRITICAL - App won't work without this)
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require

# Clerk Authentication (Required for login)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Clerk URLs (Use defaults)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/

# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-...

# Vercel Blob Storage (Required for file uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Upstash Redis (Required for rate limiting)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### Optional Variables:

```env
# Sentry (Error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_DSN=https://...

# Trigger.dev (Background jobs)
TRIGGER_API_KEY=tr_live_...

# App Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 📊 After Deployment

### 1. Run Database Migrations

In Vercel Dashboard → Your Project → Settings → General → scroll to "Build & Development Settings" → click "Override" → add this to "Install Command":

```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

Or run manually in Vercel's terminal:
```bash
npx prisma migrate deploy
```

### 2. Seed Database (Optional)
```bash
npx prisma db seed
```

### 3. Verify Deployment
Visit these URLs:
- `https://your-app.vercel.app` - Homepage
- `https://your-app.vercel.app/debug` - System diagnostics
- `https://your-app.vercel.app/buildings` - Buildings page

---

## 🎯 Quick Start Commands

### Deploy Now (Easiest)
```bash
cd c:\Dev\comet
vercel login
vercel --prod
```

### Check Deployment Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs
```

### Open in Browser
```bash
vercel open
```

---

## 🔍 Troubleshooting

### If Build Fails on Vercel

**Error**: Turbopack internal error

**Solution**: Vercel should handle this automatically. If not, try:

1. In Vercel Dashboard → Settings → General → Node.js Version → Select 20.x
2. Add to `package.json`:
   ```json
   "engines": {
     "node": ">=20.0.0"
   }
   ```

### If Database Connection Fails

**Check**:
1. DATABASE_URL is set correctly
2. Database allows connections from Vercel IPs
3. SSL mode is enabled (`?sslmode=require`)

### If Authentication Fails

**Check**:
1. Clerk keys are set (both publishable and secret)
2. Clerk domain is configured for your Vercel URL
3. Redirect URLs are correct

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Vercel account created
- [ ] Production database ready (Supabase/Neon/Vercel Postgres)
- [ ] Clerk account with production keys
- [ ] OpenAI API key
- [ ] Upstash Redis instance
- [ ] Vercel Blob storage configured

---

## 🎉 Success Indicators

After deployment, you should see:

✅ Build completes successfully  
✅ `/debug` page shows all services connected  
✅ Can sign in with Clerk  
✅ Can create buildings  
✅ Can upload floor plans  
✅ AI analysis works  

---

## 🆘 Need Help?

### Vercel Support
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support

### Check Logs
```bash
vercel logs --follow
```

### Redeploy
```bash
vercel --prod --force
```

---

**Ready to deploy? Run:**

```bash
vercel login
vercel --prod
```

Then configure environment variables in the Vercel dashboard!
