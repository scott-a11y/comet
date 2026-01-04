# Comet Production Environment Template

Use the following variables to configure your production environment (Vercel, etc.).

```env
# 1. DATABASE (Prisma / PostgreSQL)
# Connection string for your live database (Supabase, Neon, or Vercel Postgres)
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require"

# 2. AUTHENTICATION (Clerk)
# Get these from your Clerk Dashboard -> API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxyz"
CLERK_SECRET_KEY="sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxyz"

# Clerk UI URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/"

# 3. AI & INTELLIGENCE (OpenAI)
# Required for AI Layout Generation and PDF Spec Extraction
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 4. FILE STORAGE (Vercel Blob)
# Get this from Vercel Project -> Storage -> Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# 5. RATE LIMITING (Upstash Redis)
# Used by lib/rate-limit.ts to prevent API abuse
UPSTASH_REDIS_REST_URL="https://[your-instance].upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 6. MONITORING (Sentry)
# Optional: Error tracking
NEXT_PUBLIC_SENTRY_DSN="https://xxxxxxxxxxxxx@ooxxxxx.ingest.sentry.io/xxxxxxx"
SENTRY_DSN="https://xxxxxxxxxxxxx@ooxxxxx.ingest.sentry.io/xxxxxxx"

# 7. BACKGROUND JOBS (Trigger.dev)
# Project ID from trigger.config.ts: proj_pdxruug
TRIGGER_API_KEY="tr_live_xxxxxxxxxxxxxxxxxxxx"

# 8. APP SETTINGS
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-app-domain.com"
```

## Setup Instructions

### 1. Database
Run `npx prisma migrate deploy` in your CI/CD pipeline or before the first deployment to ensure the schema is applied to the live database.

### 2. Clerk
Ensure the **Clerk Webhook** is configured if you intend to sync user data back to the database (though current logic relies on session IDs).

### 3. Vercel Blob
The URL whitelist in `actions/analyze.ts` is currently limited to `blob.vercel-storage.com` and `localhost`. If you use a custom domain for storage, you must update the `allowedHosts` array in that file.

### 4. Sentry
Run `npx @sentry/wizard -i nextjs` if you want to regenerate the configuration files for your specific Sentry project.
