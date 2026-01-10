# 🚨 PRODUCTION BLOCKER - Database Schema Fix

## Status: ❌ BLOCKED

**Issue:** Building creation fails with 500 error
**Root Cause:** Database schema mismatch - `pdf_url` column doesn't exist
**Impact:** Cannot create buildings = core feature broken = production blocked

---

## What's Happening

1. ✅ **React/react-konva issue FIXED** - Downgraded to React 18
2. ✅ **Page loads correctly** - Form displays without errors
3. ❌ **API fails with 500** - Database column `pdf_url` missing

**Error:**
```
The column `pdf_url` does not exist in the current database.
```

---

## Why This Happened

The Prisma schema (`schema.prisma`) has the `pdfUrl` field defined:

```prisma
model ShopBuilding {
  id                  Int              @id @default(autoincrement())
  name                String
  pdfUrl              String?          @map(\"pdf_url\")  // ← Defined in schema
  // ... other fields
}
```

But the actual database doesn't have this column yet. The migration was never run.

---

## How to Fix

### Option 1: Run Prisma Migration (Recommended)

```bash
# Connect to your Supabase database
npx prisma migrate dev --name sync_schema

# Or if that fails, force push the schema
npx prisma db push --accept-data-loss
```

**This will:**
- Add missing `pdf_url` column
- Add any other missing columns
- Sync database with schema

---

### Option 2: Quick Fix - Remove pdfUrl from API

If you can't access the database right now, temporarily remove the problematic fields from the API:

**File:** `app/api/buildings/route.ts`

**Change line 51-62 from:**
```typescript
const building = await prisma.shopBuilding.create({
  data: {
    ...validated,
    widthFt: validated.widthFt ?? null,
    depthFt: validated.depthFt ?? null,
    ceilingHeightFt: validated.ceilingHeightFt ?? null,
    pdfUrl: validated.pdfUrl ?? null,  // ← Remove this
    extractedData: validated.extractedData ?? null,  // ← Remove this
    floorGeometry: (validated as any).floorGeometry ?? null,  // ← Remove this
    floorScaleFtPerUnit: (validated as any).floorScaleFtPerUnit ?? null,  // ← Remove this
  }
})
```

**To:**
```typescript
const building = await prisma.shopBuilding.create({
  data: {
    name: validated.name,
    widthFt: validated.widthFt ?? null,
    depthFt: validated.depthFt ?? null,
    ceilingHeightFt: validated.ceilingHeightFt ?? null,
    // Temporarily skip optional fields that don't exist in DB
  }
})
```

**This will:**
- Allow building creation to work
- Skip the missing columns
- Let you deploy and test other features

---

## Testing After Fix

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Test building creation:**
   - Go to: `http://localhost:3002/buildings/new`
   - Fill in: Name, Width, Length
   - Click "Create Building"
   - Should succeed with 200 response

3. **Verify in database:**
   ```bash
   npx prisma studio
   ```
   - Check `ShopBuilding` table
   - Verify new building exists

---

## Production Deployment Checklist

**Before deploying to Vercel:**

- [ ] Fix database schema (run migration)
- [ ] Test building creation locally
- [ ] Verify all API endpoints work
- [ ] Run `npm run build` successfully
- [ ] Run `npm run typecheck` with 0 errors
- [ ] Test on production database (Supabase)

**After fixing:**

- [ ] Deploy to Vercel
- [ ] Run migration on production database
- [ ] Test building creation on production
- [ ] Monitor error logs

---

## Current Status Summary

**What Works:**
- ✅ React/UI loads correctly
- ✅ Form displays properly
- ✅ All other pages work
- ✅ Inventory, Kaizen, Store, Marketing all functional

**What's Broken:**
- ❌ Building creation (500 error)
- ❌ Any feature requiring database writes to ShopBuilding

**What's Needed:**
- 🔧 Run Prisma migration to sync schema
- 🔧 OR temporarily remove problematic fields from API

---

## Recommendation

**Immediate Action:**
1. Use **Option 2** (quick fix) to unblock development
2. This lets you test and deploy other features
3. Building creation will work with basic fields

**Proper Fix (when you have database access):**
1. Run `npx prisma db push`
2. This syncs the full schema
3. All features will work completely

---

## Commands to Run

**Quick Fix (no database access needed):**
```bash
# Edit app/api/buildings/route.ts (see Option 2 above)
git add app/api/buildings/route.ts
git commit -m "fix: temporarily remove optional fields from building creation"
npm run dev
# Test at http://localhost:3002/buildings/new
```

**Proper Fix (requires database access):**
```bash
npx prisma db push
npm run dev
# Test at http://localhost:3002/buildings/new
```

---

*Issue identified: January 8, 2026 at 7:40 PM PST*
*Status: Awaiting fix*
*Priority: CRITICAL - Blocks production deployment*
