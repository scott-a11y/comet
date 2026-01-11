# 🛡️ Prevention Guide - Avoiding Common Development Issues

## Issue We Just Fixed: Route Conflict

**Problem:** Next.js routing conflict between `/buildings/[id]/layout` and `/buildings/[id]/layouts/[layoutId]`

**Error Message:**
```
Error: You cannot use different slug names for the same dynamic path ('layoutId' !== 'id').
```

---

## 🔒 How to Prevent This in the Future

### 1. Route Naming Best Practices

#### ✅ DO:
- Use **consistent naming** for dynamic routes at the same level
- Use **plural names** for collections: `/layouts/[layoutId]`, `/buildings/[buildingId]`
- Keep route structure **simple and flat** when possible

#### ❌ DON'T:
- Mix singular and plural at the same level: `/layout` and `/layouts/[id]`
- Use different parameter names for the same resource type
- Create deeply nested dynamic routes without planning

### Example - Correct Structure:
```
app/
├── buildings/
│   ├── [buildingId]/
│   │   ├── page.tsx
│   │   ├── layouts/
│   │   │   ├── [layoutId]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
```

### Example - WRONG (causes conflicts):
```
app/
├── buildings/
│   ├── [id]/
│   │   ├── layout/          ❌ Conflicts with layouts/[layoutId]
│   │   │   └── page.tsx
│   │   ├── layouts/
│   │   │   └── [layoutId]/  ❌ Different param name at same level
```

---

## 2. Development Workflow Checklist

### Before Starting Dev Server:

```powershell
# 1. Check for route conflicts
Get-ChildItem -Path "app" -Recurse -Directory | Where-Object { $_.Name -match '^\[' } | Select-Object FullName

# 2. Check for TypeScript errors
npx tsc --noEmit

# 3. Clean build if needed
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Start server
npm run dev
```

### When Adding New Routes:

1. **Plan the route structure first**
   - Sketch out the URL pattern
   - Check for conflicts with existing routes
   - Use consistent naming conventions

2. **Test immediately after creating**
   - Start dev server
   - Navigate to the new route
   - Check for errors in console

3. **Document the route**
   - Add to your route map/documentation
   - Note any special parameters or behaviors

---

## 3. Quick Reference Commands

### Start Server (Clean)
```powershell
# Kill any existing node processes
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Clean build
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Start fresh
npm run dev
```

### Check Server Status
```powershell
# Check if port 3000 is listening
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

# Check node processes
Get-Process -Name node -ErrorAction SilentlyContinue
```

### Troubleshooting
```powershell
# Check for TypeScript errors
npx tsc --noEmit

# Check for ESLint errors
npm run lint

# View build errors
npm run build
```

---

## 4. Common Issues & Solutions

### Issue: "ERR_CONNECTION_REFUSED"
**Cause:** Server not running or crashed  
**Solution:**
```powershell
Stop-Process -Name node -Force
npm run dev
```

### Issue: "You cannot use different slug names..."
**Cause:** Route naming conflict  
**Solution:**
1. Find conflicting routes with `Get-ChildItem -Path "app" -Recurse -Directory`
2. Rename or delete old/duplicate routes
3. Restart server

### Issue: Server starts but doesn't listen on port
**Cause:** Compilation error  
**Solution:**
```powershell
# Check for errors
npx tsc --noEmit

# Clean build
Remove-Item -Path ".next" -Recurse -Force
npm run dev
```

### Issue: Browser shows old/cached content
**Cause:** Browser cache  
**Solution:**
- Press `Ctrl + Shift + R` (hard refresh)
- Or open incognito window
- Or clear browser cache (`Ctrl + Shift + Delete`)

---

## 5. Project Structure Best Practices

### Recommended Folder Organization:

```
c:\Dev\comet/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── buildings/         # Building-related pages
│   ├── equipment/         # Equipment pages
│   ├── lean-analysis/     # Lean analysis page
│   ├── kpi-dashboard/     # KPI dashboard page
│   └── page.tsx           # Homepage
├── components/            # Reusable components
├── lib/                   # Utility functions
├── prisma/               # Database schema & migrations
├── public/               # Static assets
└── .next/                # Build output (auto-generated, can delete)
```

### Archive Old Code:
Instead of deleting old routes, move them to an archive:
```powershell
# Create archive directory
New-Item -Path "archive" -ItemType Directory -Force

# Move old code
Move-Item -Path "app/buildings/[id]/layout" -Destination "archive/layout.old"
```

---

## 6. Git Best Practices

### Before Making Changes:
```bash
# Create a feature branch
git checkout -b feature/new-route

# Make your changes
# ...

# Test thoroughly
npm run dev
# Navigate to new routes in browser

# Commit
git add .
git commit -m "Add new route: /buildings/[id]/layouts/[layoutId]"

# Push
git push origin feature/new-route
```

### If Something Breaks:
```bash
# Revert to last working commit
git log --oneline  # Find last good commit
git reset --hard <commit-hash>

# Or stash changes
git stash
npm run dev  # Test if it works
git stash pop  # Restore changes
```

---

## 7. Startup Script

Create a `start-clean.bat` file for easy clean starts:

```batch
@echo off
echo Cleaning up...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Deleting .next directory...
if exist .next rmdir /s /q .next

echo Starting dev server...
npm run dev
```

Usage: Double-click `start-clean.bat` whenever you need a fresh start.

---

## 8. Monitoring & Debugging

### Watch for These Warnings:
- ⚠️ "Fast Refresh" warnings → Component structure issues
- ⚠️ "Hydration" errors → Server/client mismatch
- ⚠️ "Module not found" → Import path issues
- ⚠️ Route conflicts → Duplicate or conflicting routes

### Enable Verbose Logging:
```powershell
# Set environment variable for detailed logs
$env:DEBUG="*"
npm run dev
```

---

## 9. Pre-Deployment Checklist

Before deploying or committing major changes:

- [ ] Run `npx tsc --noEmit` (no TypeScript errors)
- [ ] Run `npm run lint` (no linting errors)
- [ ] Run `npm run build` (successful production build)
- [ ] Test all routes in browser
- [ ] Clear browser cache and test again
- [ ] Check for console errors (F12)
- [ ] Test on different browsers (Chrome, Firefox, Edge)
- [ ] Verify database migrations applied (`npx prisma db push`)
- [ ] Check `.env` variables are set correctly

---

## 10. Quick Fixes Reference

| Problem | Quick Fix |
|---------|-----------|
| Server won't start | `Stop-Process -Name node -Force; npm run dev` |
| Old content showing | `Ctrl + Shift + R` in browser |
| Route conflict | Rename/delete conflicting route, restart server |
| TypeScript errors | `npx tsc --noEmit` to see errors |
| Database errors | `npx prisma db push` and `npx prisma generate` |
| Port already in use | `Stop-Process -Name node -Force` |
| Build cache issues | `Remove-Item .next -Recurse -Force` |

---

## 📞 Emergency Recovery

If everything is broken:

```powershell
# 1. Kill all node processes
Stop-Process -Name node -Force

# 2. Clean everything
Remove-Item -Path ".next" -Recurse -Force
Remove-Item -Path "node_modules" -Recurse -Force

# 3. Reinstall
npm install

# 4. Regenerate Prisma
npx prisma generate

# 5. Start fresh
npm run dev
```

---

## 📚 Documentation to Maintain

Keep these files updated:
- `README.md` - Project overview and setup
- `ROUTES.md` - Complete route map
- `CHANGELOG.md` - Track changes and fixes
- `.env.example` - Required environment variables

---

*Last Updated: 2026-01-09*  
*Issue Fixed: Route conflict between /layout and /layouts/[layoutId]*
