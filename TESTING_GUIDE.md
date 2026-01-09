# 🧪 Comet - Complete Testing Guide

## Quick Start Testing Checklist

### ✅ Feature 1: AI Vision Analysis (with PDF Support!)

**Test Page:** `http://localhost:3000/ai-vision-test`

#### Test 1A: Image Upload
1. **Navigate to:** http://localhost:3000/ai-vision-test
2. **Click:** "Choose File" button
3. **Select:** The test floorplan image at:
   ```
   C:\Users\ScottLittle\.gemini\antigravity\brain\cb804cde-ba01-45fc-acb2-4405da04cb58\test_shop_floorplan_1767848796951.png
   ```
4. **Click:** "Analyze Floor Plan" button
5. **Wait:** 10-30 seconds for AI analysis

**Expected Results:**
- ✅ Image preview appears
- ✅ "Analyzing with GPT-4o Vision..." loading state
- ✅ Analysis results display showing:
  - **Dimensions:** ~30' × 40'
  - **Detected Equipment:** Table Saw, CNC Router, Jointer, Planer, Workbenches
  - **Confidence Scores:** 70-95% for each machine
  - **Positions:** Normalized coordinates (0-1 range)
  - **Summary:** AI-generated description of the shop layout

#### Test 1B: PDF Upload (NEW!)
1. **Find a PDF floor plan** (or create one by printing the test image to PDF)
2. **Upload the PDF** using the same interface
3. **Click:** "Analyze Floor Plan"

**Expected Results:**
- ✅ PDF automatically converts to image
- ✅ Console shows: "[Floor Plan Analysis] PDF detected, converting to image..."
- ✅ Analysis proceeds normally
- ✅ Same quality results as image upload

---

### ✅ Feature 2: BOM (Bill of Materials) Calculation

**Test via Unit Tests:**

```powershell
# Run BOM tests
npm test lib/systems/bom.test.ts
```

**Expected Results:**
```
✓ lib/systems/bom.test.ts (3 tests) 5ms
  ✓ should calculate linear pipe requirements with waste factor
  ✓ should detect turns and add elbow fittings
  ✓ should sum multiple circuit lengths correctly

Test Files  1 passed (1)
Tests  3 passed (3)
```

**What It Tests:**
- ✅ Linear calculations (pipe/wire length × waste factor)
- ✅ Automatic elbow detection (>15° turns)
- ✅ Multiple circuit aggregation
- ✅ Cost estimation

---

### ✅ Feature 3: 3D Collision Detection

**Test Page:** `http://localhost:3000/buildings/[id]/3d`

#### Setup Required:
1. **Create a building** (if you don't have one):
   - Go to: http://localhost:3000/buildings/new
   - Enter: Name, dimensions (e.g., 30' × 40')
   - Click: "Create Building"

2. **Add equipment to the building:**
   - Navigate to the building's page
   - Add 2-3 pieces of equipment
   - Position them close together (to trigger collision)

3. **View 3D scene:**
   - Click "View in 3D" or navigate to `/buildings/[id]/3d`

**Expected Results:**
- ✅ 3D scene renders with equipment
- ✅ Colliding equipment turns RED
- ✅ Wireframe outline appears on collisions
- ✅ Warning banner shows: "⚠️ 2 collisions detected"
- ✅ Collision data persists to database

---

## Detailed Testing Scenarios

### Scenario 1: Complete AI Vision Workflow

**Goal:** Test the full "photo to layout" workflow

**Steps:**
1. **Upload test floorplan** to AI Vision page
2. **Verify analysis results:**
   - Check dimensions are reasonable (30-40 feet)
   - Verify equipment detected (should see 4-5 machines)
   - Confirm confidence scores (should be >70%)
3. **Check console logs** (F12 → Console):
   ```
   [Floor Plan Analysis] Starting analysis for: [URL]
   [Floor Plan Analysis] Creating OpenAI client...
   [Floor Plan Analysis] Calling OpenAI Vision API...
   [Floor Plan Analysis] OpenAI response received
   ```
4. **Inspect JSON output:**
   - Click "View Raw JSON" at bottom
   - Verify structure matches schema

**Success Criteria:**
- ✅ No errors in console
- ✅ Analysis completes in <30 seconds
- ✅ Results are accurate and detailed
- ✅ JSON structure is valid

---

### Scenario 2: PDF Conversion Test

**Goal:** Verify PDF-to-image conversion works

**Steps:**
1. **Create a test PDF:**
   - Open the test floorplan image
   - Print to PDF (or use any architectural PDF)
2. **Upload PDF** to AI Vision page
3. **Monitor console** for conversion logs:
   ```
   [Floor Plan Analysis] PDF detected, converting to image...
   [Floor Plan Analysis] PDF converted to image successfully
   ```
4. **Verify analysis** proceeds normally

**Success Criteria:**
- ✅ PDF uploads without error
- ✅ Conversion completes successfully
- ✅ Analysis results match image upload quality
- ✅ No "PDF not supported" errors

---

### Scenario 3: BOM Calculation Integration

**Goal:** Test BOM engine with realistic routing data

**Steps:**
1. **Run unit tests:**
   ```powershell
   npm test lib/systems/bom.test.ts
   ```
2. **Review test output:**
   - Linear calculations test
   - Elbow detection test
   - Multi-circuit aggregation test
3. **Verify calculations:**
   - Check waste factor applied (10-15%)
   - Confirm elbow count matches turns
   - Validate cost estimates

**Success Criteria:**
- ✅ All 6 tests pass (3 in main, 3 in worktree)
- ✅ Calculations are mathematically correct
- ✅ BOM output is properly formatted

---

### Scenario 4: Error Handling

**Goal:** Verify graceful error handling

**Test 4A: Invalid Image URL**
1. Navigate to AI Vision page
2. Manually trigger analysis with bad URL (via browser console):
   ```javascript
   fetch('/api/analyze-floorplan', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({imageUrl: 'https://invalid.url/image.png'})
   })
   ```

**Expected:**
- ✅ Error message displayed
- ✅ No app crash
- ✅ User can retry

**Test 4B: Unsupported File Type**
1. Try uploading a .txt or .doc file
2. Verify rejection message

**Expected:**
- ✅ File picker only shows images/PDFs
- ✅ Clear error if wrong type somehow uploaded

---

## Performance Testing

### Test 1: AI Vision Response Time

**Metrics to Track:**
- Image upload time: <2 seconds
- OpenAI API call: 10-30 seconds
- Total time to results: <35 seconds

**How to Test:**
1. Open browser DevTools → Network tab
2. Upload test image
3. Monitor request timing
4. Record total duration

**Acceptance Criteria:**
- ✅ Upload completes in <2 sec
- ✅ Analysis completes in <30 sec
- ✅ No timeout errors

---

### Test 2: BOM Calculation Speed

**Metrics to Track:**
- Calculation time for 10 segments: <100ms
- Calculation time for 100 segments: <1 second

**How to Test:**
```javascript
// In browser console or test file
const segments = Array(100).fill({
  id: '1',
  type: 'ducting',
  diameter: 4,
  start: [0, 0, 0],
  end: [10, 0, 0]
});

console.time('BOM Calculation');
const result = calculateBOM(segments);
console.timeEnd('BOM Calculation');
```

**Acceptance Criteria:**
- ✅ <1 second for 100 segments
- ✅ No memory leaks
- ✅ Accurate results at scale

---

## Integration Testing

### Test: End-to-End Workflow

**Scenario:** New user designs their shop from a photo

**Steps:**
1. **User uploads floor plan photo**
   - Navigate to AI Vision page
   - Upload test image
   - Receive analysis results

2. **User creates building from analysis**
   - Copy dimensions from AI results
   - Create new building with those dimensions
   - (Future: Auto-create from analysis)

3. **User adds detected equipment**
   - Manually add equipment matching AI detections
   - Position at coordinates from AI
   - (Future: Auto-populate from analysis)

4. **User designs systems**
   - Add dust collection routing
   - Add electrical circuits
   - Generate BOM

5. **User checks for collisions**
   - View in 3D
   - Verify no red equipment
   - Adjust if needed

**Success Criteria:**
- ✅ Complete workflow in <15 minutes
- ✅ No errors or crashes
- ✅ Results are accurate and useful

---

## Browser Compatibility Testing

### Browsers to Test:
- ✅ Chrome (primary)
- ✅ Edge
- ✅ Firefox
- ✅ Safari (if available)

### Features to Verify:
- File upload works
- Image preview displays
- 3D rendering (Three.js)
- API calls succeed
- UI is responsive

---

## Known Issues & Workarounds

### Issue 1: OpenAI API Key Required
**Symptom:** "OpenAI API key not configured" error
**Solution:** Ensure `OPENAI_API_KEY` is set in `.env.local`

### Issue 2: Vercel Blob Upload Fails
**Symptom:** Upload button doesn't work
**Solution:** Check `BLOB_READ_WRITE_TOKEN` in `.env.local`

### Issue 3: PDF Conversion Slow
**Symptom:** PDF analysis takes >60 seconds
**Solution:** This is normal for large PDFs; consider adding progress indicator

---

## Testing Checklist Summary

### Pre-Launch Checklist:
- [ ] AI Vision works with images
- [ ] AI Vision works with PDFs
- [ ] BOM calculations are accurate
- [ ] 3D collision detection works
- [ ] All unit tests pass
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Error handling is graceful
- [ ] UI is polished and responsive

### Post-Testing Actions:
- [ ] Document any bugs found
- [ ] Create GitHub issues for improvements
- [ ] Update user documentation
- [ ] Record demo video
- [ ] Prepare for launch

---

## Quick Test Commands

```powershell
# Start dev server (if not running)
npm run dev

# Run all tests
npm test

# Run specific test file
npm test lib/systems/bom.test.ts

# Type check
npm run typecheck

# Build for production
npm run build

# Check for errors
npm run lint
```

---

## Test Data Locations

**Test Floorplan Image:**
```
C:\Users\ScottLittle\.gemini\antigravity\brain\cb804cde-ba01-45fc-acb2-4405da04cb58\test_shop_floorplan_1767848796951.png
```

**Test URLs:**
- AI Vision: http://localhost:3000/ai-vision-test
- Buildings: http://localhost:3000/buildings
- New Building: http://localhost:3000/buildings/new
- 3D View: http://localhost:3000/buildings/[id]/3d

---

## Success Metrics

### For AI Vision:
- ✅ Detects 4-5 equipment pieces from test image
- ✅ Dimensions within 10% of actual (30' × 40')
- ✅ Confidence scores >70%
- ✅ PDF conversion works flawlessly

### For BOM:
- ✅ All 6 unit tests pass
- ✅ Calculations match manual verification
- ✅ Cost estimates are reasonable

### For Collision Detection:
- ✅ Overlapping equipment turns red
- ✅ Warning banner appears
- ✅ Data persists to database

---

## Next Steps After Testing

1. **If all tests pass:**
   - ✅ Mark features as production-ready
   - ✅ Update MORNING_REPORT.md with test results
   - ✅ Prepare demo for stakeholders
   - ✅ Plan launch campaign

2. **If issues found:**
   - 📝 Document bugs in GitHub issues
   - 🔧 Prioritize fixes
   - 🧪 Re-test after fixes
   - ✅ Repeat until all tests pass

---

**Happy Testing! 🧪✨**

*Testing Guide Version 1.0*  
*Created: January 8, 2026*  
*Last Updated: January 8, 2026*
