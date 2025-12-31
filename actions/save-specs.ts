"use server";

import { z } from "zod";
import { createServerAction } from "zsa";
import { prisma } from "@/lib/prisma";
import { machinerySpecsSchema } from "@/lib/validations/machinery";
import { revalidatePath } from "next/cache";

// Input schema
const saveSpecsInputSchema = z.object({
    buildingId: z.number().int().positive(),
    specs: machinerySpecsSchema,
});

export const saveMachinerySpecs = createServerAction()
    .input(saveSpecsInputSchema)
    .handler(async ({ input }) => {
        const { buildingId, specs } = input;

        try {
            // update the building with the extracted data
            // we store it in the extractedData JSON column
            const updatedBuilding = await prisma.shopBuilding.update({
                where: { id: buildingId },
                data: {
                    extractedData: specs as any, // Cast to any for JSON compatibility
                },
            });

            revalidatePath(`/buildings/${buildingId}`);

            return { success: true, building: updatedBuilding };
        } catch (error) {
            console.error("Failed to save specs to building:", error);
            throw new Error("Failed to save specifications to the building record.");
        }
    });
