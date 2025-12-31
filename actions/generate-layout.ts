"use server";

import { z } from "zod";
import { createServerAction } from "zsa";
import OpenAI from "openai";
import { env } from "@/lib/env";
import { machinerySpecsSchema } from "@/lib/validations/machinery";
import { prisma } from "@/lib/prisma"; // Assuming global prisma client

const generateLayoutInputSchema = z.object({
    buildingId: z.number(),
    specs: machinerySpecsSchema,
});

export const generateEquipmentPlacement = createServerAction()
    .input(generateLayoutInputSchema)
    .handler(async ({ input }) => {
        if (!env.OPENAI_API_KEY) throw new Error("Missing OpenAI API Key");

        // 1. Fetch building geometry
        const building = await prisma.shopBuilding.findUnique({
            where: { id: input.buildingId },
            select: { floorGeometry: true, widthFt: true, depthFt: true }
        });

        if (!building) throw new Error("Building not found");

        // 2. Prepare Context for AI
        const roomContext = {
            width: building.widthFt || 50, // Fallback
            depth: building.depthFt || 50,
            geometry: building.floorGeometry || "Rectangular 50x50", // Simplify if complex JSON
        };

        const machineContext = input.specs;

        // 3. Call OpenAI
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an industrial layout engine. Given a room size and a machine's specs (dimensions, clearance), suggest a VALID placement (x, y, rotation).
          
          Rules:
          1. Machine must fit inside the room.
          2. Machine back/sides should generally align with walls if it has clearance requirements, or be central if it's a main work center.
          3. 'x' and 'y' are in feet, from top-left (0,0).
          4. 'rotation' is 0, 90, 180, 270 degrees.
          
          Return JSON: { x: number, y: number, rotation: number, reasoning: string }`
                },
                {
                    role: "user",
                    content: JSON.stringify({ room: roomContext, machine: machineContext })
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("AI Placement failed");

        const placement = JSON.parse(content);

        return {
            success: true,
            placement: placement
        };
    });
