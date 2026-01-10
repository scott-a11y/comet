# ⚠️ IMPORTANT: Multiple Applications Running

## Current Situation

You have **TWO different Next.js applications** running simultaneously:

### Port 3000 - "Comet Voice Control Center" ❌
- **NOT the Shop Layout SaaS**
- Different application entirely
- Shows "District Design Build", "Neural Agents", etc.

### Port 3003 - "Comet - Shop Layout SaaS" ✅
- **THIS IS THE CORRECT APPLICATION**
- Has all the new Phase 1 features
- Building 4 ("Final Test Building") is here

### Port 3002 - "Comet - Shop Layout SaaS" (Older Instance)
- Another instance of the Shop Layout SaaS
- May not have latest code changes

---

## How to Access Your New Features

### Option 1: Use Port 3003 (Recommended)
Your browser already has tabs open on port 3003. Simply navigate to:

**http://localhost:3003/buildings/4**

Then scroll down to see the **"Entry Points & Doors"** section.

### Option 2: Stop Port 3000 and Restart on Correct Project
If you want to use port 3000, you need to:

1. Stop the "Voice Control Center" app on port 3000
2. Navigate to the correct project directory
3. Start `npm run dev`

---

## What's Been Implemented (Phase 1 - 60% Complete)

### ✅ 1. Database Migration Applied
- EntryPoint model
- MaterialFlowPath model
- All schema changes pushed successfully

### ✅ 2. Entry Point Management UI
**Location:** `/buildings/[id]` (Building Details Page)

**Features:**
- Add/Edit/Delete entry points
- 4 types: Doors, Loading Docks, Overhead Doors, Emergency Exits
- Precise X/Y positioning
- Width configuration
- Direction assignment
- Primary entry designation

**How to Test:**
1. Go to http://localhost:3003/buildings/4
2. Scroll down to "Entry Points & Doors" section
3. Click "+ Add Entry Point"
4. Fill in the form and save

### ✅ 3. Material Flow Path Drawing Tool
**Location:** `/buildings/[id]/layouts/[layoutId]` (Layout Page)

**Features:**
- Interactive canvas drawing
- 4 path types: Receiving, Processing, Shipping, Waste
- Click-to-add points
- Visual flow arrows
- Entry point association

**How to Test:**
1. Go to http://localhost:3003/buildings/4/layouts/3
2. Scroll down to "Material Flow Path Editor"
3. Enter a path name
4. Click "Start Drawing Path"
5. Click on canvas to add points
6. Click "Finish Path" when done

---

## Next Steps to Complete Phase 1

### 4. Enhanced Spaghetti Diagram (30 min)
- Quantified distance metrics
- Travel time percentages
- Cycle time reduction indicators

### 5. KPI Dashboard (45 min)
- OEE tracking
- Cycle time vs Takt time
- Real-time performance metrics

---

## Quick Test Commands

```powershell
# Check what's running on each port
Get-NetTCPConnection -LocalPort 3000,3002,3003 -State Listen | Select-Object LocalPort,OwningProcess

# Kill all node processes and restart clean
Stop-Process -Name node -Force
cd c:\Dev\comet
npm run dev
```

---

## Files Created/Modified

### New Components
- `components/building/EntryPointManager.tsx`
- `components/layout/MaterialFlowPathEditor.tsx`

### New API Endpoints
- `app/api/buildings/[id]/entry-points/route.ts`
- `app/api/buildings/[id]/entry-points/[entryPointId]/route.ts`
- `app/api/layouts/[layoutId]/material-flow-paths/route.ts`
- `app/api/layouts/[layoutId]/material-flow-paths/[pathId]/route.ts`

### Modified Pages
- `app/buildings/[id]/page.tsx` - Added EntryPointManager
- `app/buildings/[id]/layouts/[layoutId]/page.tsx` - Added MaterialFlowPathEditor

---

## Troubleshooting

### "I don't see the Entry Points section"
- Make sure you're on **port 3003**, not 3000
- Refresh the page (Ctrl+R or F5)
- Check browser console for errors

### "Database connection errors"
- Too many node processes holding connections
- Run: `Stop-Process -Name node -Force`
- Wait 5 seconds, then restart: `npm run dev`

### "Features not showing up"
- The code IS in the files (verified)
- Port 3000 is running a DIFFERENT app
- Use port 3003 where Shop Layout SaaS is running

---

*Generated: 2026-01-09 06:59 AM PST*  
*Status: Phase 1 - 60% Complete (3 of 5 features)*  
*Next: Enhanced Spaghetti Diagram + KPI Dashboard*
