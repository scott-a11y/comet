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
