import { z } from "zod";

// The shape of an item on the canvas
export const CanvasItemSchema = z.object({
  id: z.string(),
  type: z.enum(["WALL", "DOOR", "WINDOW", "EQUIPMENT"]),
  x: z.number(),
  y: z.number(),
  rotation: z.number().default(0),
  width: z.number(),
  length: z.number(),
  metadata: z.record(z.string(), z.any()).optional(), // specific props like voltage, airflow
});

export const SaveLayoutSchema = z.object({
  id: z.string().optional(), // Optional for new layouts
  buildingId: z.string(),
  name: z.string().min(1, "Name is required"),
  canvasState: z.array(CanvasItemSchema), // The JSON blob is strictly an array of items
});

export type CanvasItem = z.infer<typeof CanvasItemSchema>;
export type SaveLayoutInput = z.infer<typeof SaveLayoutSchema>;
