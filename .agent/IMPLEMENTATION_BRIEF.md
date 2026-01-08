# Implementation Brief: Advanced AI Vision Analysis

## Objective
Enhance the floor plan analysis to detect specific machine identities and their connection ports (Inlet/Outlet). This enables automatic equipment placement from a simple photo.

## Technical Details
- **Location:** `actions/analyze.ts` (Update prompt and logic)
- **Schema:** `lib/validations/analysis.ts` (Update `analysisDataSchema`)

## Features
1. **Equipment Identification:**
   - Detect machines by type (Table Saw, CNC, Sander).
   - Match identified machines to the existing `equipment` catalog.
2. **Port Detection:**
   - Identify locations for Dust Collection ports and Electrical drops on the floorplan image.
   - Return relative coordinates (normalized 0.0 - 1.0).
3. **Automated Layout Generation:**
   - Create a `LayoutInstance` populated with detected equipment at the correct estimated positions.

## Acceptance Criteria
- [ ] OpenAI prompt updated to include equipment and port detection.
- [ ] Zod schema updated to validate `equipmentMatches` and `portLocations`.
- [ ] Integration test showing automated layout creation from mockup data.
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
