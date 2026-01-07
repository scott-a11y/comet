# Comet - Repository Operating Instructions

## Stack
- Framework: Next.js 14+ (App Router)
- Hosting: Vercel
- Database: Supabase (PostgreSQL)
- Language: TypeScript
- Styling: Tailwind CSS

## Development Commands

### Local Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server locally
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint (auto-fix with --fix)
npm run format           # Prettier format

### Database (Supabase)
npx supabase migration new <name>   # Create new migration
npx supabase db push                # Apply migrations to remote
npx supabase db reset               # Reset local database
npx supabase db pull                # Pull remote schema
npx supabase gen types typescript --local > types/supabase.ts  # Generate types

### Deployment
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
vercel env pull          # Pull environment variables
git push origin main     # Auto-deploys to production via Vercel

### Testing
npm test                 # Run Jest unit tests
npm run test:watch       # Jest watch mode
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode

## Branch Naming
- feature/[name]         # New features
- fix/[name]             # Bug fixes
- refactor/[name]        # Code refactoring
- docs/[name]            # Documentation
- test/[name]            # Test additions

## Workflow Rules

### Before Starting Work
1. ALWAYS sync main first: git checkout main && git pull origin main
2. Create feature branch: git checkout -b feature/descriptive-name
3. Install dependencies if package.json changed: npm install

### During Development
1. Run typecheck frequently: npm run typecheck
2. Commit often with clear messages
3. Keep branches focused on single objectives
4. Update types after Supabase schema changes

### Before Creating PR
1. Run full preflight checks (see .agent/workflows/preflight.md)
2. Ensure all tests pass
3. Run build locally to catch production errors
4. Review your own diff first

### Deployment
1. Push branch triggers Vercel preview deployment
2. Check preview URL before merging
3. Merging to main auto-deploys to production
4. Monitor Vercel deployment logs

## Common Gotchas

### Environment Variables
- NEVER commit .env.local
- Use vercel env pull to sync env vars
- Supabase keys: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Server-only secrets go in .env (no NEXT_PUBLIC prefix)

### Next.js App Router
- Client components need 'use client' directive
- Server components are default (can't use hooks)
- Use server actions for mutations
- Metadata must be exported from page.tsx files

### Supabase
- Row Level Security (RLS) policies required for tables
- Always use typed Supabase client from @/lib/supabase
- Migrations must be applied: npx supabase db push
- Generate types after schema changes

### TypeScript
- Fix type errors before committing
- Use strict mode (enabled in tsconfig.json)
- Avoid 'any' - use 'unknown' and type guards
- Update Supabase types when schema changes

### Vercel
- Build failures block deployment
- Check Vercel logs for runtime errors
- Preview deployments clean up after 30 days
- Production builds take 2-5 minutes

## File Structure
src/
  app/              # Next.js App Router pages
  components/       # React components
  lib/              # Utility functions, DB clients
  types/            # TypeScript type definitions
  hooks/            # Custom React hooks
public/             # Static assets
supabase/           # Database migrations & config
.agent/workflows/   # Antigravity workflows

## Never Do This
- Don't push directly to main (use PRs)
- Don't commit sensitive keys or tokens
- Don't skip typecheck before PR
- Don't modify generated Supabase types manually
- Don't use 'any' without a comment explaining why
- Don't create branches from stale main

## When Something Breaks
1. Check Vercel deployment logs
2. Check browser console for client errors
3. Check Supabase logs for DB errors
4. Verify environment variables are set
5. Try: npm install && npm run dev (fresh install)
6. Check if migrations are applied

## Updating This File
When you discover a repeated mistake or new pattern:
1. Add it to the relevant section
2. Commit with message: "docs: update CLAUDE.md with [pattern]"
3. This file compounds learnings over time

---

## Shared Learnings (Cross-Project)

This section contains knowledge that applies across ALL projects. Keep this synchronized.

### Turbopack Symlink Issues
**Problem:** Turbopack (Next.js 15+) doesn't handle symlinks well in worktrees  
**Solution:** Downgrade Next.js from 16 to 14, rename config from `next.config.ts` to `next.config.mjs`

**Commands:**
```bash
npm install next@14 react@18 react-dom@18
mv next.config.ts next.config.mjs
# Convert TypeScript config to JavaScript format
```

### Worktree Best Practices
- **Always use `-b` flag** when creating worktrees: `git worktree add -b feature/name ../path`
- **Clean up stale branches** before creating new worktrees: `git branch -D old-branch`
- **Keep worktrees in parallel directory structure** (not nested)
- **Remove worktrees properly**: `git worktree remove path` then `git branch -D branch-name`

### Multi-Agent Workflow
- **Universal workflows** (`.agent/workflows/`) stay identical across projects:
  - `feature_start.md` - Feature initialization checklist
  - `preflight.md` - Pre-commit validation
  - `deploy_preview.md` - Deployment workflow
- **CLAUDE.md is project-specific** and contains this shared learnings section
- **Use Antigravity prompts** for manager coordination across parallel sessions
- **Parallel Claude sessions** for independent feature slices (UI, API, Tests)

### Development Workflow
1. Check `.agent/workflows/feature_start.md` before starting any feature
2. Run `.agent/workflows/preflight.md` checks before creating PR
3. Follow `.agent/workflows/deploy_preview.md` for deployments
4. Update shared learnings when discovering new patterns

### When You Learn Something New
If you discover a pattern, gotcha, or solution that applies to multiple projects:
1. Add it to this "Shared Learnings" section
2. Commit with message: "docs: add shared learning about [topic]"
3. **Manually sync this section** to other projects (Comet, HD75, etc.)
4. Keep the shared learnings identical across all CLAUDE.md files
