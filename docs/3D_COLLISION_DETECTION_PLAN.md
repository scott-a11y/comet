# 🎯 3D Equipment Collision Detection - Master Implementation Plan

**Feature:** Real-time collision detection for 3D equipment placement  
**Status:** Ready for parallel implementation  
**Estimated Total Effort:** 9-13 hours  
**Target Completion:** 2-3 days with parallel work

---

## 📊 **Overview**

This feature adds real-time collision detection to the 3D shop layout tool, preventing equipment overlap and providing visual feedback when equipment collides.

### **Key Benefits:**
- ✅ Prevents invalid layouts with overlapping equipment
- ✅ Real-time visual feedback (red highlighting)
- ✅ Server-side validation before saving
- ✅ Comprehensive test coverage
- ✅ Performance optimized for 100+ equipment items

---

## 🔀 **Parallel Implementation Strategy**

The feature is split into 3 independent slices that can be developed simultaneously in separate worktrees:

| Slice | Worktree | Branch | Effort | Focus |
|-------|----------|--------|--------|-------|
| **UI** | `comet-ui` | `feature/3d-collision-ui` | 4-6h | Three.js visual feedback |
| **API** | `comet-api` | `feature/3d-collision-api` | 3-4h | Server validation & persistence |
| **Tests** | `comet-tests` | `feature/3d-collision-tests` | 2-3h | Comprehensive test suite |

---

## 📋 **Implementation Briefs**

Each worktree has a detailed implementation brief at:
- `worktrees/comet-ui/.agent/IMPLEMENTATION_BRIEF.md`
- `worktrees/comet-api/.agent/IMPLEMENTATION_BRIEF.md`
- `worktrees/comet-tests/.agent/IMPLEMENTATION_BRIEF.md`

---

## 🎯 **Slice 1: UI (Three.js Collision Detection)**

### **Objective:**
Real-time collision detection with visual feedback in the 3D scene.

### **Key Deliverables:**
1. `lib/3d/collision-detection.ts` - CollisionDetector class
2. `hooks/use-collision-detection.ts` - React hook
3. Updated `components/3d/EquipmentModel.tsx` - Red highlighting
4. Updated `components/3d/Scene.tsx` - Collision integration

### **Acceptance Criteria:**
- ✅ Equipment highlights red when colliding
- ✅ Collision warning shows count
- ✅ Performance: <16ms per frame (60 FPS)
- ✅ Works with 100+ equipment items

### **Dependencies:**
- None (uses existing Three.js)

---

## 🎯 **Slice 2: API (Server Validation)**

### **Objective:**
Server-side validation and persistence for collision data.

### **Key Deliverables:**
1. Database migration - Add collision fields
2. `lib/validations/collision.ts` - CollisionValidator class
3. `actions/validate-layout-collisions.ts` - Server action
4. `app/api/layouts/[id]/collisions/route.ts` - REST endpoint

### **Acceptance Criteria:**
- ✅ Prevents saving layouts with collisions
- ✅ Returns detailed error messages
- ✅ Stores collision metadata in database
- ✅ API endpoint returns collision reports

### **Dependencies:**
- None (uses existing Prisma)

---

## 🎯 **Slice 3: Tests (Validation Suite)**

### **Objective:**
Comprehensive test coverage for collision detection.

### **Key Deliverables:**
1. `test/collision-detection.test.ts` - Unit tests
2. `test/collision-validator.test.ts` - Validation tests
3. `test/collision-api.test.ts` - Integration tests

### **Acceptance Criteria:**
- ✅ >90% code coverage
- ✅ All edge cases tested
- ✅ Performance benchmarks
- ✅ Integration tests pass

### **Dependencies:**
- Requires UI slice for CollisionDetector
- Requires API slice for CollisionValidator

---

## 🔄 **Integration Points**

### **UI → API:**
- UI calls `validateLayoutCollisions` server action before save
- API returns validation errors to UI
- UI displays error messages to user

### **UI → Tests:**
- Tests verify CollisionDetector logic
- Tests benchmark performance
- Tests cover edge cases

### **API → Tests:**
- Tests verify CollisionValidator logic
- Tests verify database updates
- Tests verify API endpoints

---

## 📅 **Development Timeline**

### **Day 1: Parallel Development**
- **UI Slice:** Implement CollisionDetector class (2-3h)
- **API Slice:** Create migration and validator (2h)
- **Tests Slice:** Write unit tests (1-2h)

### **Day 2: Integration**
- **UI Slice:** Integrate into Scene component (2h)
- **API Slice:** Create server action and API endpoint (1-2h)
- **Tests Slice:** Write integration tests (1h)

### **Day 3: Testing & Refinement**
- **All Slices:** Run full test suite
- **All Slices:** Fix any issues
- **All Slices:** Performance optimization
- **All Slices:** Code review and merge

---

## 🧪 **Testing Strategy**

### **Unit Tests (Tests Slice)**
- Test collision detection algorithm
- Test edge cases (zero-size, negative, large)
- Test performance with 100+ items

### **Integration Tests (Tests Slice)**
- Test UI → API flow
- Test database updates
- Test API endpoints

### **Manual Testing (All Slices)**
- Test in browser with real equipment
- Test performance with large layouts
- Test error messages and UX

---

## 📊 **Success Metrics**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Performance** | <16ms/frame | Chrome DevTools |
| **Test Coverage** | >90% | `npm run test:coverage` |
| **Equipment Count** | 100+ items | Load test |
| **Collision Accuracy** | 100% | Manual testing |
| **Build Time** | <3 minutes | Vercel logs |

---

## 🚀 **Deployment Checklist**

### **Before Merging:**
- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing complete
- [ ] Code review approved
- [ ] Performance benchmarks met

### **After Merging:**
- [ ] Verify Vercel deployment
- [ ] Run smoke tests on preview
- [ ] Monitor error logs
- [ ] Update documentation

---

## 🔗 **Related Documentation**

- `docs/ARCHITECTURE.md` - System architecture
- `docs/CONTRIBUTING.md` - Development standards
- `docs/API.md` - API documentation
- `CLAUDE.md` - Repository operating instructions

---

## ⚠️ **Known Limitations**

1. **AABB Only:** Uses axis-aligned bounding boxes
   - Rotation ignored for MVP
   - May cause false positives for rotated equipment
   - Can upgrade to OBB (Oriented Bounding Boxes) later

2. **2D Collision:** Only checks X/Z plane
   - Ignores height (Y axis)
   - Acceptable for floor planning
   - Can add height checking if needed

3. **No Collision Resolution:** Only detects, doesn't prevent
   - UI provides visual feedback
   - API prevents saving
   - Doesn't auto-move equipment

---

## 🎓 **Learning Resources**

- [Three.js Box3 Documentation](https://threejs.org/docs/#api/en/math/Box3)
- [AABB Collision Detection](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection)
- [Spatial Hashing](https://conkerjo.wordpress.com/2009/06/13/spatial-hashing-implementation-for-fast-2d-collisions/)

---

## 📝 **Commit Strategy**

Each slice should commit independently:

### **UI Slice:**
```
feat(3d): add real-time collision detection for equipment

- Implement CollisionDetector class with spatial hashing
- Add visual feedback (red highlighting) for colliding equipment
- Create useCollisionDetection React hook
- Add collision warning UI in Scene component

Closes #[issue-number]
```

### **API Slice:**
```
feat(api): add server-side collision validation

- Add collision metadata fields to LayoutInstance
- Implement CollisionValidator for server-side checks
- Create validateLayoutCollisions server action
- Add /api/layouts/[id]/collisions endpoint

Closes #[issue-number]
```

### **Tests Slice:**
```
test(collision): add comprehensive test suite

- Add unit tests for CollisionDetector class
- Add validation tests for server-side logic
- Add integration tests for API endpoints
- Add performance benchmarks (100+ items)

Closes #[issue-number]
```

---

## 🎯 **Next Steps**

1. **Review implementation briefs** in each worktree
2. **Assign slices** to developers (or work sequentially)
3. **Start parallel development** in separate worktrees
4. **Coordinate integration** via PR reviews
5. **Merge to main** after all tests pass

---

**Ready for parallel implementation!** 🚀

Each worktree has a detailed `.agent/IMPLEMENTATION_BRIEF.md` with:
- Specific files to modify
- Code examples
- Acceptance criteria
- Testing checklists
- Technical constraints
