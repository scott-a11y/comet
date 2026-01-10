# 🚀 Quick Start Guide - Phase 1 Features

## Access Your New Features (Port 3003)

### 1. Entry Point Manager 🚪
**URL:** http://localhost:3003/buildings/4

**What it does:**
- Add doors, loading docks, overhead doors, emergency exits
- Set precise X/Y positions
- Configure width and direction
- Mark primary entry points

**How to use:**
1. Scroll down to "Entry Points & Doors" section
2. Click "+ Add Entry Point"
3. Fill in name, type, position, width
4. Click "Add Entry Point" to save

---

### 2. Material Flow Path Editor 🍝
**URL:** http://localhost:3003/buildings/4/layouts/3

**What it does:**
- Draw material flow paths on interactive canvas
- Visualize receiving, processing, shipping, waste flows
- Associate paths with entry points

**How to use:**
1. Scroll down to "Material Flow Path Editor"
2. Enter path name (e.g., "Raw Material to Cutting")
3. Select path type (Receiving, Processing, Shipping, Waste)
4. Click "Start Drawing Path"
5. Click on canvas to add points (minimum 2)
6. Click "Finish Path" to save

---

### 3. Enhanced Spaghetti Diagram 📊
**URL:** http://localhost:3003/lean-analysis

**What it shows:**
- Total distance traveled (feet per shift)
- Travel time as % of cycle time
- Number of touches/handoffs
- 22% cycle time reduction potential
- Non-value-added time analysis

**How to use:**
1. Click "🔍 Analyze Sample Workflow"
2. Review quantified metrics in colored cards
3. Check non-value-added time percentage
4. View spaghetti diagram visualization
5. Read optimization suggestions

---

### 4. KPI Dashboard 📈
**URL:** http://localhost:3003/kpi-dashboard

**What it tracks:**
- Overall Equipment Effectiveness (OEE)
- Cycle Time vs Takt Time
- Throughput Rate (units/hour)
- Quality Metrics (First-Pass Yield, Defect Rate, Rework Rate)

**How to use:**
1. Click "▶ Start Live Updates" for real-time simulation
2. Watch OEE components (Availability, Performance, Quality)
3. Monitor cycle time vs takt time status
4. Track throughput against target
5. Review quality metrics

---

## Quick Commands

### Restart Dev Server
```powershell
# Kill all node processes
Stop-Process -Name node -Force

# Wait a moment
Start-Sleep -Seconds 2

# Start dev server
cd c:\Dev\comet
npm run dev
```

### Check Database
```powershell
# View Prisma Studio
npx prisma studio

# Check schema
npx prisma format

# Regenerate client
npx prisma generate
```

---

## Troubleshooting

### "I don't see the features"
- ✅ Make sure you're on **port 3003**, not 3000
- ✅ Refresh the page (Ctrl+R or F5)
- ✅ Check browser console for errors (F12)

### "Database connection errors"
```powershell
# Stop all node processes
Stop-Process -Name node -Force

# Wait 5 seconds
Start-Sleep -Seconds 5

# Restart
npm run dev
```

### "Features not showing up"
- ✅ Port 3000 = Different app ("Voice Control Center")
- ✅ Port 3003 = Shop Layout SaaS (CORRECT)
- ✅ Port 3002 = Older instance

---

## Feature Highlights

### Entry Points
- 4 types: 🚪 Door, 🚛 Loading Dock, ⬆️ Overhead Door, 🚨 Emergency Exit
- Precise positioning with X/Y coordinates
- Primary entry designation
- Full CRUD operations

### Material Flow Paths
- 4 path types: 📦 Receiving, ⚙️ Processing, 🚚 Shipping, 🗑️ Waste
- Interactive canvas drawing
- Color-coded paths
- Directional arrows

### Spaghetti Diagram
- **Total Distance:** Actual feet traveled
- **Travel Time %:** Time spent moving vs working
- **Touches:** Number of material movements
- **22% Reduction:** Industry benchmark potential

### KPI Dashboard
- **OEE:** World-class ≥85%, Industry avg 60%
- **Cycle Time:** Must be ≤ Takt Time
- **Throughput:** Current vs target units/hour
- **Quality:** First-pass yield, defects, rework

---

## Next Steps

1. **Test Entry Point Manager** - Add your actual doors and loading docks
2. **Draw Material Flow Paths** - Map your receiving to shipping workflow
3. **Run Lean Analysis** - Identify 22% cycle time reduction opportunities
4. **Monitor KPIs** - Track OEE, cycle time, throughput daily

---

*Quick Reference - Phase 1 Features*  
*Generated: 2026-01-09 07:01 AM PST*
