# 🚀 Quick Start: Parallel 3D Collision Detection Development

**Ready to implement 3D collision detection across 3 parallel worktrees!**

---

## 📋 **Pre-Flight Checklist**

Before starting, verify:
- ✅ All 3 worktrees exist and are on correct branches
- ✅ Each worktree has clean working directory
- ✅ Node modules installed in each worktree
- ✅ Implementation briefs created in each `.agent/` folder

---

## 🎯 **Quick Verification**

Run this in the main directory:

```powershell
# Verify worktrees
git worktree list

# Should show:
# C:/Dev/comet                        [main]
# C:/Dev/comet/worktrees/comet-api    [feature/3d-collision-api]
# C:/Dev/comet/worktrees/comet-tests  [feature/3d-collision-tests]
# C:/Dev/comet/worktrees/comet-ui     [feature/3d-collision-ui]
```

---

## 🚀 **Launch Parallel Development**

### **Option 1: Manual (3 Terminals)**

Open 3 PowerShell windows:

**Terminal 1 - UI Slice:**
```powershell
cd C:\Dev\comet\worktrees\comet-ui
code .
# Then paste UI brief into Antigravity/Claude Code
```

**Terminal 2 - API Slice:**
```powershell
cd C:\Dev\comet\worktrees\comet-api
code .
# Then paste API brief into Antigravity/Claude Code
```

**Terminal 3 - Tests Slice:**
```powershell
cd C:\Dev\comet\worktrees\comet-tests
code .
# Then paste Tests brief into Antigravity/Claude Code
```

---

### **Option 2: Automated Launch Script**

Save this as `launch-parallel-dev.ps1` in `C:\Dev\comet`:

```powershell
# Launch parallel development sessions
Write-Host "🚀 Launching 3D Collision Detection Parallel Development..." -ForegroundColor Cyan

# Launch UI worktree
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Dev\comet\worktrees\comet-ui; code .; Write-Host '📱 UI Slice Ready - Paste brief from docs/3D_COLLISION_DETECTION_PLAN.md' -ForegroundColor Green"

# Wait a moment
Start-Sleep -Seconds 2

# Launch API worktree
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Dev\comet\worktrees\comet-api; code .; Write-Host '🔌 API Slice Ready - Paste brief from docs/3D_COLLISION_DETECTION_PLAN.md' -ForegroundColor Yellow"

# Wait a moment
Start-Sleep -Seconds 2

# Launch Tests worktree
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Dev\comet\worktrees\comet-tests; code .; Write-Host '🧪 Tests Slice Ready - Paste brief from docs/3D_COLLISION_DETECTION_PLAN.md' -ForegroundColor Magenta"

Write-Host "`n✅ All 3 worktrees launched!" -ForegroundColor Green
Write-Host "📖 Implementation briefs are in each worktree's .agent/IMPLEMENTATION_BRIEF.md" -ForegroundColor Cyan
```

Then run:
```powershell
.\launch-parallel-dev.ps1
```

---

## 📝 **Implementation Briefs to Paste**

### **UI Slice Brief (comet-ui)**

```
Use Plan Mode first. Follow CLAUDE.md strictly. Implement only this slice.

## 3D Equipment Collision Detection - UI Slice

### Objective
Implement real-time collision detection with visual feedback in Three.js scene.

### Key Files
- CREATE: lib/3d/collision-detection.ts
- CREATE: hooks/use-collision-detection.ts
- MODIFY: components/3d/EquipmentModel.tsx
- MODIFY: components/3d/Scene.tsx

### Acceptance Criteria
✅ Equipment highlights red (#ef4444) when colliding
✅ Collision warning shows count
✅ Performance: <16ms per frame (60 FPS)
✅ Works with 100+ equipment items

### Implementation Guide
See: .agent/IMPLEMENTATION_BRIEF.md for full details
```

---

### **API Slice Brief (comet-api)**

```
Use Plan Mode first. Follow CLAUDE.md strictly. Implement only this slice.

## 3D Equipment Collision Detection - API Slice

### Objective
Add server-side validation and persistence for collision metadata.

### Key Files
- CREATE: prisma/migrations/[timestamp]_add_collision_metadata/migration.sql
- CREATE: lib/validations/collision.ts
- CREATE: actions/validate-layout-collisions.ts
- CREATE: app/api/layouts/[id]/collisions/route.ts

### Acceptance Criteria
✅ Prevents saving layouts with collisions
✅ Returns detailed error messages
✅ Stores collision metadata in database
✅ API endpoint returns collision reports

### Implementation Guide
See: .agent/IMPLEMENTATION_BRIEF.md for full details
```

---

### **Tests Slice Brief (comet-tests)**

```
Use Plan Mode first. Follow CLAUDE.md strictly. Implement only this slice.

## 3D Equipment Collision Detection - Tests Slice

### Objective
Comprehensive test suite for collision detection logic.

### Key Files
- CREATE: test/collision-detection.test.ts
- CREATE: test/collision-validator.test.ts
- CREATE: test/collision-api.test.ts

### Acceptance Criteria
✅ >90% code coverage
✅ All edge cases tested
✅ Performance benchmarks
✅ Integration tests pass

### Implementation Guide
See: .agent/IMPLEMENTATION_BRIEF.md for full details
```

---

## ✅ **Verification Commands**

Run these in each worktree after implementation:

```powershell
# In each worktree
npm run typecheck  # TypeScript validation
npm run lint       # ESLint checks
npm test           # Run tests
npm run build      # Verify builds
```

---

## 🔄 **Integration Workflow**

### **Step 1: Develop in Parallel**
- Each worktree works independently
- Commit frequently to feature branches
- Push to GitHub for backup

### **Step 2: Verify Each Slice**
```powershell
# In each worktree
git add -A
git commit -m "feat(slice): implement collision detection"
git push origin feature/3d-collision-[ui|api|tests]
```

### **Step 3: Create PRs**
- Create 3 separate PRs (one per slice)
- Link PRs together in descriptions
- Review and merge in order: Tests → API → UI

### **Step 4: Final Integration**
```powershell
# In main worktree
git checkout main
git pull origin main
npm install
npm run build
npm test
```

---

## 📊 **Progress Tracking**

| Slice | Worktree | Status | Estimated | Actual |
|-------|----------|--------|-----------|--------|
| UI | comet-ui | ⏳ Not Started | 4-6h | - |
| API | comet-api | ⏳ Not Started | 3-4h | - |
| Tests | comet-tests | ⏳ Not Started | 2-3h | - |

Update this table as you progress!

---

## 🎯 **Success Criteria**

- ✅ All TypeScript errors resolved
- ✅ All tests passing
- ✅ All builds successful
- ✅ Performance benchmarks met
- ✅ Code review approved
- ✅ Documentation updated

---

## 🆘 **Troubleshooting**

### **Issue: Worktree build fails**
```powershell
# Clean and reinstall
rm -r node_modules
npm install
npm run build
```

### **Issue: Git conflicts**
```powershell
# Sync with main
git fetch origin
git rebase origin/main
```

### **Issue: Tests fail**
```powershell
# Run specific test file
npm test -- test/collision-detection.test.ts
```

---

## 📚 **Reference Documents**

- **Master Plan:** `docs/3D_COLLISION_DETECTION_PLAN.md`
- **UI Brief:** `worktrees/comet-ui/.agent/IMPLEMENTATION_BRIEF.md`
- **API Brief:** `worktrees/comet-api/.agent/IMPLEMENTATION_BRIEF.md`
- **Tests Brief:** `worktrees/comet-tests/.agent/IMPLEMENTATION_BRIEF.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Contributing:** `docs/CONTRIBUTING.md`
- **Repository Guide:** `CLAUDE.md`

---

**Ready to start parallel development!** 🚀

Choose your approach:
1. **Manual:** Open 3 terminals and paste briefs
2. **Automated:** Run `launch-parallel-dev.ps1`
3. **Sequential:** Work through one slice at a time

**Estimated completion:** 2-3 days with parallel work, 1 week sequential.
