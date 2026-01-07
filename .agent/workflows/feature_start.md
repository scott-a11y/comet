---
description: Start a new feature branch with dependencies synced
---

# Feature Start Workflow

This workflow initializes a new feature branch with all dependencies in sync.

## Steps

### 1. Sync main branch
```bash
git checkout main && git pull origin main
```
// turbo

### 2. Create feature branch
```bash
git checkout -b feature/[FEATURE_NAME]
```
// turbo

Replace [FEATURE_NAME] with a descriptive name like:
- feature/user-authentication
- feature/dashboard-redesign
- feature/export-to-pdf

### 3. Install dependencies
```bash
npm install
```
// turbo

### 4. Verify environment
```bash
npm run typecheck && npm run build
```

If this fails, check:
- .env.local exists and has correct values
- node_modules is clean (try: rm -rf node_modules && npm install)
- No TypeScript errors in existing code

### 5. Ready to work
You're now on a clean feature branch ready for development.

Remember:
- Keep this branch focused on one objective
- Commit frequently with clear messages
- Run typecheck before each commit
