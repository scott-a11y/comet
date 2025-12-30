import { z } from "zod";

/**
 * BOMV2 layout plan schema.
 *
 * Notes:
 * - We keep backwards compatibility with the old persisted shape where
 *   `layout.canvasState` was a plain `CanvasItem[]`.
 * - New editor features (ports + routing runs + calibration) live in a versioned
 *   object so we can evolve without migrations.
 */

export const SystemTypeSchema = z.enum(["ELECTRICAL", "AIR", "DUCT", "DUST", "PIPING"]);
export type SystemType = z.infer<typeof SystemTypeSchema>;

export const EquipmentPortSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  system: SystemTypeSchema,
  /**
   * Port position in local equipment coords (pixels), relative to the equipment
   * item's top-left BEFORE rotation. We keep it simple for MVP.
   */
  offsetX: z.number(),
  offsetY: z.number(),
});
export type EquipmentPort = z.infer<typeof EquipmentPortSchema>;

// The shape of an item on the canvas (in pixels)
export const CanvasItemSchema = z.object({
  id: z.string(),
  type: z.enum(["WALL", "DOOR", "WINDOW", "EQUIPMENT"]),
  x: z.number(),
  y: z.number(),
  rotation: z.number().default(0),
  width: z.number(),
  length: z.number(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type CanvasItem = z.infer<typeof CanvasItemSchema>;

export const PortRefSchema = z.object({
  itemId: z.string(),
  portId: z.string(),
});
export type PortRef = z.infer<typeof PortRefSchema>;

export const RunSegmentSchema = z.object({
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
});
export type RunSegment = z.infer<typeof RunSegmentSchema>;

export const RunSchema = z.object({
  id: z.string(),
  system: SystemTypeSchema,
  from: PortRefSchema,
  to: PortRefSchema,
  segments: z.array(RunSegmentSchema).min(1),
});
export type Run = z.infer<typeof RunSchema>;

export const LayoutPlanV2Schema = z.object({
  version: z.literal(2),
  /** All geometry stored in pixels. */
  items: z.array(CanvasItemSchema),
  /** Orthogonal runs between ports (in pixels). */
  runs: z.array(RunSchema).default([]),
  /** Calibration: how many feet per pixel in the editor stage. */
  ftPerPx: z.number().nullable().default(null),
});
export type LayoutPlanV2 = z.infer<typeof LayoutPlanV2Schema>;

// Backcompat: legacy persisted value is CanvasItem[]
export const LayoutPlanSchema = z.union([z.array(CanvasItemSchema), LayoutPlanV2Schema]);
export type LayoutPlan = z.infer<typeof LayoutPlanSchema>;

export const SaveLayoutSchema = z.object({
  id: z.string().optional(),
  buildingId: z.string(),
  name: z.string().min(1, "Name is required"),
  // For new features we persist LayoutPlanV2, but keep accepting the old shape.
  canvasState: LayoutPlanSchema,
});

export type SaveLayoutInput = z.infer<typeof SaveLayoutSchema>;

export function normalizeLayoutPlan(input: unknown): LayoutPlanV2 {
  const parsed = LayoutPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { version: 2, items: [], runs: [], ftPerPx: null };
  }
  if (Array.isArray(parsed.data)) {
    return { version: 2, items: parsed.data, runs: [], ftPerPx: null };
  }
  return {
    version: 2,
    items: parsed.data.items ?? [],
    runs: parsed.data.runs ?? [],
    ftPerPx: parsed.data.ftPerPx ?? null,
  };
}