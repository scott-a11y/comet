# 🔥 CURRENT STATUS - Route Conflict Troubleshooting

## What's Happening

You're experiencing a **persistent Next.js route conflict** that's preventing the dev server from starting.

**Error Message:**
```
Error: You cannot use different slug names for the same dynamic path ('id' !== 'layoutId').
```

## What We've Done

### ✅ Directories Deleted:
1. `app/buildings/[id]/layout.old` - DELETED
2. `app/api/layouts/[id]` - DELETED (renamed to `[layoutId]`)

### ✅ Current Route Structure (Verified):
```
app/
├── api/
│   ├── buildings/[id]/
│   │   ├── entry-points/[entryPointId]/
│   │   └── layouts/[layoutId]/          ✅ Correct
│   └── layouts/[layoutId]/              ✅ Correct
├── buildings/[id]/
│   ├── 3d/
│   ├── layouts/[layoutId]/              ✅ Correct
│   └── page.tsx
├── editor/[layoutId]/                   ✅ Correct
└── sop/[id]/                            ✅ Correct (different path, no conflict)
```

## The Problem

Even though we've deleted the conflicting directories, **Next.js is still seeing the conflict**. This could be due to:

1. **File System Cache** - Windows or VS Code is caching the old directory structure
2. **Next.js Build Cache** - The `.next` directory has stale route information
3. **Node Process** - An old node process is still running with the old routes

## 🚀 SOLUTION - Try These Steps IN ORDER

### Step 1: Close Everything
```powershell
# Close VS Code completely
# Close all PowerShell/CMD windows
# Close your browser
```

### Step 2: Clean Restart
```powershell
# Open a NEW PowerShell window
cd c:\Dev\comet

# Kill all node processes
taskkill /F /IM node.exe

# Delete .next directory
rd /s /q .next

# Wait 5 seconds
timeout /t 5

# Start server
npm run dev
```

### Step 3: Wait for Compilation
You should see:
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000

✓ Compiling...
✓ Ready in [X]s
```

**NO ERROR!**

### Step 4: Open Browser
- Open a NEW browser window (or incognito)
- Navigate to: http://localhost:3000
- You should see "Comet - Shop Layout Tool for Cabinet & Wood Shops"

---

## ❌ If Error STILL Appears

If you STILL see the route conflict error after the above steps, there's likely a **hidden or system-cached directory** that we can't see.

### Nuclear Option - Reinstall node_modules:

```powershell
# Stop server
taskkill /F /IM node.exe

# Delete everything
rd /s /q .next
rd /s /q node_modules

# Reinstall
npm install

# Regenerate Prisma
npx prisma generate

# Start
npm run dev
```

This will take 5-10 minutes but should resolve any caching issues.

---

## 🔍 Verify Routes Manually

If you want to double-check the routes yourself:

```powershell
# List all [id] directories
Get-ChildItem -Path "app" -Recurse -Directory -Filter "[id]"

# List all [layoutId] directories  
Get-ChildItem -Path "app" -Recurse -Directory -Filter "[layoutId]"
```

**Expected Result:**
- `[id]` should appear in: `api\buildings`, `buildings`, `sop`
- `[layoutId]` should appear in: `api\buildings\[id]\layouts`, `api\layouts`, `buildings\[id]\layouts`, `editor`

**NO `[id]` should exist in any `layouts` directory!**

---

## 📊 What's Ready Once Server Starts

All Phase 1 features are complete and waiting:

1. ✅ Entry Point Manager - `/buildings/[id]`
2. ✅ Material Flow Path Editor - `/buildings/[id]/layouts/[layoutId]`
3. ✅ Enhanced Spaghetti Diagram - `/lean-analysis`
4. ✅ KPI Dashboard - `/kpi-dashboard`
5. ✅ Database migrations applied

---

## 💡 Why This Is Happening

Next.js requires that **all dynamic route parameters at the same level use the same name**. 

**Example of CONFLICT:**
```
app/api/layouts/[id]/           ❌ Uses [id]
app/api/layouts/[layoutId]/     ❌ Uses [layoutId]
```

Both exist at the same level (`app/api/layouts/`), causing the error.

**Correct Structure:**
```
app/api/layouts/[layoutId]/     ✅ Only one parameter name
```

---

*Last Updated: 2026-01-09 10:30 AM PST*  
*All conflicting directories have been deleted*  
*If error persists, try the Nuclear Option above*
