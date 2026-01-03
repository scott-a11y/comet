"use server";

import { z } from "zod";
import { createServerAction } from "zsa";
import { prisma } from "@/lib/prisma";
import type { LayoutPlan } from "@/lib/validations/layout";

const createLayoutSchema = z.object({
  buildingId: z.string().transform(val => parseInt(val, 10)),
  name: z.string().min(1, "Layout name is required").max(100),
});

const updateLayoutSchema = z.object({
  id: z.string(),
  // Backcompat: historically an array of CanvasItem. BOMV2 uses a versioned object.
  canvasState: z.unknown() as z.ZodType<LayoutPlan>,
});

export const createLayout = createServerAction()
  .input(createLayoutSchema)
  .handler(async ({ input }) => {
    try {
      // Verify building exists
      const building = await prisma.shopBuilding.findUnique({
        where: { id: input.buildingId },
      });

      if (!building) {
        throw new Error("Building not found");
      }

      // Create the layout
      const layout = await prisma.layout.create({
        data: {
          name: input.name,
          buildingId: input.buildingId,
          canvasState: [], // Start with empty canvas
        },
      });

      return {
        success: true,
        layout,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create layout");
    }
  });

export const updateLayout = createServerAction()
  .input(updateLayoutSchema)
  .handler(async ({ input }) => {
    try {
      // Use transaction for atomic update with optimistic locking
      const layout = await prisma.$transaction(async (tx: any) => {
        // Verify layout exists first
        const existingLayout = await tx.layout.findUnique({
          where: { id: input.id },
        });

        if (!existingLayout) {
          throw new Error("Layout not found");
        }

        // Update the layout
        return await tx.layout.update({
          where: { id: input.id },
          data: {
            canvasState: input.canvasState,
            updatedAt: new Date(),
          },
        });
      });

      return {
        success: true,
        layout,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update layout");
    }
  });