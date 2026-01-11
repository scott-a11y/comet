# 🔧 FINAL FIX - Route Conflict Resolution

## What We Fixed

### Route Conflicts Resolved:
1. ✅ Renamed `app/buildings/[id]/layout` → `archive/buildings-id-layout.old`
2. ✅ Renamed `app/api/layouts/[id]` → `app/api/layouts/[layoutId]`
3. ✅ Updated `next.config.js` to exclude `worktrees` and `archive` directories

### Files Modified:
- `next.config.js` - Added webpack config to exclude problematic directories
- Moved old `layout` directory to archive

---

## 🚀 MANUAL START INSTRUCTIONS

### Step 1: Kill All Node Processes
```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
```

### Step 2: Clean Build Cache
```powershell
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
```

### Step 3: Start Server
```powershell
npm run dev
```

### Step 4: Wait for "✓ Ready"
You should see:
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000

✓ Ready in [X]s
```

### Step 5: Open Browser
Navigate to: **http://localhost:3000**

---

## ✅ Expected Result

You should see:
- **Title:** "Comet"
- **Subtitle:** "Shop Layout Tool for Cabinet & Wood Shops"
- **5 Feature Cards:**
  1. 🏭 Buildings & Zones
  2. ⚡ Equipment & Power
  3. 📐 Layout Design
  4. 🍝 Lean Analysis (NEW)
  5. 📊 KPI Dashboard (NEW)

---

## ❌ If You Still See Errors

### Error: "You cannot use different slug names..."

This means there's still a route conflict. Run this to find it:

```powershell
Get-ChildItem -Path "app" -Recurse -Directory | 
  Where-Object { $_.Name -match '^\[.*\]$' } | 
  Select-Object FullName
```

Look for any directories named `[id]` that are at the same level as `[layoutId]`.

### Error: "ERR_CONNECTION_REFUSED"

Server didn't start. Check for compilation errors:

```powershell
npx tsc --noEmit
```

---

## 🎯 Alternative: Use the Batch File

Double-click: **`start-clean.bat`**

This will:
1. Stop all node processes
2. Clean .next directory
3. Start the dev server
4. Show you the output

---

## 📞 Emergency: Complete Reset

If nothing works:

```powershell
# 1. Kill everything
Stop-Process -Name node -Force

# 2. Delete everything
Remove-Item -Path ".next" -Recurse -Force
Remove-Item -Path "node_modules" -Recurse -Force

# 3. Reinstall
npm install

# 4. Regenerate Prisma
npx prisma generate

# 5. Start
npm run dev
```

---

## 🔍 Verify Server is Running

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

If this returns a result, the server IS running.

---

## 📝 What Changed in This Session

### Phase 1 Features Completed:
1. ✅ Entry Point Manager
2. ✅ Material Flow Path Editor
3. ✅ Enhanced Spaghetti Diagram
4. ✅ KPI Dashboard
5. ✅ Database migrations applied

### Issues Fixed:
1. ✅ Route conflict: `/layout` vs `/layouts/[layoutId]`
2. ✅ Route conflict: `api/layouts/[id]` vs `[layoutId]`
3. ✅ Next.js config updated to exclude archive directories

### Documentation Created:
1. `PHASE_1_COMPLETE.md` - Full feature summary
2. `PREVENTION_GUIDE.md` - How to avoid this in future
3. `ROUTES.md` - Complete route map
4. `QUICK_START.md` - Quick reference
5. `PORT_GUIDE.md` - Port troubleshooting
6. `start-clean.bat` - Easy startup script
7. This file - Final fix instructions

---

*Last Updated: 2026-01-09 08:15 AM PST*  
*All route conflicts resolved*  
*Server should now start successfully*
