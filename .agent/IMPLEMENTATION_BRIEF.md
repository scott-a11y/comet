# Implementation Brief: Routing BOM Engine

## Objective
Implement a "Bill of Materials" (BOM) calculation engine for the electrical and ducting systems. This converts abstract routing lines into a list of physical hardware (pipes, elbows, connectors) with cost estimates.

## Technical Details
- **Location:** `lib/systems/bom.ts` (New File)
- **Integration:** Update `lib/systems/electrical.ts` and `lib/systems/ducting.ts` to provide BOM data.

## Features
1. **Linear Calculation:**
   - Calculate total length of pipe/wire.
   - Account for "Waste Factor" (10-15%).
2. **Fitting Detection:**
   - Detect turns (elbows) based on segment angles.
   - Detect connections to equipment (adapters).
3. **Cost Estimation:**
   - Standard pricing per foot for different wire gauges and pipe diameters.
   - Fixed pricing for fittings (elbows, blast gates).

## Acceptance Criteria
- [ ] `calculateBOM(segments: RoutingSegment[])` function returns a typed BOM object.
- [ ] Supports both Electrical (Wire + Conduit) and Ducting (Galvanized Pipe).
- [ ] Unit tests in `test/bom.test.ts`.
