# Comet Prompt Library

This file contains high-quality, pre-written prompts for future features. You can copy and paste these to ensure I (or any AI) have the full technical context needed to implement features correctly.

## ⚡ Feature: Electrical Run Drawing Tool
**Context**: Re-implements or expands the circuit routing framework.
**Prompt**:
> "Now that we have the Main Power Entry point, let's implement the **Electrical Run Drawing** tool. It should allow me to draw polylines for electrical runs, snap them to the Grid or Power Entry point, and specify the wire gauge or circuit capacity. Ensure these runs are saved in the `systemRuns` array and rendered correctly on a separate 'Electrical Layer' in the canvas."

---

# 🎓 Prompt Engineering Lessons

To get the best results for complex CAD or UI features, use the **C.I.D.V. Framework**:

1. **Context**: Mention the current file or component (e.g., "In the `ImprovedWallEditor`...").
2. **Interaction**: Describe the user's action (e.g., "When I click the 'Run' button and start dragging...").
3. **Data**: Tell me where to store the result (e.g., "Save these as objects in the `systemRuns` array").
4. **Visuals**: Specify the design (e.g., "Use a 2px Dashed Orange line with a slight glow").

---
*Created on 2026-01-10*
